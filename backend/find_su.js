const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
const index = content.indexOf('function su(');
if (index !== -1) {
  console.log(content.substring(index, index + 300));
} else {
  console.log('Not found');
}
