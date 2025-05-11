const { spawn } = require('child_process');
const path = require('path');

// Start backend
const backend = spawn('node', ['server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start frontend
const frontend = spawn('npm', ['start'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  backend.kill();
  frontend.kill();
  process.exit();
});

// Log any errors
backend.on('error', (err) => {
  console.error('Backend error:', err);
});

frontend.on('error', (err) => {
  console.error('Frontend error:', err);
}); 