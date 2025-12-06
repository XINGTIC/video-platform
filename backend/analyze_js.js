const fs = require('fs');

function searchFiles() {
    const files = ['vendor.js', 'index.js'];
    const patterns = [
        /https?:\/\/[^\s"']+/g,
        /oss/i,
        /cdn/i,
        /image\//,
        /jhimage\//,
        /jpe\//,
        /VITE_GLOB_UPLOAD_URL/
    ];

    files.forEach(file => {
        try {
            const content = fs.readFileSync(file, 'utf8');
            console.log(`\nScanning ${file}...`);
            
            patterns.forEach(pattern => {
                const matches = content.match(pattern);
                if (matches) {
                    console.log(`Found ${pattern}:`, matches.slice(0, 5));
                }
            });

            // Search for string concatenation that might look like url construction
            const urlConstr = content.match(/["']\s*\+\s*[a-zA-Z0-9_]+\s*\+\s*["']/g);
            if (urlConstr) {
                console.log('Possible URL constructions:', urlConstr.slice(0, 5));
            }

        } catch (e) {
            console.log(`Error reading ${file}:`, e.message);
        }
    });
}

searchFiles();
