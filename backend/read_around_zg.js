const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
const index = content.indexOf('function zg');
if (index !== -1) {
  console.log(content.substring(index - 1000, index + 2000));
}
