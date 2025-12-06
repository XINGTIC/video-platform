const fs = require('fs');

const content = fs.readFileSync('bundle.js', 'utf8');
const regex = /\/video\/[a-zA-Z0-9_/]+/g;
let match;
const endpoints = new Set();

while ((match = regex.exec(content)) !== null) {
    endpoints.add(match[0]);
}

console.log('Found endpoints:', [...endpoints]);
