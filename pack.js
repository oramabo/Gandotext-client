/**
 * GandonOmeter Extension Packager
 *
 * Usage: node pack.js [version]
 * Example: node pack.js 1.0.1
 *
 * Creates a zip file ready for Chrome Web Store upload
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get version from command line or use default
const newVersion = process.argv[2];

if (!newVersion) {
  console.log('Usage: node pack.js <version>');
  console.log('Example: node pack.js 1.0.1');
  process.exit(1);
}

// Validate version format (semver)
if (!/^\d+\.\d+\.\d+$/.test(newVersion)) {
  console.error('Error: Version must be in format X.Y.Z (e.g., 1.0.1)');
  process.exit(1);
}

const extensionDir = __dirname;
const manifestPath = path.join(extensionDir, 'manifest.json');
const outputDir = path.join(extensionDir, '..', 'builds');
const zipName = `gandonometer-v${newVersion}.zip`;
const zipPath = path.join(outputDir, zipName);

console.log('='.repeat(50));
console.log('  GANDONOMETER EXTENSION PACKAGER');
console.log('='.repeat(50));

// Step 1: Update manifest.json version
console.log(`\n[1/3] Updating manifest.json to version ${newVersion}...`);

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const oldVersion = manifest.version;
manifest.version = newVersion;
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

console.log(`      Version updated: ${oldVersion} -> ${newVersion}`);

// Step 2: Create builds directory if it doesn't exist
console.log('\n[2/3] Preparing build directory...');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`      Created: ${outputDir}`);
} else {
  console.log(`      Using existing: ${outputDir}`);
}

// Step 3: Create zip file
console.log('\n[3/3] Creating zip archive...');

// Files and folders to include
const includeItems = [
  'manifest.json',
  'popup',
  'lib',
  'utils',
  'assets/icons'
];

// Files to exclude
const excludePatterns = [
  'pack.js',
  'generate-icons.html',
  '*.zip',
  'node_modules',
  '.git',
  '.DS_Store'
];

try {
  // Use PowerShell on Windows for zipping
  const isWindows = process.platform === 'win32';

  if (isWindows) {
    // Remove old zip if exists
    if (fs.existsSync(zipPath)) {
      fs.unlinkSync(zipPath);
    }

    // Create a temporary directory with only the files we want
    const tempDir = path.join(outputDir, 'temp_extension');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    // Copy files
    const copyRecursive = (src, dest) => {
      const stat = fs.statSync(src);
      if (stat.isDirectory()) {
        fs.mkdirSync(dest, { recursive: true });
        fs.readdirSync(src).forEach(child => {
          copyRecursive(path.join(src, child), path.join(dest, child));
        });
      } else {
        fs.copyFileSync(src, dest);
      }
    };

    // Copy manifest
    fs.copyFileSync(manifestPath, path.join(tempDir, 'manifest.json'));

    // Copy background service worker
    const backgroundPath = path.join(extensionDir, 'background.js');
    if (fs.existsSync(backgroundPath)) {
      fs.copyFileSync(backgroundPath, path.join(tempDir, 'background.js'));
    }

    // Copy folders
    ['popup', 'lib', 'utils'].forEach(folder => {
      const srcFolder = path.join(extensionDir, folder);
      if (fs.existsSync(srcFolder)) {
        copyRecursive(srcFolder, path.join(tempDir, folder));
      }
    });

    // Copy icons if they exist
    const iconsDir = path.join(extensionDir, 'assets', 'icons');
    if (fs.existsSync(iconsDir)) {
      copyRecursive(iconsDir, path.join(tempDir, 'assets', 'icons'));
    } else {
      console.log('      Warning: No icons found in assets/icons/');
    }

    // Create zip using PowerShell
    const psCommand = `Compress-Archive -Path "${tempDir}\\*" -DestinationPath "${zipPath}" -Force`;
    execSync(`powershell -Command "${psCommand}"`, { stdio: 'inherit' });

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true });

  } else {
    // Use zip command on Unix
    const zipCommand = `cd "${extensionDir}" && zip -r "${zipPath}" manifest.json popup lib utils assets/icons -x "*.DS_Store" -x "pack.js" -x "*.html"`;
    execSync(zipCommand, { stdio: 'inherit' });
  }

  // Get file size
  const stats = fs.statSync(zipPath);
  const fileSizeKB = (stats.size / 1024).toFixed(2);

  console.log(`      Created: ${zipPath}`);
  console.log(`      Size: ${fileSizeKB} KB`);

} catch (error) {
  console.error('Error creating zip:', error.message);
  process.exit(1);
}

console.log('\n' + '='.repeat(50));
console.log('  BUILD COMPLETE!');
console.log('='.repeat(50));
console.log(`\nOutput: ${zipPath}`);
console.log('\nNext steps:');
console.log('1. Go to https://chrome.google.com/webstore/devconsole');
console.log('2. Upload the zip file');
console.log('3. Ty NE Gandon! (maybe)');
console.log('');
