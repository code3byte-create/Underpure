const fs = require('fs');
const path = require('path');

const targetDir = 'c:/Users/sb850/OneDrive/Desktop/UNDERPURE F+B/FRONTNEND/src/app';

function replaceInDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('£')) {
        content = content.replace(/£/g, 'Rs. ');
        fs.writeFileSync(fullPath, content);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

replaceInDir(targetDir);
console.log('Replacement complete.');
