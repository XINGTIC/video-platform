const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
const index = content.indexOf('function Dg');
if (index !== -1) {
  console.log(content.substring(index, index + 200));
}
