const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
let index = 0;
while ((index = content.indexOf('decrypt', index)) !== -1) {
  console.log(`Found at ${index}`);
  console.log(content.substring(index - 100, index + 200));
  index += 1;
}
