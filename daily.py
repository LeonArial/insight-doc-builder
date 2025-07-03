import os
import subprocess
import uuid
import logging
import time
import threading
from datetime import datetime, timedelta
from flask import Flask, request, render_template, send_from_directory, flash, redirect, url_for
from werkzeug.utils import secure_filename
from flask_cors import CORS

# 配置日志记录
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- 配置 ---
# 定义上传和生成报告的文件夹
UPLOAD_FOLDER = 'uploads'
GENERATED_FOLDER = 'generated'
# 允许的文件扩展名
ALLOWED_EXTENSIONS = {'xlsx', 'xls'}

# --- Flask 应用初始化 ---
app = Flask(__name__)
CORS(app) # 启用CORS，允许跨域请求
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['GENERATED_FOLDER'] = GENERATED_FOLDER
app.config['SECRET_KEY'] = 'a-very-secret-key' # 用于加密 flash 消息

# 确保上传和生成目录存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(GENERATED_FOLDER, exist_ok=True)

def allowed_file(filename):
    """检查文件名是否具有允许的扩展名"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    """渲染主上传页面"""
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_file():
    """处理文件上传和转换逻辑"""
    if 'file' not in request.files:
        flash('请求中没有文件部分')
        return redirect(request.url)
    file = request.files['file']
    if file.filename == '':
        flash('没有选择文件')
        return redirect(request.url)

    if file and allowed_file(file.filename):
        # 使用UUID确保文件名唯一，避免并发处理时文件冲突
        unique_id = str(uuid.uuid4())
        input_filename = f"{unique_id}-{secure_filename(file.filename)}"
        output_filename = f"{unique_id}-report.html"

        # 使用绝对路径以确保 subprocess 能在任何位置正确找到文件
        input_path = os.path.abspath(os.path.join(app.config['UPLOAD_FOLDER'], input_filename))
        output_path = os.path.abspath(os.path.join(app.config['GENERATED_FOLDER'], output_filename))
        
        file.save(input_path)
        logging.info(f"文件已保存到: {input_path}")

        # 定位核心处理脚本
        script_path = os.path.abspath(os.path.join(os.path.dirname(__file__), 'src/api/excel_to_html.py'))

        # 使用 subprocess 调用核心处理脚本
        try:
            logging.info(f"正在执行命令: python \"{script_path}\" --input \"{input_path}\" --output \"{output_path}\"")
            
            # 在Windows上，使用utf-8编码来捕获输出，防止乱码
            result = subprocess.run(
                ['python', script_path, '--input', input_path, '--output', output_path],
                capture_output=True, text=True, check=True, encoding='utf-8', errors='replace'
            )
            
            logging.info(f"脚本执行成功. STDOUT: {result.stdout}")
            # 脚本成功执行，重定向到下载页面
            return redirect(url_for('download_file', filename=output_filename))

        except subprocess.CalledProcessError as e:
            # 脚本执行失败，记录并显示详细错误
            logging.error(f"脚本执行失败. 返回码: {e.returncode}")
            logging.error(f"STDOUT: {e.stdout}")
            logging.error(f"STDERR: {e.stderr}")
            error_message = f"文件处理失败。错误详情: {e.stderr}"
            flash(error_message)
            return redirect(url_for('index'))
    else:
        flash('文件类型不被允许。请上传 .xls 或 .xlsx 文件。')
        return redirect(request.url)

@app.route('/generated/<filename>')
def download_file(filename):
    """提供已生成报告的下载，并设置用户友好的文件名。"""
    report_date_str = (datetime.now()).strftime('%Y-%m-%d')
    download_name = f'运维中心日报-{report_date_str}.html'

    return send_from_directory(
        app.config['GENERATED_FOLDER'],
        filename,
        as_attachment=True,
        download_name=download_name
    )

def cleanup_worker():
    """定期清理旧文件的后台工作线程。"""
    logging.info("清理线程已启动，将每小时检查一次旧文件。")
    while True:
        try:
            folders_to_clean = [app.config['UPLOAD_FOLDER'], app.config['GENERATED_FOLDER']]
            max_age_seconds = 3600 # 文件保留1小时

            for folder in folders_to_clean:
                if not os.path.isdir(folder):
                    continue
                
                for filename in os.listdir(folder):
                    file_path = os.path.join(folder, filename)
                    try:
                        # 确保是文件
                        if not os.path.isfile(file_path):
                            continue

                        file_age = time.time() - os.path.getmtime(file_path)
                        if file_age > max_age_seconds:
                            os.remove(file_path)
                            logging.info(f"已自动清理旧文件: {file_path}")
                    except Exception as e:
                        logging.error(f"清理文件 {file_path} 时出错: {e}")
        except Exception as e:
            logging.error(f"后台清理线程遇到错误: {e}")
        
        # 等待一小时后再次运行
        time.sleep(3600)


if __name__ == '__main__':
    # 将清理任务放到后台线程中运行
    # daemon=True 确保主程序退出时，该线程也会随之退出
    cleanup_thread = threading.Thread(target=cleanup_worker, daemon=True)
    cleanup_thread.start()

    app.run(host='0.0.0.0', port=5002, debug=True)