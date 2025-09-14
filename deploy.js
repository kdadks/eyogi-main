#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function deploy() {
  console.log('🚀 Starting Netlify deployment...');
  
  try {
    // Check if Netlify CLI is installed
    await runCommand('npx netlify --version');
    
    // Build the application
    console.log('📦 Building application...');
    await runCommand('npm run build');
    
    // Check if .netlify directory exists (site is linked)
    if (!fs.existsSync('.netlify')) {
      console.log('⚙️  Site not linked to Netlify. Please run "npx netlify link" first.');
      return;
    }
    
    // Deploy to Netlify
    console.log('🌐 Deploying to Netlify...');
    await runCommand('npx netlify deploy --prod --dir=.next');
    
    console.log('✅ Deployment completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      console.log(stdout);
      if (stderr) {
        console.warn(stderr);
      }
      resolve(stdout);
    });
  });
}

// Run deployment
deploy();