#!/usr/bin/env node

import fs from 'fs'
import path from 'path'

const sshSrcPath = 'd:\\ITWala Projects\\eyogi-main\\src\\SSH\\src'

// Fix all files that import useAuth from AuthContext
const filesToFix = [
  'components/chat/ChatBot.tsx',
  'pages/dashboard/AdminDashboard.tsx',
  'pages/dashboard/DashboardPage.tsx',
  'pages/auth/SignInPage.tsx',
  'contexts/PermissionContext.tsx',
  'components/auth/AdminLogin.tsx',
  'components/auth/ProtectedRoute.tsx',
  'components/admin/AdminSidebar.tsx',
  'components/admin/AdminUserManagementNew.tsx',
  'components/auth/PublicRoute.tsx',
  'components/auth/AdminProtectedRoute.tsx',
]

filesToFix.forEach((file) => {
  const filePath = path.join(sshSrcPath, file)
  try {
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8')

      // Fix import statement
      content = content.replace(
        /import { useAuth } from ['"](\.\.\/)*contexts\/AuthContext['"]/g,
        "import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'",
      )

      // Handle relative path variations
      content = content.replace(
        /import { useAuth } from ['"]\.\/?AuthContext['"]/g,
        "import { useSupabaseAuth as useAuth } from '../hooks/useSupabaseAuth'",
      )

      fs.writeFileSync(filePath, content)
      console.log(`✅ Fixed ${file}`)
    }
  } catch (error) {
    console.log(`❌ Error fixing ${file}:`, error.message)
  }
})

console.log('🎉 All useAuth imports fixed!')
