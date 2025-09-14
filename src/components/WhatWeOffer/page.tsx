import { Facebook, Linkedin, Twitter, Youtube } from 'lucide-react'
import Link from 'next/link'
import SlideIn from '../SlideIn'

const CARDS = [
  { title: 'Indian Knowledge System', text: 'Explore ancient wisdom and philosophies' },
  { title: 'Yoga and Meditation', text: 'Practices for physical and mental wellbeing' },
  { title: 'Sanskrit', text: 'Learn the ancient language of India' },
  { title: 'Mantra Basics', text: 'Understanding sacred sounds and chants' },
  { title: 'Hinduism Basics', text: 'Introduction to Hindu traditions and practices' },
  { title: 'Stotram Recitation', text: 'Learning and understanding devotional hymns' },
  { title: 'Itihasa', text: 'Study of Ramayana and Mahabharata' },
  { title: 'Irish Leaving Cert Guide', text: 'Support for Irish educational curriculum' },
  { title: 'Irish Language', text: "Learn Ireland's native language" },
  { title: 'Bhagavad Gita', text: 'Study of the sacred Hindu text' },
  { title: 'Upanishads', text: 'Exploring philosophical texts' },
  { title: 'Darshana Shastra', text: 'Study of Indian philosophical systems' },
]

export default function WhatWeOffer() {
  return (
    <div className="px-4 py-10 overflow-hidden">
      <div className="container p-0 mx-auto grid gap-8">
        <SlideIn>
          <div className="text-center pb-8">
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl mb-2 text-white">
              What We Offer
            </h2>
            <p className="text-base sm:text-lg md:text-xl text-[#e1e1e1]">
              Discover our range of courses, achievements, and community impact since 2018.
            </p>
          </div>
        </SlideIn>

        <div className="grid md:grid-cols-5 gap-6">
          <div className="flex flex-col gap-6 rounded-lg md:col-span-4 text-black">
            <SlideIn delay={0.2}>
              <div className="bg-white h-full p-6 rounded-3xl">
                <h3 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-2">About us</h3>
                <p className="mb-2 text-base sm:text-lg">
                  We are in operation since 2018; we are a registered charity (No.#20208551) in
                  Ireland since 2020
                </p>
                <p className="text-base sm:text-lg">
                  As an established organization, we maintain a bank account and have a strong
                  online presence across multiple platforms to better serve our community.
                </p>
              </div>
            </SlideIn>

            <div className="grid sm:grid-cols-2 gap-6 text-black">
              <SlideIn delay={0.4}>
                <div className="bg-white p-6 text-center rounded-3xl flex items-center justify-center flex-col h-full">
                  <p className="text-base sm:text-lg mb-1">More than a</p>
                  <h4 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 bg-gradient-to-br from-orange-400 to-red-600 text-transparent bg-clip-text">
                    Thousand
                  </h4>
                  <p className="text-sm sm:text-base">students taught</p>
                </div>
              </SlideIn>
              <SlideIn delay={0.6}>
                <div className="bg-white p-6 text-center rounded-3xl flex items-center justify-center flex-col h-full">
                  <p className="text-base sm:text-lg mb-2">Interactive courses developed</p>
                  <h4 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-br from-orange-400 to-red-600 text-transparent bg-clip-text">
                    30+
                  </h4>
                </div>
              </SlideIn>
            </div>
          </div>

          <SlideIn delay={0.4} direction="left">
            <div className="bg-white p-6 rounded-3xl flex flex-col items-center text-black h-full">
              <h3 className="text-xl sm:text-2xl font-medium mb-4">Our socials</h3>
              <div className="grid grid-flow-row grid-cols-4 lg:grid-cols-1 gap-6 lg:gap-4 justify-between h-full">
                <Link
                  href="http://www.linkedin.com/in/eyogi-gurukul-7a63a91a0"
                  className="hover:text-red-600 transition-colors duration-300 flex items-center"
                >
                  <Linkedin className="w-6 h-6 lg:w-8 lg:h-8" />
                </Link>
                <Link
                  href={'http://www.twitter.com/@eyogigurukul'}
                  className="hover:text-red-600 transition-colors duration-300 flex items-center"
                >
                  <Twitter className="w-6 h-6 lg:w-8 lg:h-8" />
                </Link>
                <Link
                  href={'https://www.facebook.com/allfestivesireland#'}
                  className="hover:text-red-600 transition-colors duration-300 flex items-center"
                >
                  <Facebook className="w-6 h-6 lg:w-8 lg:h-8" />
                </Link>
                <Link
                  href={'https://www.youtube.com/channel/UCTytB2My0xSvNmtKBRIJnIg?'}
                  className="hover:text-red-600 transition-colors duration-300 flex items-center"
                >
                  <Youtube className="w-6 h-6 lg:w-8 lg:h-8" />
                </Link>
              </div>
            </div>
          </SlideIn>
        </div>

        <SlideIn delay={0.8}>
          <div className="bg-white p-6 rounded-3xl text-black">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-medium mb-6">
              Our Course Offerings
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {CARDS.map((card, index) => (
                <SlideIn
                  key={card.title}
                  delay={0.6 + index * 0.15}
                  distance={30}
                  className="hidden sm:block"
                >
                  <div
                    key={card.title}
                    className="bg-orange-50 border border-orange-200 rounded-xl shadow-md p-4 text-gray-800 hover:bg-orange-200 transition duration-300"
                  >
                    <h4 className="text-base sm:text-lg font-semibold mb-1">{card.title}</h4>
                    <p className="text-sm sm:text-base">{card.text}</p>
                  </div>
                </SlideIn>
              ))}

              {/* Mobile version */}
              {CARDS.map((card) => (
                <SlideIn key={card.title} distance={30} className="sm:hidden">
                  <div
                    key={card.title}
                    className="bg-orange-50 border border-orange-200 rounded-xl shadow-md p-4 text-gray-800 hover:bg-orange-200 transition duration-300"
                  >
                    <h4 className="text-base sm:text-lg font-semibold mb-1">{card.title}</h4>
                    <p className="text-sm sm:text-base">{card.text}</p>
                  </div>
                </SlideIn>
              ))}
            </div>
            <p className="text-sm sm:text-base md:text-lg text-center pt-8 text-black/80">
              And many more courses coming soon to enrich your learning journey!
            </p>
          </div>
        </SlideIn>
      </div>
    </div>
  )
}
