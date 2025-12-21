'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { XMarkIcon, QuestionMarkCircleIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export interface HelpTopic {
  id: string
  title: string
  icon?: React.ReactNode
  description: string
  sections: HelpSection[]
}

export interface HelpSection {
  id: string
  heading: string
  content: string | React.ReactNode
  tips?: string[]
  example?: string
}

interface HelpModalProps {
  isOpen: boolean
  onClose: () => void
  topics: HelpTopic[]
  title?: string
  description?: string
}

export default function HelpModal({
  isOpen,
  onClose,
  topics,
  title = 'Help & Guide',
  description,
}: HelpModalProps) {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(topics[0]?.id || null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSection = (sectionId: string) => {
    const newSections = new Set(expandedSections)
    if (newSections.has(sectionId)) {
      newSections.delete(sectionId)
    } else {
      newSections.add(sectionId)
    }
    setExpandedSections(newSections)
  }

  if (!mounted) return null

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] overflow-y-auto"
        >
          <div className="flex min-h-screen items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-5 rounded-t-2xl flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <QuestionMarkCircleIcon className="w-7 h-7 text-white" />
                  <div>
                    <h2 className="text-2xl font-bold text-white">{title}</h2>
                    {description && <p className="text-blue-100 text-sm mt-1">{description}</p>}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg cursor-pointer"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto">
                <div className="flex h-full">
                  {/* Topics Sidebar */}
                  <div className="w-64 border-r border-gray-200 bg-gray-50 overflow-y-auto">
                    <div className="p-4 space-y-2">
                      {topics.map((topic) => (
                        <motion.button
                          key={topic.id}
                          onClick={() => setExpandedTopic(topic.id)}
                          whileHover={{ x: 4 }}
                          className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 ${
                            expandedTopic === topic.id
                              ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                              : 'text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {topic.icon && (
                            <span
                              className={`text-lg ${expandedTopic === topic.id ? 'text-white' : ''}`}
                            >
                              {topic.icon}
                            </span>
                          )}
                          <span className="font-medium truncate">{topic.title}</span>
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 p-8 overflow-y-auto">
                    {topics.map((topic) => (
                      <AnimatePresence key={topic.id} mode="wait">
                        {expandedTopic === topic.id && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            <div className="mb-6">
                              <div className="flex items-center gap-3 mb-4">
                                {topic.icon && <span className="text-3xl">{topic.icon}</span>}
                                <div>
                                  <h3 className="text-2xl font-bold text-gray-900">
                                    {topic.title}
                                  </h3>
                                  <p className="text-gray-600 mt-1">{topic.description}</p>
                                </div>
                              </div>
                            </div>

                            {/* Sections */}
                            <div className="space-y-4">
                              {topic.sections.map((section, index) => (
                                <motion.div
                                  key={section.id}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className="border border-gray-200 rounded-lg overflow-hidden"
                                >
                                  {/* Section Header */}
                                  <button
                                    onClick={() => toggleSection(section.id)}
                                    className="w-full px-5 py-4 flex items-center justify-between bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-150 transition-all duration-200 cursor-pointer"
                                  >
                                    <h4 className="font-semibold text-gray-900">
                                      {section.heading}
                                    </h4>
                                    <motion.div
                                      animate={{
                                        rotate: expandedSections.has(section.id) ? 180 : 0,
                                      }}
                                      transition={{ duration: 0.2 }}
                                    >
                                      <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                                    </motion.div>
                                  </button>

                                  {/* Section Content */}
                                  <AnimatePresence>
                                    {expandedSections.has(section.id) && (
                                      <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="overflow-hidden"
                                      >
                                        <div className="px-5 py-4 bg-white border-t border-gray-200 space-y-4">
                                          {/* Main Content */}
                                          <div className="text-gray-700 leading-relaxed">
                                            {typeof section.content === 'string' ? (
                                              <p>{section.content}</p>
                                            ) : (
                                              section.content
                                            )}
                                          </div>

                                          {/* Example */}
                                          {section.example && (
                                            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                                              <p className="font-semibold text-blue-900 mb-2">
                                                💡 Example:
                                              </p>
                                              <p className="text-blue-800 text-sm">
                                                {section.example}
                                              </p>
                                            </div>
                                          )}

                                          {/* Tips */}
                                          {section.tips && section.tips.length > 0 && (
                                            <div className="space-y-2">
                                              <p className="font-semibold text-gray-900">
                                                💡 Tips:
                                              </p>
                                              <ul className="space-y-2">
                                                {section.tips.map((tip, tipIndex) => (
                                                  <li
                                                    key={tipIndex}
                                                    className="flex items-start gap-3 text-sm text-gray-700"
                                                  >
                                                    <span className="text-green-500 font-bold mt-0.5">
                                                      •
                                                    </span>
                                                    <span>{tip}</span>
                                                  </li>
                                                ))}
                                              </ul>
                                            </div>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    ))}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end rounded-b-2xl">
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
