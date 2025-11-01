/**
 * Build-time CSS template literal minifier
 *
 * This script can be used to minify CSS in template literals during the build process.
 * However, for most cases, the JS minifier already handles string compression well enough.
 *
 * Use this if you need aggressive CSS minification in JS files.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Simple CSS minifier for template literals
 */
function minifyCSS(css) {
  return css
    // Remove comments
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    // Remove spaces around special characters
    .replace(/\s*([{}:;,>~+])\s*/g, '$1')
    // Remove trailing semicolons
    .replace(/;}/g, '}')
    // Remove leading/trailing whitespace
    .trim();
}

/**
 * Process a TypeScript file and minify CSS template literals
 */
async function processFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');

  // Match template literals that look like CSS (simple heuristic)
  const processed = content.replace(
    /export const \w+_STYLES = `([\s\S]*?)`;/g,
    (match, cssContent) => {
      const minified = minifyCSS(cssContent);
      return match.replace(cssContent, minified);
    }
  );

  if (processed !== content) {
    console.log(`Minified CSS in: ${path.basename(filePath)}`);
    await fs.writeFile(filePath, processed, 'utf-8');
  }
}

/**
 * Find all *Styles.ts files in the project
 */
async function findStyleFiles(dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });

  for (const item of items) {
    const fullPath = path.join(dir, item.name);

    if (item.isDirectory() && !item.name.includes('node_modules')) {
      files.push(...await findStyleFiles(fullPath));
    } else if (item.isFile() && item.name.endsWith('Styles.ts')) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Main execution
 */
async function main() {
  const srcDir = path.join(__dirname, '..', 'src');
  console.log('Finding style files...');

  const styleFiles = await findStyleFiles(srcDir);
  console.log(`Found ${styleFiles.length} style files`);

  for (const file of styleFiles) {
    await processFile(file);
  }

  console.log('✓ CSS minification complete');
}

main().catch(console.error);
