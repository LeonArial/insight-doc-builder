请按照以下步骤操作：
```sh
# 第 1 步：安装必要的依赖项。
npm i
npm run build

# 第 2 步: 安装 Python 依赖项。
pip install -r requirements.txt

# 第 3 步：运行服务器启动脚本。
pm2 start server.js
pm2 start app.py -x --interpreter python
pm2 start daily.py -x --interpreter python
pm2 save
# 或者
npm run dev || node server.js
python app.py
python daily.py
```

# 介绍

这是一个用于生成渗透测试报告和日报的工具。

- 渗透报告生成器: http://localhost:8080
- 日报生成器: http://localhost:8080/daily

## API 接口

### 渗透报告生成器

- `POST /api/generate-report`: 生成报告
- `POST /api/ai-generate`: AI 生成内容

### 日报生成器

- `POST /upload`: 上传文件
- `GET /generated/<filename>`: 获取生成的日报

## 目录结构

- **generated/**: 存放生成的报告文件的目录。
- **public/**: Vite 项目的公共资源目录。
- **src/**: 前端项目源代码目录。
  - **api/**: 后端 API 接口定义。
  - **pages/**: React 组件。
  - **components/**: 渗透报告相关组件。
    - **report/**: 拆分组件。
    - **ui/**: shadcn-ui 组件。
- **uploads/**: 用户上传文件的存放目录。
- **app.py**: 渗透报告生成器的 Flask 后端服务。
- **daily.py**: 日报生成器的 Flask 后端服务。
- **server.js**: 用于提供前端静态文件的 Node.js 服务。
- **vite.config.ts**: Vite 配置文件。
- **tailwind.config.ts**: Tailwind CSS 配置文件。
- **渗透报告模板.docx**: 报告模板文件。
- **referance.py**: 参考代码。
- **debug_docxTOmd.py**: 调试脚本。
- **template_analysis.md**: 调试生成的分析文档。
