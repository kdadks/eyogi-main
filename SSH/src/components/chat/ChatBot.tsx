import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { useSupabaseAuth as useAuth } from '../../hooks/useSupabaseAuth'
import { ChatService } from '@/lib/ai/ChatService'
import { formatDateTime } from '@/lib/utils'
import { sanitizeHtml } from '@/utils/sanitize'
import toast from 'react-hot-toast'
import {
  XMarkIcon,
  PaperAirplaneIcon,
  SparklesIcon,
  UserIcon,
  ComputerDesktopIcon,
  LightBulbIcon,
  QuestionMarkCircleIcon,
  ArrowPathIcon,
  MicrophoneIcon,
  StopIcon,
} from '@heroicons/react/24/outline'
// Speech Recognition API type declarations
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
}
interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult
}
interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative
}
interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}
interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void) | null
  onerror: ((this: SpeechRecognition, ev: Event) => void) | null
  onend: ((this: SpeechRecognition, ev: Event) => void) | null
  start(): void
  stop(): void
}
declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}
interface ChatMessage {
  id: string
  type: 'user' | 'bot'
  content: string
  timestamp: Date
  persona?: string
  intent?: string
  confidence?: number
  didYouKnow?: string
}
interface ChatBotProps {
  isOpen: boolean
  onClose: () => void
  initialMessage?: string
}
export default function ChatBot({ isOpen, onClose, initialMessage }: ChatBotProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [chatService] = useState(() => new ChatService())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (isOpen) {
      // Initialize chat with welcome message
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        type: 'bot',
        content: `🙏 Namaste ${user?.email?.split('@')[0] || 'friend'}! I'm your eYogi AI assistant. I'm here to help you with questions about our courses, Gurukuls, enrollment, and anything related to your learning journey. How can I assist you today?`,
        timestamp: new Date(),
        persona: 'student',
        intent: 'greeting',
      }
      setMessages([welcomeMessage])
      // Focus input with preventScroll
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 100)
    }
  }, [isOpen, user])
  // Prevent page scroll when chatbot is open
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Allow normal operation within the chatbot
        if (e.target && (e.target as Element).closest('[data-chatbot="true"]')) {
          return
        }
        // Prevent certain keys that might cause scrolling
        if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(e.key)) {
          e.preventDefault()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [isOpen])
  useEffect(() => {
    if (initialMessage && isOpen) {
      handleSendMessage(initialMessage)
    }
  }, [initialMessage, isOpen]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    scrollToBottom()
  }, [messages])
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'end',
      inline: 'nearest',
    })
  }
  const handleSendMessage = async (message?: string) => {
    const messageText = message || inputMessage.trim()
    if (!messageText) return
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content: messageText,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])
    setInputMessage('')
    setIsTyping(true)
    // Maintain focus on input to prevent scroll issues
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true })
    }, 0)
    try {
      // Convert Supabase User to local User type for ChatService
      const localUser = user
        ? {
            id: user.id,
            email: user.email || '',
            full_name: user.email?.split('@')[0] || '',
            role: 'admin' as 'student' | 'teacher' | 'admin',
            student_id: '',
            age: undefined,
            created_at: user.created_at,
            updated_at: user.updated_at || '',
          }
        : null
      // Process message through AI service
      const response = await chatService.processMessage(messageText, localUser)
      // Simulate typing delay
      await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 1000))
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        type: 'bot',
        content: response.message,
        timestamp: new Date(),
        persona: response.persona,
        intent: response.intent,
        confidence: response.confidence,
        didYouKnow: response.didYouKnow,
      }
      setMessages((prev) => [...prev, botMessage])
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        type: 'bot',
        content:
          'I apologize, but I encountered an error processing your message. Please try again or contact our support team for assistance.',
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsTyping(false)
    }
  }
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      e.stopPropagation()
      handleSendMessage()
    }
  }
  const handleVoiceInput = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
      if (!SpeechRecognition) return
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = false
      recognition.lang = 'en-US'
      recognition.onstart = () => {
        setIsListening(true)
      }
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript
        setInputMessage(transcript)
        setIsListening(false)
      }
      recognition.onerror = () => {
        setIsListening(false)
      }
      recognition.onend = () => {
        setIsListening(false)
      }
      if (isListening) {
        recognition.stop()
      } else {
        recognition.start()
      }
    } else {
      toast.error('Speech recognition is not supported in your browser.')
    }
  }
  const clearChat = () => {
    setMessages([])
    const welcomeMessage: ChatMessage = {
      id: 'welcome-new',
      type: 'bot',
      content: `🙏 Chat cleared! I'm ready to help you with any questions about eYogi Gurukul. What would you like to know?`,
      timestamp: new Date(),
    }
    setMessages([welcomeMessage])
  }
  const quickQuestions = [
    'What courses are available for my age?',
    'How do I enroll in a course?',
    'What is the fee structure?',
    'Tell me about Hinduism Gurukul',
    'How do I get certificates?',
    'What are the different Gurukuls?',
    'Tell me an interesting fact',
    'Share some Sanskrit wisdom',
  ]
  if (!isOpen) return null
  return (
    <div
      className="fixed z-50 animate-in slide-in-from-bottom-4 slide-in-from-right-4 duration-300 
                 md:bottom-6 md:right-6 md:w-96 md:h-[600px] md:top-auto md:left-auto
                 top-16 bottom-4 left-4 right-4
                 sm:top-20
                 chatbot-container"
      onClick={(e) => e.stopPropagation()}
      data-chatbot="true"
    >
      <Card className="w-full h-full flex flex-col shadow-2xl border border-gray-700 bg-gray-900">
        {/* Chat Header */}
        <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg px-3 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full flex items-center justify-center">
                <SparklesIcon className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">eYogi AI Assistant</h3>
                <p className="text-orange-100 text-xs sm:text-sm hidden sm:block">
                  Your personal learning companion
                </p>
                <p className="text-orange-100 text-xs sm:hidden">Learning companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearChat}
                className="text-white hover:bg-white/10 p-2 sm:p-2 min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px]"
              >
                <ArrowPathIcon className="h-4 w-4 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-white hover:bg-white/10 p-2 sm:p-2 min-h-[40px] min-w-[40px] sm:min-h-[36px] sm:min-w-[36px]"
              >
                <XMarkIcon className="h-5 w-5 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {/* Chat Messages */}
        <CardContent className="flex-1 overflow-y-auto p-2 sm:p-4 space-y-3 sm:space-y-4 bg-gray-800">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] sm:max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}
              >
                <div
                  className={`flex items-start space-x-2 sm:space-x-3 ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}
                >
                  {/* Avatar */}
                  <div
                    className={`h-6 w-6 sm:h-8 sm:w-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                        : 'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}
                  >
                    {message.type === 'user' ? (
                      <UserIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    ) : (
                      <SparklesIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                    )}
                  </div>
                  {/* Message Content */}
                  <div
                    className={`rounded-2xl px-3 py-2 sm:px-4 sm:py-3 ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                        : 'bg-gray-700 text-gray-100'
                    }`}
                  >
                    <div className="text-sm sm:text-sm leading-relaxed whitespace-pre-wrap">
                      {message.type === 'bot' ? (
                        <div
                          dangerouslySetInnerHTML={{
                            __html: sanitizeHtml(
                              message.content
                                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                                .replace(
                                  /\[([^\]]+)\]\(([^)]+)\)/g,
                                  '<a href="$2" class="text-blue-600 hover:text-blue-800 underline font-medium" target="_blank" rel="noopener noreferrer">$1</a>',
                                )
                                .replace(/\n/g, '<br>'),
                            ),
                          }}
                        />
                      ) : (
                        message.content
                      )}
                    </div>
                    {/* AI Metadata */}
                    {message.type === 'bot' && (message.persona || message.intent) && (
                      <div className="mt-2 pt-2 border-t border-gray-600 flex items-center space-x-2">
                        {message.persona && (
                          <Badge variant="info" className="text-xs">
                            {message.persona}
                          </Badge>
                        )}
                        {message.intent && (
                          <Badge variant="default" className="text-xs">
                            {message.intent}
                          </Badge>
                        )}
                        {message.confidence && (
                          <span className="text-xs text-gray-400">
                            {Math.round(message.confidence * 100)}% confident
                          </span>
                        )}
                      </div>
                    )}
                    {/* Did You Know Section */}
                    {message.didYouKnow && (
                      <div className="mt-3 p-3 bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg border border-purple-600">
                        <div className="flex items-center space-x-2 mb-2">
                          <LightBulbIcon className="h-4 w-4 text-purple-400" />
                          <span className="text-sm font-semibold text-purple-300">
                            Did You Know?
                          </span>
                        </div>
                        <p className="text-sm text-purple-200">{message.didYouKnow}</p>
                      </div>
                    )}
                  </div>
                </div>
                {/* Timestamp */}
                <div
                  className={`mt-1 text-xs text-gray-400 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
                >
                  {formatDateTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}
          {/* Typing Indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-3">
                <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <SparklesIcon className="h-4 w-4 text-white" />
                </div>
                <div className="bg-gray-700 rounded-2xl px-4 py-3">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.1s' }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: '0.2s' }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="px-2 sm:px-4 pb-2 sm:pb-4 bg-gray-800">
            <div className="mb-3 sm:mb-4">
              <h4 className="text-xs sm:text-sm font-semibold text-gray-200 mb-2 sm:mb-3 flex items-center">
                <QuestionMarkCircleIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                Quick Questions
              </h4>
              <div className="grid grid-cols-1 gap-1.5 sm:gap-2">
                {quickQuestions.slice(0, 4).map((question, index) => (
                  <button
                    key={index}
                    onClick={() => handleSendMessage(question)}
                    className="text-left p-2.5 sm:p-2 text-xs sm:text-xs bg-gray-700 hover:bg-orange-900/30 hover:text-orange-300 text-gray-200 rounded-lg transition-colors border border-gray-600 hover:border-orange-500 min-h-[40px] sm:min-h-[36px] flex items-center"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        {/* Chat Input */}
        <div className="p-2 sm:p-4 border-t border-gray-600 bg-gray-900 rounded-b-lg">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              handleSendMessage()
            }}
            className="flex items-center space-x-2 sm:space-x-3"
          >
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about eYogi Gurukul..."
                className="w-full px-3 sm:px-4 py-3 pr-10 sm:pr-12 border border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm min-h-[48px]"
                disabled={isTyping}
                style={{ fontSize: '16px' }} // Prevent iOS zoom
              />
              <button
                onClick={handleVoiceInput}
                className={`absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1.5 sm:p-1 rounded-full transition-colors min-h-[32px] min-w-[32px] flex items-center justify-center ${
                  isListening
                    ? 'text-red-400 bg-red-900/30'
                    : 'text-gray-400 hover:text-orange-400 hover:bg-orange-900/30'
                }`}
              >
                {isListening ? (
                  <StopIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                ) : (
                  <MicrophoneIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>
            </div>
            <Button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="px-3 sm:px-4 py-3 min-h-[48px] min-w-[48px]"
              type="submit"
            >
              <PaperAirplaneIcon className="h-4 w-4" />
            </Button>
          </form>
          <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between text-xs text-gray-400 space-y-1 sm:space-y-0">
            <span className="text-center sm:text-left">
              Press Enter to send • Shift+Enter for new line
            </span>
            <span className="flex items-center justify-center sm:justify-end space-x-1">
              <ComputerDesktopIcon className="h-3 w-3" />
              <span>AI-powered by eYogi</span>
            </span>
          </div>
        </div>
      </Card>
    </div>
  )
}
