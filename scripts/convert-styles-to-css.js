#!/usr/bin/env node

/**
 * Script to convert CSS-in-JS template literals to standalone CSS files
 *
 * This script:
 * 1. Reads TypeScript files containing CSS template literals
 * 2. Extracts the CSS content
 * 3. Creates .css files with the extracted content
 * 4. Updates the .ts files to import and re-export the CSS
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');

const styleFiles = [
  {
    ts: 'src/content/overlays/modal/modalStyles.ts',
    css: 'src/content/overlays/modal/modalStyles.css',
    exportName: 'MODAL_STYLES'
  },
  {
    ts: 'src/content/overlays/views/search/searchViewStyles.ts',
    css: 'src/content/overlays/views/search/searchViewStyles.css',
    exportName: 'SEARCH_VIEW_STYLES'
  },
  {
    ts: 'src/content/overlays/views/settings/settingsViewStyles.ts',
    css: 'src/content/overlays/views/settings/settingsViewStyles.css',
    exportName: 'SETTINGS_VIEW_STYLES'
  },
  {
    ts: 'src/content/overlays/views/macroEditor/editorViewStyles.ts',
    css: 'src/content/overlays/views/macroEditor/editorViewStyles.css',
    exportName: 'EDITOR_VIEW_STYLES'
  },
  {
    ts: 'src/content/overlays/searchOverlay/searchOverlayStyles.ts',
    css: 'src/content/overlays/searchOverlay/searchOverlayStyles.css',
    exportName: 'SEARCH_OVERLAY_STYLES'
  },
  {
    ts: 'src/content/overlays/suggestionsOverlay/SuggestionsOverlayStyles.ts',
    css: 'src/content/overlays/suggestionsOverlay/suggestionsOverlayStyles.css',
    exportName: 'SUGGESTIONS_OVERLAY_STYLES'
  }
];

function extractCSSFromTemplate(content, exportName) {
  // Match: export const EXPORT_NAME = `...css...`;
  const regex = new RegExp(`export\\s+const\\s+${exportName}\\s*=\\s*\`([\\s\\S]*?)\`;`, 'm');
  const match = content.match(regex);

  if (!match) {
    throw new Error(`Could not find export const ${exportName} in file`);
  }

  // Remove leading indentation (usually 2 spaces from template literals)
  let css = match[1];

  // Find the minimum indentation (excluding empty lines)
  const lines = css.split('\n');
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);

  if (nonEmptyLines.length === 0) return css;

  const minIndent = Math.min(...nonEmptyLines.map(line => {
    const match = line.match(/^(\s*)/);
    return match ? match[1].length : 0;
  }));

  // Remove the minimum indentation from all lines
  const dedented = lines.map(line => {
    if (line.trim().length === 0) return '';
    return line.slice(minIndent);
  }).join('\n');

  return dedented.trim();
}

function extractComments(content) {
  // Extract JSDoc comments at the top of the file
  const commentRegex = /^(\/\*\*[\s\S]*?\*\/)/;
  const match = content.match(commentRegex);
  return match ? match[1] : '';
}

function convertFile({ ts, css, exportName }) {
  const tsPath = path.join(rootDir, ts);
  const cssPath = path.join(rootDir, css);

  console.log(`\nProcessing: ${ts}`);

  // Read the TypeScript file
  const tsContent = fs.readFileSync(tsPath, 'utf8');

  // Extract the CSS
  const cssContent = extractCSSFromTemplate(tsContent, exportName);

  // Extract comments
  const comments = extractComments(tsContent);

  // Write the CSS file
  const finalCssContent = comments ? `${comments}\n${cssContent}` : cssContent;
  fs.writeFileSync(cssPath, finalCssContent, 'utf8');
  console.log(`  ✓ Created: ${css}`);

  // Create new TypeScript file that imports and re-exports the CSS
  const newTsContent = `${comments}
import styles from './${path.basename(css)}?raw';

export const ${exportName} = styles;
`;

  fs.writeFileSync(tsPath, newTsContent, 'utf8');
  console.log(`  ✓ Updated: ${ts}`);
}

// Main execution
console.log('Converting CSS-in-JS to standalone CSS files...\n');
console.log('='.repeat(60));

try {
  styleFiles.forEach(convertFile);

  console.log('\n' + '='.repeat(60));
  console.log('\n✅ All files converted successfully!');
  console.log('\nNext steps:');
  console.log('  1. Review the generated .css files');
  console.log('  2. Run: npm run build');
  console.log('  3. Test that styles load correctly');
} catch (error) {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
}
