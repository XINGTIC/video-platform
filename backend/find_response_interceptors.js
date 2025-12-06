const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
const index = content.indexOf('responseInterceptors:');
if (index !== -1) {
  console.log(content.substring(index - 500, index + 2000));
} else {
  console.log('Not found');
}
