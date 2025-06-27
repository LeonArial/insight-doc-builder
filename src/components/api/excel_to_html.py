import pandas as pd
from jinja2 import Environment, FileSystemLoader
from datetime import datetime, timedelta
import os

# 启用 pandas 的未来行为以消除警告
pd.set_option('future.no_silent_downcasting', True)

def excel_to_html(excel_path, template_path, output_path):
    """
    读取 Excel 文件中的所有工作表，并使用 Jinja2 模板生成 HTML 报告。
    """
    def clean_data(df_to_clean):
        """
        通过格式化日期列和类似整数的浮点数列来清理 DataFrame。
        """
        df = df_to_clean.copy()
        # 清理日期列：移除时间部分
        date_cols = [col for col in df.columns if '时间' in col]
        for col in date_cols:
            df[col] = pd.to_datetime(df[col], errors='coerce').dt.strftime('%Y-%m-%d').replace('NaT', None)
        # 清理类似整数的浮点数列：移除小数部分
        numeric_col_keywords = ['耗时（天）', '告警数量', '计划延期天数', '当日处理', '待处理']
        day_cols = [col for col in df.columns if any(keyword in col for keyword in numeric_col_keywords)]
        for col in day_cols:
            # 将列转换为字符串，然后使用正则表达式移除末尾的 '.0'
            df[col] = df[col].astype(str).str.replace(r'\.0$', '', regex=True).replace('nan', None)
        return df

    def sort_by_group(df_to_sort):
        """
        如果存在“负责小组”列，则按其进行自定义排序（“架构组”优先）。
        """
        if '负责小组' in df_to_sort.columns:
            df_to_sort['sort_key'] = df_to_sort['负责小组'].apply(lambda x: 0 if '架构' in str(x) else 1)
            df_to_sort.sort_values(by=['sort_key', '负责小组'], inplace=True)
            df_to_sort.drop(columns='sort_key', inplace=True)
        return df_to_sort

    def add_sequence_number(df):
        """如果存在“任务名称”列，则添加“.”列。"""
        if '任务名称' in df.columns:
            df.insert(0, '.', range(1, len(df) + 1))
        return df

    try:
        # 加载 Excel 文件
        xls = pd.ExcelFile(excel_path)

        sheets_data = []
        today = datetime.now().date()
        stats = {}
        stats_xingyu = {}

        # 遍历每个工作表
        for sheet_name in xls.sheet_names:
            df = pd.read_excel(xls, sheet_name=sheet_name)

            # 对特定工作表进行特殊处理，划分为三栏
            sheets_to_split = ['运维中心日常计划', '星御专项计划']
            if sheet_name in sheets_to_split and '当前进度' in df.columns and '实际完成时间' in df.columns and '计划开始时间' in df.columns:
                # --- 预处理数据以进行筛选 ---
                df['当前进度'] = pd.to_numeric(df['当前进度'], errors='coerce')
                df['completion_date'] = pd.to_datetime(df['实际完成时间'], errors='coerce').dt.date
                df['start_date'] = pd.to_datetime(df['计划开始时间'], errors='coerce').dt.date

                # --- 筛选“进行中任务” ---
                in_progress_df = df[(df['当前进度'] != 1.0) & (pd.isna(df['completion_date']))].copy()

                # --- 筛选“当日已完成任务” ---
                completed_today_df = df[df['completion_date'] == today].copy()

                # --- 筛选“明日新增任务” ---
                tomorrow = today + timedelta(days=1)
                new_tasks_df = df[df['start_date'] == tomorrow].copy()

                # --- 仅为“运维中心日常计划”计算统计数据 ---
                if sheet_name == '运维中心日常计划':
                    stats = {
                        'in_progress': len(in_progress_df),
                        'completed_today': len(completed_today_df),
                        'new_tasks': len(new_tasks_df)
                    }
                if sheet_name == '星御专项计划':
                    stats_xingyu = {
                        'in_progress': len(in_progress_df),
                        'completed_today': len(completed_today_df),
                        'new_tasks': len(new_tasks_df)
                    }
                
                # --- 清理辅助列 ---
                in_progress_df.drop(columns=['completion_date', 'start_date'], inplace=True, errors='ignore')
                completed_today_df.drop(columns=['completion_date', 'start_date'], inplace=True, errors='ignore')
                new_tasks_df.drop(columns=['completion_date', 'start_date'], inplace=True, errors='ignore')

                # 添加“进行中任务”栏目
                if not in_progress_df.empty:
                    cols_to_drop_inprogress = ['责任人', '计划开始时间', '耗时（天）', '备注', '当前状态', '实际完成时间', '是否按期完成']
                    in_progress_df = in_progress_df.drop(columns=cols_to_drop_inprogress, errors='ignore')
                    in_progress_df = clean_data(in_progress_df)
                    in_progress_df = sort_by_group(in_progress_df)
                    in_progress_df = add_sequence_number(in_progress_df)
                    df_processed = in_progress_df.astype(object).fillna('')
                    sheets_data.append({
                        'name': f'{sheet_name} - 进行中任务',
                        'headers': list(df_processed.columns),
                        'data': df_processed.values.tolist()
                    })

                # 添加“当日已完成任务”栏目
                if not completed_today_df.empty:
                    cols_to_drop = ['责任人', '当前进度', '计划开始时间', '计划完成时间（原）', '计划延期天数', '风险提示', '备注', '当前状态']
                    completed_today_df = completed_today_df.drop(columns=cols_to_drop, errors='ignore')
                    completed_today_df = clean_data(completed_today_df)
                    completed_today_df = sort_by_group(completed_today_df)
                    completed_today_df = add_sequence_number(completed_today_df)
                    df_processed = completed_today_df.astype(object).fillna('')
                    sheets_data.append({
                        'name': f'{sheet_name} - 当日已完成任务',
                        'headers': list(df_processed.columns),
                        'data': df_processed.values.tolist()
                    })

                # 添加“明日新增任务”栏目
                if not new_tasks_df.empty:
                    cols_to_drop_new_tasks = ['责任人', '当前进度', '计划完成时间（新）', '计划延期天数', '实际完成时间', '耗时（天）', '是否按期完成', '备注', '当前状态']
                    new_tasks_df_cleaned = new_tasks_df.drop(columns=cols_to_drop_new_tasks, errors='ignore')
                    new_tasks_df_cleaned = clean_data(new_tasks_df_cleaned)
                    new_tasks_df_cleaned = sort_by_group(new_tasks_df_cleaned)
                    new_tasks_df_cleaned = add_sequence_number(new_tasks_df_cleaned)
                    df_processed = new_tasks_df_cleaned.astype(object).fillna('')
                    sheets_data.append({
                        'name': f'{sheet_name} - 明日新增任务',
                        'headers': list(df_processed.columns),
                        'data': df_processed.values.tolist()
                    })

            else:
                # --- 对所有其他工作表进行通用处理 ---
                if '当前状态' in df.columns:
                    df = df.drop(columns=['当前状态'])
                
                progress_cols = [col for col in df.columns if '进度' in col or '完成率' in col]
                for col in progress_cols:
                    df[col] = pd.to_numeric(df[col], errors='coerce')
                
                df = clean_data(df)
                df = sort_by_group(df)
                df = add_sequence_number(df)
                df_processed = df.astype(object).fillna('')
                
                sheet_info = {
                    'name': sheet_name,
                    'headers': list(df_processed.columns),
                    'data': df_processed.values.tolist()
                }
                sheets_data.append(sheet_info)

        # 设置 Jinja2 环境
        template_dir = os.path.dirname(os.path.abspath(template_path))
        env = Environment(loader=FileSystemLoader(template_dir), autoescape=True)
        template = env.get_template(os.path.basename(template_path))

        # 为模板准备数据
        template_data = {
            'title': '运维中心日报',
            'sheets': sheets_data,
            'report_date': report_date_str,
            'stats': stats,
            'stats_xingyu': stats_xingyu
        }

        # 渲染模板
        html_content = template.render(template_data)

        # 将输出写入 HTML 文件
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
            
        print(f"成功生成HTML报告: {os.path.abspath(output_path)}")

    except FileNotFoundError:
        print(f"错误: 未在 {excel_path} 找到文件")
    except Exception as e:
        print(f"发生错误: {e}")

if __name__ == '__main__':
    # 定义相对于脚本位置的文件路径
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    EXCEL_FILE = os.path.join(BASE_DIR, '运维中心日报.xlsx')
    TEMPLATE_FILE = os.path.join(BASE_DIR, 'template.html')

    # 生成文件名，包含明天的日期
    report_date_str = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
    # OUTPUT_HTML_FILE = os.path.join(BASE_DIR, f'运维中心日报.html')
    OUTPUT_HTML_FILE = os.path.join(BASE_DIR, f'运维中心日报-{report_date_str}.html')

    excel_to_html(EXCEL_FILE, TEMPLATE_FILE, OUTPUT_HTML_FILE)
