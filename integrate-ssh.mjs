#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Integrating SSH application...');

try {
  // Build SSH application
  console.log('📦 Building SSH application...');
  execSync('cd src/SSH && npm run build', { stdio: 'inherit' });
  
  // Remove old SSH app files
  const sshAppPath = path.join(__dirname, 'public', 'ssh-app');
  if (fs.existsSync(sshAppPath)) {
    fs.rmSync(sshAppPath, { recursive: true, force: true });
  }
  
  // Copy new build files
  console.log('📂 Copying SSH build files...');
  execSync('cp -r src/SSH/dist public/ssh-app', { stdio: 'inherit' });
  
  console.log('✅ SSH integration complete!');
  console.log('🌐 SSH Portal is now available at /ssh-app/index.html');
  
} catch (error) {
  console.error('❌ Integration failed:', error.message);
  process.exit(1);
}