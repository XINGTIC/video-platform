const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
let index = 0;
while ((index = content.indexOf('AES.decrypt', index)) !== -1) {
  console.log(`Found at ${index}`);
  console.log(content.substring(index - 200, index + 300));
  index += 1;
}
