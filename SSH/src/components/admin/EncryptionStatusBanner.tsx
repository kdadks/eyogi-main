import React, { useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'

/**
 * EncryptionStatusBanner
 *
 * Displays a prominent warning banner if encryption key is not available.
 * Should be mounted in the admin layout to alert administrators of configuration issues.
 */
export function EncryptionStatusBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    // Check if encryption key is available
    const hasKey = import.meta.env.VITE_ENCRYPTION_KEY

    if (!hasKey) {
      setShowBanner(true)
      console.error('❌ ENCRYPTION KEY MISSING - User data will appear encrypted!')
    }
  }, [])

  if (!showBanner) return null

  return (
    <div className="bg-red-600 text-white px-4 py-3 shadow-lg">
      <div className="container mx-auto flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <div className="font-bold text-lg mb-1">⚠️ Encryption Configuration Error</div>
          <div className="text-sm mb-2">
            <strong>VITE_ENCRYPTION_KEY</strong> environment variable is not set. All encrypted user
            data will display as encrypted text.
          </div>
          <div className="text-xs bg-red-700 rounded p-2 font-mono">
            <div className="font-semibold mb-1">Required Action:</div>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                Add <strong>VITE_ENCRYPTION_KEY</strong> to Vercel environment variables
              </li>
              <li>Redeploy the application (with cache disabled)</li>
              <li>Clear browser cache completely</li>
            </ol>
            <div className="mt-2 pt-2 border-t border-red-600">
              📖 See <strong>ENCRYPTION_SETUP_GUIDE.md</strong> for detailed instructions
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-white hover:text-red-200 text-xl leading-none px-2"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default EncryptionStatusBanner
