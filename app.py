from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import re
import copy
import datetime
from docx import Document
from docx.shared import Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
import io

app = Flask(__name__)
CORS(app)  # 允许跨域请求，以便前端可以调用

# --- 应用配置 ---
CONFIG = {
    'TEMPLATE_PATH': '渗透报告模板.docx'
}

# --- 从 doc_generator.py 迁移过来的核心函数 ---

def replace_text_in_element(element, replacements):
    """在一个元素（如文档、页眉、单元格）内递归替换文本。"""
    for para in element.paragraphs:
        for key, value in replacements.items():
            if key in para.text:
                for run in para.runs:
                    if key in run.text:
                        run.text = run.text.replace(key, str(value))

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

        p.text = f"5.1.{i+1} 【{vuln.get('risk', '')}】{vuln.get('name', '')}"

        table.cell(0, 1).text = vuln.get('description', '')
        table.cell(2, 1).text = vuln.get('advice', '')
        
        cell = table.cell(1, 1)
        clear_cell_content(cell)
        p_text = cell.paragraphs[0]
        p_text.add_run(vuln.get('process', {}).get('text', ''))

        image_path = vuln.get('process', {}).get('image_path', '')
        if image_path and os.path.exists(image_path):
            try:
                p_image = cell.add_paragraph()
                run = p_image.add_run()
                run.add_picture(image_path, width=Inches(5.0))
                p_image.alignment = WD_ALIGN_PARAGRAPH.CENTER
            except Exception as e:
                cell.add_paragraph(f'\n[图片添加失败: {e}]')

# --- API Endpoint ---

@app.route('/api/generate-report', methods=['POST'])
def generate_report_endpoint():
    """接收前端数据并生成报告的API端点。"""
    try:
        data = request.json
        
        replacements = {
            '#SYSTEM#': data.get('systemName', ''),
            '#DATA#': data.get('reportDate', ''),
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

        timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        filename = f"渗透测试报告_{timestamp}.docx"

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
    app.run(debug=True, port=5001)
