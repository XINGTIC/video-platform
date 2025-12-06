const fs = require('fs');
const path = require('path');

const bundlePath = path.join(__dirname, 'bundle.js');
const content = fs.readFileSync(bundlePath, 'utf8');

// Look for calls to su(payload, key)
const regex = /su\(/g;
let match;

console.log('Searching for su calls...');
while ((match = regex.exec(content)) !== null) {
  const start = Math.max(0, match.index - 50);
  const end = Math.min(content.length, match.index + 100);
  console.log(`Context at ${match.index}:`, content.substring(start, end));
}
