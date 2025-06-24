import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

// 由于 "type": "module"，我们需要用这种方式获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 8080;

// 设置静态文件目录
app.use(express.static(path.join(__dirname, 'dist')));

// 对于所有其他请求，返回 index.html，这样 React Router 才能正常工作
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`服务器正在运行，请访问 http://localhost:${port}`);
});
