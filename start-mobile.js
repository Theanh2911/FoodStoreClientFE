const { spawn } = require('child_process');

const child = spawn('npx', ['next', 'dev', '--hostname', '0.0.0.0', '--port', '3001'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('❌ Error starting server:', error);
});

child.on('exit', (code) => {
  // Server stopped
});

process.on('SIGINT', () => {
  child.kill('SIGTERM');
  process.exit(0);
});
