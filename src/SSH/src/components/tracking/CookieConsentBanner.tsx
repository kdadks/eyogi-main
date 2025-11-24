import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import {
  ShieldCheckIcon,
  CheckCircleIcon,
  XMarkIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline'
import {
  hasAnalyticsConsent,
  setTrackingConsent,
  getTrackingConsent,
  clearTrackingConsent,
  setupAutoTracking,
  type TrackingConsent,
} from '@/lib/pageTracking'

export default function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState<TrackingConsent>({
    analytics: false,
    functional: true,
    timestamp: new Date().toISOString(),
  })

  useEffect(() => {
    // Check if user has already given consent
    const existingConsent = getTrackingConsent()

    console.log('CookieConsentBanner: Checking consent', existingConsent)

    // Show banner if analytics consent hasn't been explicitly set
    if (!existingConsent.timestamp || existingConsent.analytics === undefined) {
      console.log('CookieConsentBanner: No consent found, showing banner')
      setShowBanner(true)
    } else {
      console.log('CookieConsentBanner: Consent already given, not showing banner')
      setPreferences(existingConsent)

      // Setup tracking if consent was given
      if (existingConsent.analytics) {
        setupAutoTracking()
      }
    }
  }, [])

  const handleAcceptAll = () => {
    const consent: TrackingConsent = {
      analytics: true,
      functional: true,
      timestamp: new Date().toISOString(),
    }
    setTrackingConsent(consent)
    setShowBanner(false)

    // Setup tracking after consent
    setupAutoTracking()
  }

  const handleRejectAll = () => {
    const consent: TrackingConsent = {
      analytics: false,
      functional: true,
      timestamp: new Date().toISOString(),
    }
    setTrackingConsent(consent)
    setShowBanner(false)
  }

  const handleSavePreferences = () => {
    setTrackingConsent(preferences)
    setShowBanner(false)
    setShowSettings(false)

    // Setup tracking if analytics was enabled
    if (preferences.analytics) {
      setupAutoTracking()
    }
  }

  const handleManageSettings = () => {
    setShowSettings(true)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slide-up">
      <Card className="max-w-6xl mx-auto shadow-2xl border-2 border-orange-200">
        <div className="p-6">
          {!showSettings ? (
            // Main Banner
            <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
              <div className="flex-shrink-0">
                <div className="bg-orange-100 rounded-full p-3">
                  <ShieldCheckIcon className="h-8 w-8 text-orange-600" />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  We value your privacy
                </h3>
                <p className="text-sm text-gray-600 mb-1">
                  We use cookies to enhance your browsing experience, serve personalized content, and analyze our traffic.
                  By clicking "Accept All", you consent to our use of cookies.
                </p>
                <button
                  onClick={() => window.open('/legal/privacy-policy', '_blank')}
                  className="text-sm text-orange-600 hover:text-orange-700 underline"
                >
                  Read our Privacy Policy
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  className="whitespace-nowrap"
                >
                  Reject All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageSettings}
                  className="whitespace-nowrap"
                >
                  <Cog6ToothIcon className="h-4 w-4 mr-2" />
                  Manage Preferences
                </Button>
                <Button
                  size="sm"
                  onClick={handleAcceptAll}
                  className="bg-orange-600 hover:bg-orange-700 text-white whitespace-nowrap"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Accept All
                </Button>
              </div>
            </div>
          ) : (
            // Settings Panel
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Cookie Preferences</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                {/* Functional Cookies */}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Essential Cookies
                      </h4>
                      <p className="text-sm text-gray-600">
                        These cookies are necessary for the website to function and cannot be switched off.
                        They are usually only set in response to actions made by you such as setting your privacy preferences, logging in or filling in forms.
                      </p>
                    </div>
                    <div className="ml-4">
                      <div className="bg-gray-300 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                        Always Active
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analytics Cookies */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">
                        Analytics Cookies
                      </h4>
                      <p className="text-sm text-gray-600">
                        These cookies allow us to count visits and traffic sources so we can measure and improve the performance of our site.
                        They help us understand which pages are the most and least popular and see how visitors move around the site.
                      </p>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() =>
                          setPreferences((prev) => ({
                            ...prev,
                            analytics: !prev.analytics,
                          }))
                        }
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                          preferences.analytics ? 'bg-orange-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSavePreferences}
                  className="bg-orange-600 hover:bg-orange-700 text-white"
                >
                  <CheckCircleIcon className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Separate component for cookie settings in footer/settings page
export function CookieSettings() {
  const [preferences, setPreferences] = useState<TrackingConsent>(getTrackingConsent())
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setTrackingConsent(preferences)
    setSaved(true)

    // Setup tracking if analytics was enabled
    if (preferences.analytics) {
      setupAutoTracking()
    }

    setTimeout(() => setSaved(false), 3000)
  }

  const handleClearAll = () => {
    clearTrackingConsent()
    setPreferences({
      analytics: false,
      functional: true,
      timestamp: new Date().toISOString(),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cookie Settings</h2>
        <p className="text-gray-600">
          Manage your cookie preferences. Changes will take effect immediately.
        </p>
      </div>

      <div className="space-y-4 mb-6">
        {/* Functional Cookies */}
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Essential Cookies</h4>
              <p className="text-sm text-gray-600">
                Required for the website to function properly. Cannot be disabled.
              </p>
            </div>
            <div className="ml-4">
              <div className="bg-gray-300 rounded-full px-3 py-1 text-xs font-medium text-gray-700">
                Always Active
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Cookies */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-1">Analytics Cookies</h4>
              <p className="text-sm text-gray-600">
                Help us understand how visitors interact with our website by collecting and reporting information anonymously.
              </p>
            </div>
            <div className="ml-4">
              <button
                onClick={() =>
                  setPreferences((prev) => ({
                    ...prev,
                    analytics: !prev.analytics,
                  }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${
                  preferences.analytics ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    preferences.analytics ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </div>

      {saved && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
          <span className="text-sm text-green-800">Preferences saved successfully!</span>
        </div>
      )}

      <div className="flex gap-3">
        <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700">
          <CheckCircleIcon className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
        <Button variant="outline" onClick={handleClearAll}>
          Clear All Cookies
        </Button>
      </div>

      <div className="mt-6 text-sm text-gray-600">
        <p>
          Last updated: {preferences.timestamp ? new Date(preferences.timestamp).toLocaleString() : 'Never'}
        </p>
      </div>
    </div>
  )
}
