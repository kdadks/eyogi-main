import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContextTypes'
export const useSupabaseAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within an AuthProvider')
  }
  return context
}
