请按照以下步骤操作：
```sh
# 第 1 步：导航到项目目录。
cd <YOUR_PROJECT_NAME>

# 第 2 步：安装必要的依赖项。
npm i

# 第 3 步: 安装 Python 依赖项。
pip install -r requirements.txt

# 第 4 步：运行服务器启动脚本。
pm2 start server.js
pm2 start app.py -x --interpreter python
pm2 startup
pm2 save
# 或者
npm run dev
python run.py
```

该项目使用以下技术构建：
- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS