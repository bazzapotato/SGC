// fix-dependencies.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Fixing Electron dependencies...');

// Reinstall dependencies
console.log('Reinstalling dependencies...');
execSync('npm install electron electron-store fs-extra --save-exact', { stdio: 'inherit' });

// Verify electron-store installation
try {
  require.resolve('electron-store');
  console.log('electron-store is properly installed!');
} catch (e) {
  console.error('electron-store is still missing. Manual fix needed.');
  
  // Create manual symlink
  const nodeModules = path.join(__dirname, 'node_modules');
  const electronStorePath = path.join(nodeModules, 'electron-store');
  
  if (!fs.existsSync(electronStorePath)) {
    console.log('Creating manual symlink for electron-store...');
    const globalPath = execSync('npm root -g').toString().trim();
    const globalElectronStore = path.join(globalPath, 'electron-store');
    
    if (fs.existsSync(globalElectronStore)) {
      fs.symlinkSync(globalElectronStore, electronStorePath, 'junction');
      console.log('Symlink created successfully!');
    } else {
      console.error('electron-store not found globally. Please run: npm install -g electron-store');
    }
  }
}

console.log('Running electron-rebuild...');
execSync('npx electron-rebuild', { stdio: 'inherit' });

console.log('Fix completed. Try running: npm start');