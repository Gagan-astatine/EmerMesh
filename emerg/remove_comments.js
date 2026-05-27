const fs = require('fs');
const path = require('path');

function processDir(dir) {
    fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            
            // Remove full-line single-line comments
            content = content.replace(/^\s*\/\/.*$/gm, '');
            
            // Remove block comments
            content = content.replace(/\/\*[\s\S]*?\*\//g, '');
            
            // Remove JSX comments { /* ... */ }
            content = content.replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '');
            
            // Remove double empty lines that might result
            content = content.replace(/\n\s*\n\s*\n/g, '\n\n');

            fs.writeFileSync(fullPath, content);
        }
    });
}

processDir(path.join(__dirname, 'src'));
processDir(path.join(__dirname, 'backend'));
console.log('Comments removed.');
