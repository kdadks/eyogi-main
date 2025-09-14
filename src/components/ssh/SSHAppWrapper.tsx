'use client'

import React, { useState } from 'react'
import Link from 'next/link'

interface Course {
  id: number
  title: string
  description: string
  image: string
  duration: string
  level: string
  students: number
}

interface Gurukul {
  id: number
  name: string
  description: string
  location: string
  established: string
  courses: number
  teachers: number
}

const SSHAppWrapper: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home')

  const courses: Course[] = [
    {
      id: 1,
      title: "Vedic Sanskrit Foundations",
      description: "Learn the fundamentals of Sanskrit language and Vedic texts",
      image: "/ssh-app/Images/course1.jpg",
      duration: "12 weeks",
      level: "Beginner",
      students: 150
    },
    {
      id: 2,
      title: "Hindu Philosophy & Ethics",
      description: "Explore the core principles of Hindu philosophy and ethical teachings",
      image: "/ssh-app/Images/course2.jpg",
      duration: "16 weeks",
      level: "Intermediate",
      students: 98
    },
    {
      id: 3,
      title: "Mantra & Meditation Practices",
      description: "Master traditional mantras and meditation techniques",
      image: "/ssh-app/Images/course3.jpg",
      duration: "8 weeks",
      level: "All Levels",
      students: 245
    }
  ]

  const gurukuls: Gurukul[] = [
    {
      id: 1,
      name: "Himalayan Vedic Center",
      description: "Traditional Vedic learning in the serene Himalayas",
      location: "Rishikesh, India",
      established: "1995",
      courses: 25,
      teachers: 12
    },
    {
      id: 2,
      name: "Sacred Texts Institute",
      description: "Specialized in ancient Sanskrit texts and their interpretations",
      location: "Varanasi, India",
      established: "1988",
      courses: 18,
      teachers: 8
    }
  ]

  const renderHome = () => (
    <div className="space-y-12">
      <div className="text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to eYogi Gurukul SSH Portal
        </h2>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover the ancient wisdom of Hindu traditions through our comprehensive online learning platform. 
          Connect with authentic teachings, experienced gurus, and a community of spiritual seekers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">📚</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Ancient Wisdom</h3>
          <p className="text-gray-600">
            Learn from authenticated Vedic texts and traditional Hindu scriptures with expert guidance.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">🧘</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Spiritual Practice</h3>
          <p className="text-gray-600">
            Master meditation, yoga, and mantra practices rooted in authentic Hindu traditions.
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow">
          <div className="w-12 h-12 bg-pink-500 rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-bold text-xl">👨‍🏫</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Expert Teachers</h3>
          <p className="text-gray-600">
            Learn from experienced gurus and scholars with deep knowledge of Hindu philosophy.
          </p>
        </div>
      </div>
    </div>
  )

  const renderCourses = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Courses</h2>
        <p className="text-gray-600">Explore our comprehensive curriculum designed for spiritual growth</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
            <div className="h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
              <span className="text-white text-6xl">🕉️</span>
            </div>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{course.title}</h3>
              <p className="text-gray-600 mb-4">{course.description}</p>
              <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                <span>📅 {course.duration}</span>
                <span>📊 {course.level}</span>
                <span>👥 {course.students}</span>
              </div>
              <button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderGurukuls = () => (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Gurukuls</h2>
        <p className="text-gray-600">Traditional centers of learning preserving ancient wisdom</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {gurukuls.map((gurukul) => (
          <div key={gurukul.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow">
            <h3 className="text-2xl font-semibold text-gray-900 mb-3">{gurukul.name}</h3>
            <p className="text-gray-600 mb-4">{gurukul.description}</p>
            <div className="space-y-2 text-sm text-gray-500">
              <div className="flex items-center space-x-2">
                <span>📍</span>
                <span>{gurukul.location}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📅</span>
                <span>Established {gurukul.established}</span>
              </div>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <span>📚 {gurukul.courses} Courses</span>
                <span>👨‍🏫 {gurukul.teachers} Teachers</span>
              </div>
            </div>
            <button className="w-full mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-lg hover:from-orange-600 hover:to-red-600 transition-colors">
              Explore Gurukul
            </button>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                eYogi Gurukul - SSH Portal
              </h1>
              <p className="mt-2 text-gray-600">
                Ancient Hindu Wisdom, Modern Vedic Learning
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                🟢 Active
              </span>
              <Link
                href="/"
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                ← Back to Main Site
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'home', label: 'Home', icon: '🏠' },
              { id: 'courses', label: 'Courses', icon: '📚' },
              { id: 'gurukuls', label: 'Gurukuls', icon: '🏛️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-2 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {activeTab === 'home' && renderHome()}
        {activeTab === 'courses' && renderCourses()}
        {activeTab === 'gurukuls' && renderGurukuls()}
      </div>
    </div>
  )
}

export default SSHAppWrapper