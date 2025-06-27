from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import os
import tempfile
from docx import Document
import io
import pythoncom
import requests
import sys

# sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'src/components/api')))
sys.path.append('src/api')
from def_unit import *
from ai_request import *

app = Flask(__name__)
CORS(app, expose_headers=['Content-Disposition'])  # 允许跨域请求，并暴露Content-Disposition头

# --- 应用配置 ---
# 获取当前脚本所在的目录的绝对路径
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATE_PATH = os.path.join(BASE_DIR, '渗透报告模板.docx')

CONFIG = {
    'TEMPLATE_PATH': TEMPLATE_PATH,
    'AI_API_URL': 'https://api.siliconflow.cn/v1/chat/completions',
    'AI_API_KEY': 'Bearer sk-dmowsenrtifmlnpmlhaatxgkxnhbmusjfzgnofvlhtblslwa'
}

# --- API 端点 ---
@app.route('/api/generate-report', methods=['POST'])
def generate_report_endpoint():
    """接收前端数据并生成报告的API端点。"""
    try:
        data = request.json
        
        vulnerabilities = data.get('vulnerabilities', [])

        # 按风险等级统计漏洞数量
        gw_num = sum(1 for v in vulnerabilities if v.get('risk') == '高危')
        zw_num = sum(1 for v in vulnerabilities if v.get('risk') == '中危')
        dw_num = sum(1 for v in vulnerabilities if v.get('risk') == '低危')

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
            '#CSACCOUNT#': data.get('testAccount', ''),
            '#GWNUM#': str(gw_num),
            '#ZWNUM#': str(zw_num),
            '#DWNUM#': str(dw_num),
        }

        template_path = CONFIG['TEMPLATE_PATH']
        if not os.path.exists(template_path):
            return jsonify({"error": f"模板文件未找到: {template_path}"}), 404

        doc = Document(template_path)

        # 生成并插入漏洞统计图表
        chart_buffer = create_vulnerability_chart(gw_num, zw_num, dw_num)
        replace_placeholder_with_chart(doc, '#TABLE#', chart_buffer)

        replace_general_placeholders(doc, replacements)
        populate_vulnerabilities(doc, vulnerabilities, replacements['#SYSTEM#'])

        # 使用临时文件来保存文档，以便后续更新目录
        with tempfile.NamedTemporaryFile(delete=False, suffix='.docx') as temp_doc:
            temp_path = temp_doc.name
        
        try:
            doc.save(temp_path)

            # 更新目录
            update_toc(os.path.abspath(temp_path))

            # 将更新后的文件读入内存流
            file_stream = io.BytesIO()
            with open(temp_path, 'rb') as f:
                file_stream.write(f.read())
            file_stream.seek(0)
        finally:
            # 确保临时文件被删除
            os.remove(temp_path)

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
        error_message = f"生成报告时出错: {e}"
        print(error_message)
        # 检查是否为特定的RPC错误
        if isinstance(e, pythoncom.com_error) and e.hresult == -2147023170:
            error_message = "生成报告失败：无法与Word程序通信（远程过程调用失败）。请确保Word已正确安装且没有在后台挂起或出错的进程。"
        return jsonify({"error": error_message}), 500

@app.route('/api/ai-generate', methods=['POST'])
def ai_generate_text():
    try:
        data = request.json
        vuln_name = data.get('vuln_name')
        prompt_type = data.get('prompt_type')

        if not vuln_name:
            return jsonify({"error": "需要填写漏洞名称"}), 400
        if not prompt_type or prompt_type not in ['description', 'advice']:
            return jsonify({"error": "需要选择有效的生成类型"}), 400

        content = generate_text_from_ai(
            vuln_name,
            prompt_type,
            CONFIG['AI_API_URL'],
            CONFIG['AI_API_KEY']
        )
        return jsonify({"content": content})

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"AI API 请求失败: {e}"}), 500
    except Exception as e:
        return jsonify({"error": f"发生意外错误: {e}"}), 500

if __name__ == '__main__':
    # 端口5001以避免与Vite的默认端口冲突
    app.run(host='0.0.0.0', debug=True, port=5001)
