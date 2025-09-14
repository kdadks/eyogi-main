import Hero from '@/components/Hero/page'
import MainCard from '@/components/MainCard/MainCard'
import SlideInSection from '@/components/SlideInSection/page'
import WhatWeOffer from '@/components/WhatWeOffer/page'
import { BookOpen, Heart, Target } from 'lucide-react'

const CARDS = [
  {
    title: 'What We Do',
    text: 'We provide authentic Vedic education blending scientific approach with spiritual wisdom through structured courses and community programs.',
    icon: <Target className="w-12 h-12 text-orange-500" />,
    href: '/about',
    link: 'About Us',
  },
  {
    title: 'How We Do It',
    text: 'Through our Gurukul system with qualified teachers, structured curriculum, and both online and in-person learning options.',
    icon: <BookOpen className="w-12 h-12 text-orange-500" />,
    href: '/membership',
    link: 'Join Us',
  },
  {
    title: 'Why We Do It',
    text: 'To preserve and propagate the timeless wisdom of Sanatana Dharma while making it accessible and relevant to modern seekers.',
    icon: <Heart className="w-12 h-12 text-orange-500" />,
    href: '/about',
    link: 'Read More',
  },
]

export default function Page() {
  return (
    <div className="flex flex-grow w-full flex-col gap-16">
      <Hero />
      <div className="w-full px-4 lg:px-8 grid py-16 lg:py-32 lg:grid-cols-3 items-center justify-items-center gap-8 lg:gap-16">
        {CARDS.map((card, index) => (
          <MainCard
            link={card.link}
            href={card.href}
            title={card.title}
            text={card.text}
            key={card.title}
            icon={card.icon}
            index={index}
          />
        ))}
      </div>

      <div className="-mt-16">
        <SlideInSection />
        <div className="block h-[600vh]"></div>
        <div className="relative w-full text-white">
          <svg
            className="absolute -bottom-32 left-0 w-full h-32"
            viewBox="0 0 100 10"
            preserveAspectRatio="none"
          >
            <path
              fill="white"
              d="M0 3C10 1 13 2 20 3 27 5 42 5 49 3 57 1 70 6 79 4 89 2 98 3 100 3V0H0Z"
            />
          </svg>
        </div>
      </div>

      <WhatWeOffer />
    </div>
  )
}
