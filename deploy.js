#!/usr/bin/env node

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

async function deploy() {
  console.log('🚀 Starting deployment...')

  try {
    // Build the application
    console.log('📦 Building application...')
    await runCommand('npm run build')

    console.log('✅ Deployment completed successfully!')
  } catch (error) {
    console.error('❌ Deployment failed:', error.message)
    process.exit(1)
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error)
        return
      }
      console.log(stdout)
      if (stderr) {
        console.warn(stderr)
      }
      resolve(stdout)
    })
  })
}

// Run deployment
deploy()
