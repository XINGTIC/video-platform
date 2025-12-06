const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
let index = 0;
while ((index = content.indexOf('jg(', index)) !== -1) {
  // Filter out function definition "function jg("
  if (content.substring(index - 9, index) === 'function ') {
      index += 1;
      continue;
  }
  console.log(`Found call at ${index}`);
  console.log(content.substring(index - 200, index + 200));
  index += 1;
}
