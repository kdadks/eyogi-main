import React from 'react'
import { Card, CardContent } from '../ui/Card'
import { ClockIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline'

interface ComingSoonProps {
  title: string
  description?: string
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>
}

const ComingSoon: React.FC<ComingSoonProps> = ({
  title,
  description = 'This feature is currently under development and will be available soon.',
  icon: Icon = WrenchScrewdriverIcon,
}) => {
  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="shadow-lg">
          <CardContent className="p-12">
            <div className="flex flex-col items-center justify-center text-center space-y-6">
              {/* Icon */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-400/20 to-red-500/20 rounded-full blur-xl"></div>
                <div className="relative bg-gradient-to-br from-orange-50 to-red-50 p-6 rounded-full">
                  <Icon className="h-16 w-16 text-orange-500" />
                </div>
              </div>

              {/* Clock Icon Badge */}
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full">
                <ClockIcon className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Coming Soon</span>
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                <p className="text-lg text-gray-600 max-w-2xl">{description}</p>
              </div>

              {/* Additional Info */}
              <div className="pt-6 border-t border-gray-200 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-orange-500">⚙️</div>
                    <p className="text-sm text-gray-600">In Development</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-orange-500">🚀</div>
                    <p className="text-sm text-gray-600">Launching Soon</p>
                  </div>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold text-orange-500">✨</div>
                    <p className="text-sm text-gray-600">Stay Tuned</p>
                  </div>
                </div>
              </div>

              {/* Note */}
              <div className="pt-4">
                <p className="text-sm text-gray-500">
                  We're working hard to bring you this feature. Check back soon!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ComingSoon
