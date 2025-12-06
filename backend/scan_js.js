const fs = require('fs');

const content = fs.readFileSync('bundle.js', 'utf8');
// Look for strings inside quotes that start with / and have length > 3
const regex = /["']\/[a-zA-Z0-9_\-\/]+["']/g;
const matches = content.match(regex);

if (matches) {
    // Filter out css/js/png/jpg
    const filtered = matches.filter(m => !m.match(/\.(css|js|png|jpg|svg|ico)/));
    console.log([...new Set(filtered)].join('\n'));
} else {
  console.log('No matches found');
}