import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ?
            walkDir(dirPath, callback) : callback(path.join(dir, f));
    });
}

walkDir(path.join(__dirname, 'src'), function (filePath) {
    if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let original = content;

        // Pattern to match: <Grid item xs={12} sm={6} ...>
        // Just find <Grid item ...>
        const gridItemRegex = /<Grid\s+item([^>]*)>/g;

        content = content.replace(gridItemRegex, (match, propsStr) => {
            const propRegex = /(xs|sm|md|lg|xl)=\{([^}]+)\}/g;
            let propsPart = '';
            let otherProps = propsStr;

            let matchProp;
            const sizeProps = [];
            while ((matchProp = propRegex.exec(propsStr)) !== null) {
                sizeProps.push(`${matchProp[1]}: ${matchProp[2]}`);
                otherProps = otherProps.replace(matchProp[0], '');
            }

            otherProps = otherProps.trim();

            if (sizeProps.length > 0) {
                let sizeStr = `size={{ ${sizeProps.join(', ')} }}`;
                if (otherProps) {
                    return `<Grid ${sizeStr} ${otherProps}>`;
                }
                return `<Grid ${sizeStr}>`;
            } else {
                if (otherProps) return `<Grid ${otherProps}>`;
                return `<Grid>`;
            }
        });

        if (content !== original) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`Updated ${filePath}`);
        }
    }
});
