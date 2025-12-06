const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
const index = content.indexOf('interceptors.response');
if (index !== -1) {
  console.log(content.substring(index - 1000, index + 2000));
} else {
    console.log('Not found');
}
