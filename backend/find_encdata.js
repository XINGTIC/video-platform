const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
const patterns = ['.encData', '["encData"]', '"encData"'];
patterns.forEach(p => {
  let index = 0;
  while ((index = content.indexOf(p, index)) !== -1) {
    console.log(`Found '${p}' at ${index}`);
    console.log(content.substring(index - 100, index + 100));
    index += 1;
  }
});
