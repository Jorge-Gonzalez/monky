#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Script to get the compressed build size of the project
 * Can work in two modes:
 * 1. Analyze a completed build in the dist folder
 * 2. Run the build and capture the compressed sizes from the output
 */

async function analyzeBuildSize() {
  console.log('Analyzing build size...\n');
  
  try {
    // First run the production build and capture its output
    const { stdout, stderr } = await execAsync('npm run build:prod');
    
    if (stderr) {
      console.error('Build errors:', stderr);
    }
    
    // Extract compressed (gzip) sizes from the build output
    const gzipLines = stdout.split('\n').filter(line => line.includes('gzip:'));
    const sizePattern = /gzip:\s+([\d.]+)\s+kB/;
    
    let totalCompressedSize = 0;
    const fileSizes = [];
    
    console.log('Gzipped file sizes:');
    console.log('-------------------');
    
    for (const line of gzipLines) {
      const match = line.match(sizePattern);
      if (match) {
        const size = parseFloat(match[1]);
        const filePath = line.split('│')[0].trim();
        totalCompressedSize += size;
        fileSizes.push({ file: filePath, size: size });
        console.log(`${filePath} - ${size} kB`);
      }
    }
    
    console.log('\n' + '='.repeat(50));
    console.log(`Total compressed (gzip) size: ${totalCompressedSize.toFixed(2)} kB`);
    console.log(`Total files: ${fileSizes.length}`);
    console.log('='.repeat(50));
    
    // Also show the uncompressed total size for comparison
    const uncompressedPattern = /(\d+\.?\d*)\s+kB\s+│\s+gzip:/;
    const uncompressedPattern2 = /(\d+\.?\d*)\s+kB(?!\s+\│\s+gzip)/;
    
    let totalUncompressedSize = 0;
    const allLines = stdout.split('\n');
    
    for (const line of allLines) {
      if (line.includes('kB') && !line.includes('Computing') && !line.includes('built in')) {
        // Match lines with uncompressed size followed by gzip size
        const uncompressedMatch = line.match(/(\d+\.?\d*)\s+kB\s+│\s+gzip:/);
        if (uncompressedMatch) {
          const size = parseFloat(uncompressedMatch[1]);
          totalUncompressedSize += size;
        } else {
          // Match lines with only uncompressed size (that are not HTML files)
          const hasGzip = line.includes('│'); // has a pipe, meaning it has a gzip value
          if (!hasGzip) {
            const sizeMatch = line.match(/(\d+\.?\d*)\s+kB/);
            if (sizeMatch) {
              const size = parseFloat(sizeMatch[1]);
              totalUncompressedSize += size;
            }
          }
        }
      }
    }
    
    console.log(`Total uncompressed size: ${totalUncompressedSize.toFixed(2)} kB`);
    console.log(`Compression savings: ${((1 - totalCompressedSize/totalUncompressedSize) * 100).toFixed(2)}%`);
    
    return {
      totalCompressedSize,
      totalUncompressedSize,
      fileCount: fileSizes.length
    };
  } catch (error) {
    console.error('Error running build:', error.message);
    
    // If build fails, check if dist folder exists and analyze it
    if (fs.existsSync('./dist')) {
      console.log('\nBuild failed, but dist folder exists. Analyzing existing files...');
      return analyzeExistingBuild();
    } else {
      console.error('No build output available to analyze.');
      process.exit(1);
    }
  }
}

async function analyzeExistingBuild() {
  console.log('\nAnalyzing existing build in dist folder...');
  
  // Use du command to get folder size
  try {
    const { stdout } = await execAsync('du -sh dist/');
    console.log(`Total build size: ${stdout.trim()}`);
    
    // Try to get individual file sizes from a previous build output if available
    console.log('(Gzipped sizes only available from fresh build output)');
    return { totalCompressedSize: null, totalUncompressedSize: null, fileCount: null };
  } catch (error) {
    console.error('Could not determine build size:', error.message);
    return { totalCompressedSize: null, totalUncompressedSize: null, fileCount: null };
  }
}

// Run the analysis
if (import.meta.url === `file://${process.argv[1]}`) {
  analyzeBuildSize()
    .then(results => {
      console.log('\nBuild size analysis complete!');
    })
    .catch(error => {
      console.error('Build size analysis failed:', error);
      process.exit(1);
    });
}

export { analyzeBuildSize };