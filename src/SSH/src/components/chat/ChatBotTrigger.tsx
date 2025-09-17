import React, { useState } from 'react'
import { Button } from '@/components/ui/Button'
import ChatBot from './ChatBot'
import { ChatBubbleLeftRightIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ChatBotTriggerProps {
  className?: string
  initialMessage?: string
}

export default function ChatBotTrigger({ className, initialMessage }: ChatBotTriggerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <div
          className={`fixed bottom-6 right-6 z-40 
                         sm:bottom-4 sm:right-4
                         xs:bottom-3 xs:right-3 ${className}`}
        >
          <div className="relative">
            {/* Pulse Animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-red-500 rounded-full animate-ping opacity-20"></div>

            {/* Main Button */}
            <button
              onClick={() => setIsOpen(true)}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="relative bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group
                         sm:p-3 xs:p-3
                         min-h-touch min-w-touch
                         flex items-center justify-center"
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <div className="flex items-center space-x-2">
                <SparklesIcon className="h-6 w-6 sm:h-5 sm:w-5 xs:h-5 xs:w-5 flex-shrink-0" />
                {isHovered && (
                  <span className="text-sm font-medium whitespace-nowrap hidden sm:block">
                    Ask eYogi AI
                  </span>
                )}
              </div>
            </button>

            {/* Tooltip */}
            {!isHovered && (
              <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap hidden sm:block">
                Ask me anything about eYogi Gurukul!
                <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Chat Interface */}
      <ChatBot isOpen={isOpen} onClose={() => setIsOpen(false)} initialMessage={initialMessage} />
    </>
  )
}
