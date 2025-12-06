const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('bundle.js', 'utf8');

// Find commitAccessTo
const patterns = ['commitAccessTo'];

patterns.forEach(pattern => {
    let pos = 0;
    while ((pos = content.indexOf(pattern, pos)) !== -1) {
        const start = Math.max(0, pos - 100);
        const end = Math.min(content.length, pos + 200);
        console.log(`Found "${pattern}" at ${pos}:`, content.substring(start, end));
        pos += pattern.length;
    }
});
