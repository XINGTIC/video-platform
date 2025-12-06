const fs = require('fs');
const content = fs.readFileSync('bundle.js', 'utf8');
const index = content.indexOf('transformRequestHook');
if (index !== -1) {
  console.log(content.substring(index - 2000, index + 3000));
}
