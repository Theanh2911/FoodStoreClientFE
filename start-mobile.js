const { spawn } = require('child_process');

console.log('🚀 Starting Food Store Dashboard for mobile access...');
console.log('📱 Your iPhone can access: http://192.168.1.15:3001');

const child = spawn('npx', ['next', 'dev', '--hostname', '0.0.0.0', '--port', '3001'], {
  stdio: 'inherit',
  shell: true
});

child.on('error', (error) => {
  console.error('❌ Error starting server:', error);
});

child.on('exit', (code) => {
  console.log(`🛑 Server stopped with code: ${code}`);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  child.kill('SIGTERM');
  process.exit(0);
});
