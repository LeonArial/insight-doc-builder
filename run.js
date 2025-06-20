import { spawn } from 'child_process';
import os from 'os';

function runInTerminal(command, args, title) {
  const platform = os.platform();
  if (platform === 'win32') {
    // Windows: 使用 start 命令在新窗口运行
    spawn('cmd', ['/c', 'start', '""', 'cmd', '/k', `${command} ${args.join(' ')}`], {
      detached: true,
      stdio: 'ignore'
    });
  } else if (platform === 'darwin') {
    // macOS: 使用 osascript 打开新 Terminal
    spawn('osascript', [
      '-e',
      `tell application "Terminal" to do script "${command} ${args.join(' ')}"`
    ], { detached: true, stdio: 'ignore' });
  } else {
    // Linux: 使用 x-terminal-emulator 或 gnome-terminal
    const terminal = process.env.COLORTERM || process.env.TERM_PROGRAM || 'x-terminal-emulator';
    spawn(terminal, ['-e', `${command} ${args.join(' ')}`], {
      detached: true,
      stdio: 'ignore'
    });
  }
}

// 启动 python app.py
runInTerminal('python', ['app.py'], 'Python App');

// 启动 npm run dev
runInTerminal('npm', ['run', 'dev'], 'Vite Dev');

console.log('已在新终端窗口中启动 python app.py 和 npm run dev');
