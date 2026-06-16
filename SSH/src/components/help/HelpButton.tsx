'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import HelpModal, { HelpTopic } from './HelpModal'

interface HelpButtonProps {
  topics: HelpTopic[]
  title?: string
  description?: string
  className?: string
  showKeyboardHint?: boolean
}

export default function HelpButton({
  topics,
  title,
  description,
  className = '',
  showKeyboardHint = true,
}: HelpButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [showHint, setShowHint] = useState(false)

  // Open help on '?' key press
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === '?' && !isOpen) {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isOpen])

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        onMouseEnter={() => setShowHint(true)}
        onMouseLeave={() => setShowHint(false)}
        className={`relative p-2.5 rounded-lg bg-white/50 hover:bg-white/80 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-200 text-gray-600 hover:text-gray-900 ${className}`}
        title="Press '?' for help"
      >
        <QuestionMarkCircleIcon className="w-6 h-6" />

        {/* Keyboard Hint */}
        {showHint && showKeyboardHint && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-full right-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap pointer-events-none"
          >
            Press <kbd className="font-mono">?</kbd> for help
          </motion.div>
        )}
      </motion.button>

      <HelpModal isOpen={isOpen} onClose={() => setIsOpen(false)} topics={topics} title={title} description={description} />
    </>
  )
}
