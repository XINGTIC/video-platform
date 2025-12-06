const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
const index = content.indexOf('User-Mark');
if (index !== -1) {
  console.log(content.substring(index - 500, index + 500));
} else {
  console.log('Not found');
}
