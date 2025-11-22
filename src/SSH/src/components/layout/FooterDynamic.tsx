'use client'
import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getMenuItemsFromDB, MenuItemType } from '../../lib/api/menus'
import { getSocialMediaLinksFromDB, SocialMediaLink } from '../../lib/api/socialMedia'
import { Facebook, Linkedin, Twitter, Youtube, Instagram } from 'lucide-react'

interface FooterSection {
  title: string
  links: Array<{ name: string; href: string; target?: string; isChild?: boolean }>
}

export default function FooterDynamic() {
  const currentYear = new Date().getFullYear()
  const [footerSections, setFooterSections] = useState<FooterSection[]>([])
  const [socialLinks, setSocialLinks] = useState<SocialMediaLink[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const handleLinkClick = (href: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    navigate(href)
  }

  const getSocialMediaIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return <Facebook className="h-5 w-5" />
      case 'twitter':
        return <Twitter className="h-5 w-5" />
      case 'linkedin':
        return <Linkedin className="h-5 w-5" />
      case 'youtube':
        return <Youtube className="h-5 w-5" />
      case 'instagram':
        return <Instagram className="h-5 w-5" />
      default:
        return null
    }
  }

  // Load footer menu items from database
  useEffect(() => {
    const loadFooterData = async () => {
      try {
        // Fetch both parent and child footer items
        const parentItems = await getMenuItemsFromDB('footer')
        const childItems = await getMenuItemsFromDB('footer-child')

        // Each parent item becomes its own section with children underneath
        const sections: FooterSection[] = parentItems
          .filter((item) => item.isActive !== false)
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
          .map((parent) => {
            // Get children for this parent
            const children = childItems
              .filter(
                (child) => child.metadata?.parentMenuId === parent.id && child.isActive !== false,
              )
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

            return {
              title: parent.label || parent.title,
              links: children.map((child) => ({
                name: child.label || child.title,
                href: child.url || child.href || '/',
                target: child.openInNewTab ? '_blank' : '_self',
                isChild: true,
              })),
            }
          })

        setFooterSections(sections)

        // Fetch social media links from database
        const socialMediaLinks = await getSocialMediaLinksFromDB()
        const activeSocialLinks = socialMediaLinks.filter((link) => link.is_active)
        setSocialLinks(activeSocialLinks)
      } catch (error) {
        console.error('Failed to load footer data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadFooterData()
  }, [])

  if (loading) {
    return null
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
              {socialLinks.length > 0 ? (
                socialLinks.map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                    title={link.platform}
                  >
                    <span className="sr-only">{link.platform}</span>
                    {getSocialMediaIcon(link.platform)}
                  </a>
                ))
              ) : (
                <>{/* Fallback to empty state if no social links */}</>
              )}
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
