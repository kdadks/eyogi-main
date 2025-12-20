'use client'
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getPublishedPages } from '../../lib/api/pages'
import { getGurukuls } from '../../lib/api/gurukuls'
import { Page, Gurukul } from '../../types'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const [legalPages, setLegalPages] = useState<Page[]>([])
  const [gurukuls, setGurukuls] = useState<Gurukul[]>([])
  const navigate = useNavigate()

  const handleLinkClick = (href: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    navigate(href)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pages, gurukulsResult] = await Promise.all([
          getPublishedPages('legal'),
          getGurukuls(),
        ])
        setLegalPages(pages)
        setGurukuls(gurukulsResult.gurukuls)
      } catch (error) {
        console.error('Failed to load footer data:', error)
      }
    }

    loadData()
  }, [])

  // Build footer sections dynamically
  const footerSections = []

  // Gurukuls section (dynamic)
  if (gurukuls.length > 0) {
    footerSections.push({
      title: 'Gurukuls',
      links: gurukuls
        .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
        .map((gurukul) => ({
          name: gurukul.name,
          href: `/gurukuls/${gurukul.slug}`,
        })),
    })
  }

  // Learning section (static)
  footerSections.push({
    title: 'Learning',
    links: [
      { name: 'All Courses', href: '/courses' },
      { name: 'Elementary (4-7)', href: '/courses?level=elementary' },
      { name: 'Basic (8-11)', href: '/courses?level=basic' },
      { name: 'Intermediate (12-15)', href: '/courses?level=intermediate' },
      { name: 'Advanced (16-19)', href: '/courses?level=advanced' },
    ],
  })

  // Support section (static)
  footerSections.push({
    title: 'Support',
    links: [
      { name: 'Contact Us', href: '/contact' },
      { name: 'About Us', href: '/about' },
    ],
  })

  // Legal section (dynamic)
  if (legalPages.length > 0) {
    footerSections.push({
      title: 'Legal',
      links: legalPages.map((page) => ({
        name: page.title,
        href: `/legal/${page.slug}`,
      })),
    })
  }
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">eY</span>
              </div>
              <span className="text-xl font-bold">eYogi Gurukul</span>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Connecting ancient Vedic wisdom with modern learning through comprehensive online
              education.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="sr-only">Facebook</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M20 10C20 4.477 15.523 0 10 0S0 4.477 0 10c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V10h2.54V7.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V10h2.773l-.443 2.89h-2.33v6.988C16.343 19.128 20 14.991 20 10z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="sr-only">Twitter</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="sr-only">YouTube</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10ZM10 4C6.68629 4 4 6.68629 4 10C4 13.3137 6.68629 16 10 16C13.3137 16 16 13.3137 16 10C16 6.68629 13.3137 4 10 4Z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            </div>
          </div>
          {/* Footer Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      onClick={(e) => {
                        e.preventDefault()
                        handleLinkClick(link.href)
                      }}
                      className="text-gray-300 hover:text-white text-sm transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-8 pt-8 border-t border-gray-800">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} eYogi Gurukul. All rights reserved.
            </p>
            <p className="text-gray-400 text-sm mt-2 md:mt-0">
              Made with ❤️ for preserving ancient wisdom
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
