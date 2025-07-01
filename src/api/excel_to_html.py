import sys
import pandas as pd
from jinja2 import Environment, FileSystemLoader
from datetime import datetime, timedelta
import os
import win32com.client as win32
import argparse

# 启用 pandas 的未来行为以消除警告
pd.set_option('future.no_silent_downcasting', True)

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

def excel_to_html(excel_path, template_path, output_path, report_date_str):
    """
    读取 Excel 文件中的所有工作表，并使用 Jinja2 模板生成 HTML 报告。
    """
    try:
        # 使用 win32com 强制 Excel 打开并重新保存文件，以修复深层文件损坏问题。
        # 这模拟了手动打开和保存文件的过程，可以解决 openpyxl 无法处理的错误。
        # 注意：此方法需要 Windows 系统并安装了 Excel。
        print("正在使用 Excel 应用程序预处理文件...")
        excel_app = win32.Dispatch('Excel.Application')
        excel_app.Visible = False
        workbook = excel_app.Workbooks.Open(os.path.abspath(excel_path))
        workbook.Save()
        workbook.Close()
        excel_app.Quit()
        print("文件预处理完成。")
    except Exception as e:
        print(f"使用 win32com 预处理文件时出错: {e}")
        # 确保即使出错也尝试关闭 Excel 进程
        if 'excel_app' in locals() and excel_app:
            excel_app.Quit()
        raise

    # 使用 openpyxl 读取预处理后的文件
    try:
        print("正在读取 Excel 数据...")
        xls = pd.ExcelFile(excel_path, engine='openpyxl')
    except Exception as e:
        print(f"使用 openpyxl 读取文件时出错: {e}")
        raise

    sheets_data = []
    today = datetime.now().date()
    stats = {}
    stats_xingyu = {}

    # 遍历每个工作表
    for sheet_name in xls.sheet_names:
        if sheet_name == '数据表':
            continue

        df = pd.read_excel(xls, sheet_name=sheet_name)

        sheets_to_split = ['运维中心日常计划', '星御专项计划']
        if sheet_name in sheets_to_split and '当前进度' in df.columns and '实际完成时间' in df.columns and '计划开始时间' in df.columns:
            df['当前进度'] = pd.to_numeric(df['当前进度'], errors='coerce')
            df['completion_date'] = pd.to_datetime(df['实际完成时间'], errors='coerce').dt.date
            df['start_date'] = pd.to_datetime(df['计划开始时间'], errors='coerce').dt.date

            in_progress_df = df[(df['当前进度'] != 1.0) & (pd.isna(df['completion_date']))].copy()
            completed_today_df = df[df['completion_date'] == today].copy()
            tomorrow = today + timedelta(days=1)
            new_tasks_df = df[df['start_date'] == tomorrow].copy()

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
            
            in_progress_df.drop(columns=['completion_date', 'start_date'], inplace=True, errors='ignore')
            completed_today_df.drop(columns=['completion_date', 'start_date'], inplace=True, errors='ignore')
            new_tasks_df.drop(columns=['completion_date', 'start_date'], inplace=True, errors='ignore')

            if not in_progress_df.empty:
                cols_to_keep_inprogress = ['任务名称', '负责小组', '当前进度', '计划完成时间（原）', '计划完成时间（新）', '计划延期天数', '风险提示']
                existing_cols = [col for col in cols_to_keep_inprogress if col in in_progress_df.columns]
                in_progress_df = in_progress_df[existing_cols]
                in_progress_df = clean_data(in_progress_df)
                in_progress_df = sort_by_group(in_progress_df)
                in_progress_df = add_sequence_number(in_progress_df)
                df_processed = in_progress_df.astype(object).fillna('')
                sheets_data.append({
                    'name': f'{sheet_name} - 进行中任务',
                    'headers': list(df_processed.columns),
                    'data': df_processed.values.tolist()
                })

            if not completed_today_df.empty:
                cols_to_keep_completed = ['任务名称', '负责小组', '实际完成时间（新）', '实际完成时间', '耗时（天）', '是否按期完成']
                existing_cols = [col for col in cols_to_keep_completed if col in completed_today_df.columns]
                completed_today_df = completed_today_df[existing_cols]
                completed_today_df = clean_data(completed_today_df)
                completed_today_df = sort_by_group(completed_today_df)
                completed_today_df = add_sequence_number(completed_today_df)
                df_processed = completed_today_df.astype(object).fillna('')
                sheets_data.append({
                    'name': f'{sheet_name} - 当日已完成任务',
                    'headers': list(df_processed.columns),
                    'data': df_processed.values.tolist()
                })

            if not new_tasks_df.empty:
                cols_to_keep_new_tasks = ['任务名称', '负责小组', '计划开始时间', '计划完成时间（原）', '风险提示']
                existing_cols = [col for col in cols_to_keep_new_tasks if col in new_tasks_df.columns]
                new_tasks_df_cleaned = new_tasks_df[existing_cols]
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
            if sheet_name == '监控告警' and '平台/系统' in df.columns and '父记录' in df.columns:
                df['父记录'] = df['父记录'].fillna('')
                children_map = {}
                root_nodes = []
                for _, row in df.iterrows():
                    parent_name = row['父记录']
                    if parent_name:
                        if parent_name not in children_map:
                            children_map[parent_name] = []
                        children_map[parent_name].append(row)
                    else:
                        root_nodes.append(row)
                sorted_rows = []
                def append_nodes_recursively(nodes):
                    for node in nodes:
                        sorted_rows.append(node)
                        node_name = node['平台/系统']
                        if pd.notna(node_name) and node_name in children_map:
                            append_nodes_recursively(children_map[node_name])
                append_nodes_recursively(root_nodes)
                if sorted_rows:
                    df = pd.DataFrame(sorted_rows).reset_index(drop=True)
                    if '父记录' in df.columns:
                        df = df.drop(columns=['父记录'])

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

    # 设置 Jinja2 环境并渲染模板
    template_dir = os.path.dirname(os.path.abspath(template_path))
    env = Environment(loader=FileSystemLoader(template_dir), autoescape=True)
    template = env.get_template(os.path.basename(template_path))

    template_data = {
        'title': '运维中心日报',
        'sheets': sheets_data,
        'report_date': report_date_str,
        'stats': stats,
        'stats_xingyu': stats_xingyu
    }

    html_content = template.render(template_data)

    # 将输出写入 HTML 文件
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"成功生成HTML报告: {os.path.abspath(output_path)}")

def main():
    parser = argparse.ArgumentParser(description='将Excel文件转换为HTML报告。')
    parser.add_argument('--input', required=True, help='输入的Excel文件路径。')
    parser.add_argument('--output', required=True, help='输出的HTML文件路径。')
    parser.add_argument('--template', default='template.html', help='Jinja2模板文件路径。')
    
    args = parser.parse_args()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    template_path = os.path.join(script_dir, args.template)

    if not os.path.exists(args.input):
        print(f"错误: 输入文件不存在 {args.input}")
        sys.exit(1)

    if not os.path.exists(template_path):
        print(f"错误: 模板文件不存在 {template_path}")
        sys.exit(1)

    report_date_str = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')

    try:
        excel_to_html(args.input, template_path, args.output, report_date_str)
    except Exception as e:
        print(f"执行转换时发生严重错误: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
