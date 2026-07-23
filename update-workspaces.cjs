// Update workspaces in package.json
const fs = require('fs');
const path = require('path');

const pkgPath = path.join(__dirname, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

// Get existing package directories
const packagesDir = path.join(__dirname, 'packages');
const existingPackages = fs.readdirSync(packagesDir)
  .filter(name => {
    const fullPath = path.join(packagesDir, name);
    return fs.statSync(fullPath).isDirectory() && 
           fs.existsSync(path.join(fullPath, 'package.json'));
  });

// Update workspaces
pkg.workspaces.packages = existingPackages.map(p => `packages/${p}`);

// Save
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');

console.log(`Updated workspaces: ${existingPackages.length} packages`);
