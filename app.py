from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import re
import copy
import base64
import tempfile
from bs4 import BeautifulSoup
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_PARAGRAPH_ALIGNMENT
import datetime
from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import io

app = Flask(__name__)
CORS(app, expose_headers=['Content-Disposition'])  # 允许跨域请求，并暴露Content-Disposition头

# --- 应用配置 ---
# 获取当前脚本所在的目录的绝对路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(BASE_DIR, '渗透报告模板.docx')

CONFIG = {
    'TEMPLATE_PATH': TEMPLATE_PATH
}

# --- 从 doc_generator.py 迁移过来的核心函数 ---

def replace_text_in_element(element, replacements):
    """在一个元素（如文档、页眉、单元格）内递归替换文本，支持跨run占位符。"""
    for para in element.paragraphs:
        full_text = ''.join(run.text for run in para.runs)
        replaced = False
        for key, value in replacements.items():
            if key in full_text:
                full_text = full_text.replace(key, str(value))
                replaced = True
        if replaced and para.runs:
            # 清空所有 run
            for run in para.runs:
                run.text = ''
            # 只在第一个 run 填充新内容
            para.runs[0].text = full_text

    for table in element.tables:
        for row in table.rows:
            for cell in row.cells:
                replace_text_in_element(cell, replacements)

def replace_general_placeholders(doc, replacements):
    """替换整个文档中的通用文本占位符。"""
    replace_text_in_element(doc, replacements)
    for section in doc.sections:
        for header in [section.header, section.first_page_header, section.even_page_header]:
            if header:
                replace_text_in_element(header, replacements)
        for footer in [section.footer, section.first_page_footer, section.even_page_footer]:
            if footer:
                replace_text_in_element(footer, replacements)

def clear_paragraph(p):
    """清空一个段落的所有内容。"""
    for run in p.runs:
        run.text = ''

def clear_cell_content(cell):
    """清空一个单元格的所有内容。"""
    for p in cell.paragraphs:
        clear_paragraph(p)

def populate_vulnerabilities(doc, vulnerabilities, system_name):
    """根据模板动态创建和填充漏洞条目。

    此函数执行两个主要操作:
    1. 填充文档顶部的漏洞概要表。
    2. 在文档主体中为每个漏洞动态生成详细信息部分。

    注意: 此函数的实现与 '渗透报告模板.docx' 的内部结构高度耦合。
    它依赖于特定的文本（如 '【#VULNERABILITIES_SECTION#】'）来定位模板元素。
    如果模板被修改，此函数可能需要相应调整。
    """
    # 1. 填充漏洞概要表
    summary_table = next((tbl for tbl in doc.tables if len(tbl.rows) > 0 and len(tbl.columns) > 4 and '系统名称' in tbl.cell(0, 1).text and '漏洞名称' in tbl.cell(0, 2).text), None)
    if summary_table:
        for i in range(len(summary_table.rows) - 1, 0, -1):
            row = summary_table.rows[i]
            row._element.getparent().remove(row._element)
        for i, vuln in enumerate(vulnerabilities, 1):
            cells = summary_table.add_row().cells
            cells[0].text = str(i)
            cells[1].text = system_name
            cells[2].text = vuln.get('name', '')
            cells[3].text = vuln.get('risk', '')
            cells[4].text = vuln.get('description', '')

    # 2. 查找漏洞模板
    p_template = next((p for p in doc.paragraphs if '【#VULNERABILITIES_SECTION#】' in p.text), None)
    t_template = next((tbl for tbl in doc.tables if len(tbl.rows) > 0 and '风险描述' in tbl.cell(0, 0).text), None)

    if not p_template or not t_template:
        if not vulnerabilities:
            if p_template: clear_paragraph(p_template)
            if t_template:
                for row in t_template.rows:
                    for cell in row.cells: clear_cell_content(cell)
        return

    # 3. 克隆模板以创建足够的漏洞槽位
    if len(vulnerabilities) > 1:
        p_template_xml = p_template._p
        t_template_xml = t_template._tbl
        last_element = t_template_xml
        for _ in range(len(vulnerabilities) - 1):
            new_p = copy.deepcopy(p_template_xml)
            new_t = copy.deepcopy(t_template_xml)
            last_element.addnext(new_p)
            new_p.addnext(new_t)
            last_element = new_t

    # 4. 填充所有漏洞槽位
    all_title_paragraphs = [p for p in doc.paragraphs if '【#VULNERABILITIES_SECTION#】' in p.text]
    all_detail_tables = [tbl for tbl in doc.tables if len(tbl.rows) > 0 and '风险描述' in tbl.cell(0, 0).text]

    if not vulnerabilities:
        if all_title_paragraphs: clear_paragraph(all_title_paragraphs[0])
        if all_detail_tables:
            for row in all_detail_tables[0].rows:
                for cell in row.cells: clear_cell_content(cell)
        return

    num_slots_to_fill = min(len(vulnerabilities), len(all_title_paragraphs), len(all_detail_tables))
    for i in range(num_slots_to_fill):
        vuln = vulnerabilities[i]
        p = all_title_paragraphs[i]
        table = all_detail_tables[i]

        # 设置漏洞标题（风险等级和名称）
        risk = vuln.get('risk', '')
        name = vuln.get('name', '')
        
        # 清空段落内容
        clear_paragraph(p)
        
        # 添加格式化后的标题
        run = p.add_run()
        run.text = f"5.1.{i+1} 【"
        
        # 添加风险等级（加粗）
        risk_run = p.add_run(str(risk))
        risk_run.bold = True
        
        # 添加剩余文本
        run = p.add_run(f'】{name}')

        # 处理描述
        description_cell = table.cell(0, 1)
        description = vuln.get('description', '')
        if description and '<' in description and '>' in description:
            # 如果包含HTML标签，使用html_to_docx处理
            html_to_docx(description, description_cell)
        else:
            # 否则直接设置文本
            clear_cell_content(description_cell)
            if description:
                description_cell.text = str(description)
        
        # 处理修复建议
        advice_cell = table.cell(2, 1)
        advice = vuln.get('advice', '')
        if advice and '<' in advice and '>' in advice:
            # 如果包含HTML标签，使用html_to_docx处理
            html_to_docx(advice, advice_cell)
        else:
            # 否则直接设置文本
            clear_cell_content(advice_cell)
            if advice:
                advice_cell.text = str(advice)
        
        # 处理过程（支持富文本）
        cell = table.cell(1, 1)
        process_html = vuln.get('process', {}).get('html', '') or vuln.get('process', {}).get('text', '')
        if process_html and '<' in process_html and '>' in process_html:
            # 如果包含HTML标签，使用html_to_docx处理
            html_to_docx(process_html, cell)
        else:
            # 否则直接设置文本
            clear_cell_content(cell)
            if process_html:
                cell.text = str(process_html)

        image_path = vuln.get('process', {}).get('image_path', '')
        if image_path and os.path.exists(image_path):
            try:
                p_image = cell.add_paragraph()
                run = p_image.add_run()
                run.add_picture(image_path, width=Inches(5.0))
                p_image.alignment = WD_ALIGN_PARAGRAPH.CENTER
            except Exception as e:
                cell.add_paragraph(f'\n[图片添加失败: {e}]')

def html_to_docx(html_content, cell):
    """
    将HTML内容转换为docx格式并添加到指定的单元格中。
    支持以下HTML标签：
    - 段落: <p>
    - 换行: <br>
    - 文本样式: <strong>, <b>, <em>, <i>, <u>
    - 列表: <ul>, <ol>, <li>
    - 图片: <img> (支持base64编码的图片)
    
    Args:
        html_content (str): 要转换的HTML内容
        cell: docx表格单元格对象
    """
    # 清空单元格内容
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.text = ""
    if cell.paragraphs:
        cell.paragraphs[0].text = ""
    
    # 如果没有内容或内容为空，添加一个空段落并返回
    if not html_content or not html_content.strip():
        if not cell.paragraphs:
            cell.add_paragraph()
        return
        
    # 清空单元格内容
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.text = ""
    if len(cell.paragraphs) > 0:
        cell.paragraphs[0].text = ""
    
    # 如果没有内容，添加一个空段落
    if not cell.paragraphs:
        cell.add_paragraph()
    
    # 使用BeautifulSoup解析HTML
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # 处理每个顶级元素
    current_paragraph = cell.paragraphs[0]
    
    def process_element(element, paragraph, list_level=0, list_type=None):
        nonlocal current_paragraph
        
        if element.name == 'p':
            if paragraph.text.strip() != '':  # 如果当前段落不为空，创建新段落
                current_paragraph = cell.add_paragraph()
            for child in element.children:
                if child.name:
                    process_element(child, current_paragraph, list_level, list_type)
                else:
                    if str(child).strip():
                        run = current_paragraph.add_run(str(child))
        
        elif element.name in ['strong', 'b']:
            run = paragraph.add_run()
            run.bold = True
            for child in element.children:
                if child.name:
                    process_element(child, paragraph, list_level, list_type)
                else:
                    run.add_text(str(child))
        
        elif element.name in ['em', 'i']:
            run = paragraph.add_run()
            run.italic = True
            for child in element.children:
                if child.name:
                    process_element(child, paragraph, list_level, list_type)
                else:
                    run.add_text(str(child))
        
        elif element.name == 'u':
            run = paragraph.add_run()
            run.underline = True
            for child in element.children:
                if child.name:
                    process_element(child, paragraph, list_level, list_type)
                else:
                    run.add_text(str(child))
        
        elif element.name in ['ul', 'ol']:
            list_type = 'bullet' if element.name == 'ul' else 'decimal'
            for li in element.find_all('li', recursive=False):
                process_element(li, paragraph, list_level + 1, list_type)
        
        elif element.name == 'li':
            # 添加列表项标记
            if list_type == 'bullet':
                prefix = '•\t'
            else:
                prefix = f'{list_level}.\t'
            
            run = paragraph.add_run(prefix)
            
            # 处理列表项内容
            for child in element.children:
                if child.name and child.name != 'ul' and child.name != 'ol':
                    process_element(child, paragraph, list_level, list_type)
                elif child.name in ['ul', 'ol']:
                    # 处理嵌套列表
                    process_element(child, paragraph, list_level, list_type)
                else:
                    if str(child).strip():
                        run = paragraph.add_run(str(child).strip() + ' ')
            
            # 添加新段落用于下一个列表项或内容
            current_paragraph = cell.add_paragraph()
        
        elif element.name == 'img':
            # 处理base64编码的图片
            src = element.get('src', '')
            if src.startswith('data:image'):
                try:
                    # 提取base64数据
                    img_data = src.split('base64,')[1]
                    img_binary = base64.b64decode(img_data)
                    
                    # 创建临时文件
                    with tempfile.NamedTemporaryFile(delete=False, suffix='.png') as temp_file:
                        temp_file.write(img_binary)
                        temp_path = temp_file.name
                    
                    # 添加图片到文档
                    run = paragraph.add_run()
                    run.add_picture(temp_path, width=Inches(4))  # 设置图片宽度为4英寸
                    
                    # 删除临时文件
                    os.unlink(temp_path)
                    
                    # 添加新段落用于后续内容
                    current_paragraph = cell.add_paragraph()
                    
                except Exception as e:
                    print(f"Error processing image: {e}")
                    paragraph.add_run("[图片加载失败]")
        
        elif element.name == 'br':
            # 添加换行
            paragraph.add_run().add_break()
        
        else:
            # 递归处理子元素
            for child in element.children:
                if child.name:
                    process_element(child, paragraph, list_level, list_type)
                else:
                    if str(child).strip():
                        paragraph.add_run(str(child))
    
    # 处理顶级元素
    for element in soup.children:
        if element.name:
            process_element(element, current_paragraph)
    
    # 移除最后一个空段落（如果有）
    if len(cell.paragraphs) > 1 and not cell.paragraphs[-1].text.strip():
        p = cell.paragraphs[-1]
        p._element.getparent().remove(p._element)

# --- API Endpoint ---

@app.route('/api/generate-report', methods=['POST'])
def generate_report_endpoint():
    """接收前端数据并生成报告的API端点。"""
    try:
        data = request.json
        
        replacements = {
            '#SYSTEM#': data.get('systemName', ''),
            '#DATE#': data.get('reportDate', ''),
            '#SDATE#': data.get('sDate', ''),
            '#IP#': data.get('ipOrDomain', ''),
            '#DATARANGE#': data.get('testDateRange', ''),
            '#DJNAME#': data.get('contactName', ''),
            '#DJPHONE#': data.get('contactPhone', ''),
            '#CSNAME#': data.get('testerName', ''),
            '#CSPHONE#': data.get('testerPhone', ''),
            '#CSACCOUNT#': data.get('testAccount', '')
        }
        vulnerabilities = data.get('vulnerabilities', [])

        template_path = CONFIG['TEMPLATE_PATH']
        if not os.path.exists(template_path):
            return jsonify({"error": f"模板文件未找到: {template_path}"}), 404

        doc = Document(template_path)

        replace_general_placeholders(doc, replacements)
        populate_vulnerabilities(doc, vulnerabilities, replacements['#SYSTEM#'])

        file_stream = io.BytesIO()
        doc.save(file_stream)
        file_stream.seek(0)

        systemName = data.get('systemName', '')
        reportDate = data.get('sDate', '')
        filename = f"CSCEC8B-PT-{reportDate}-01{systemName}.docx"

        return send_file(
            file_stream,
            as_attachment=True,
            download_name=filename,
            mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        )

    except Exception as e:
        print(f"生成报告时出错: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # 端口5001以避免与Vite的默认端口冲突
    app.run(host='0.0.0.0', debug=True, port=5001)
