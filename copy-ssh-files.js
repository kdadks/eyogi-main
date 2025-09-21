import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('🔄 Copying SSH build files...')

const sshDistDir = path.join(__dirname, 'src', 'SSH', 'dist')
const publicSshDir = path.join(__dirname, 'public', 'ssh-app')

// Ensure public/ssh-app directory exists
if (!fs.existsSync(publicSshDir)) {
  fs.mkdirSync(publicSshDir, { recursive: true })
}

// Copy files recursively
const copyDir = (src, dest) => {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true })
  }

  const entries = fs.readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

try {
  copyDir(sshDistDir, publicSshDir)
  console.log('✅ SSH files copied successfully to public/ssh-app/')
} catch (error) {
  console.error('❌ Copy failed:', error.message)
  process.exit(1)
}
