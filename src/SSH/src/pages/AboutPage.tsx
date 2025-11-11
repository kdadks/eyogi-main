import React from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

import { DEFAULT_IMAGES } from '../lib/constants/images'
import {
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  GlobeAltIcon,
  HeartIcon,
  StarIcon,
} from '@heroicons/react/24/outline'
export default function AboutPage() {
  const values = [
    {
      icon: HeartIcon,
      title: 'Seva (Service)',
      description:
        'Embodying the principle of selfless service in every aspect of teaching, learning, and leadership.',
    },
    {
      icon: GlobeAltIcon,
      title: 'Satya (Truth)',
      description:
        'Pursuing truth through rigorous scholarship while honoring the timeless wisdom of ancient traditions.',
    },
    {
      icon: UserGroupIcon,
      title: 'Samskara (Character)',
      description:
        'Cultivating ethical reflection and purposeful innovation to develop strong moral character.',
    },
    {
      icon: AcademicCapIcon,
      title: 'Integrated Excellence',
      description:
        'Combining academic rigor with spiritual depth to nurture graduates who are both professionally capable and socially conscious.',
    },
  ]
  const team = [
    {
      name: 'Hanumantha Rao',
      role: 'Chancellor',
      image: DEFAULT_IMAGES.TEAM_MEMBER,
      bio: 'PhD in Sanskrit Studies with 20+ years of teaching experience in Vedic philosophy.',
    },
    {
      name: 'Kumar Prashant Srivastav',
      role: 'President',
      image: DEFAULT_IMAGES.TEAM_MEMBER,
      bio: 'Reowned IT Leader and deep routed into education stream across multiple channels.',
    },
    {
      name: 'Arjun Kumar',
      role: 'Technology Director',
      image: DEFAULT_IMAGES.TEAM_MEMBER,
      bio: 'Expert in educational technology with a passion for making ancient wisdom accessible.',
    },
  ]
  const stats = [
    { number: '1,950+', label: 'Students Worldwide' },
    { number: '63+', label: 'Courses Available' },
    { number: '5', label: 'Specialized Gurukuls' },
    { number: '25+', label: 'Expert Teachers' },
  ]
  return (
    <>
      <SEOHead
        title="About SSH University - Harmonizing Ancient Wisdom with Modern Education"
        description="Discover SSH University's mission to harmonize ancient wisdom with modern education. Learn about our integrated academic programs, ethical values, and commitment to nurturing conscious leaders who balance intellect with inner awareness."
        keywords={[
          'About SSH University',
          'Ancient Wisdom Modern Education',
          'Integrated Learning Programs',
          'Ethical Education Mission',
          'Conscious Leadership Development',
          'Seva Satya Samskara',
          'Spiritual Heritage Education',
          'Global University Mission',
          'Timeless Wisdom Contemporary',
          'Academic Excellence Ethics',
          'Transformative Education India',
          'Balanced Learning Approach',
          'Inner Awareness Education',
          'Purposeful Innovation Learning',
          'Collective Well-being Education',
        ]}
        canonicalUrl="/about"
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'About SSH University', url: '/about' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About SSH University - Harmonizing Ancient Wisdom with Modern Education',
            description:
              "Learn about SSH University's mission to harmonize ancient wisdom with modern education, creating conscious leaders through integrated learning programs.",
            url: 'https://ssh-university.vercel.app/about',
            mainEntity: {
              '@type': 'EducationalOrganization',
              name: 'SSH University',
              mission:
                'To harmonize ancient wisdom with modern education, nurturing students who balance intellect with inner awareness through integrated academic programs.',
            },
            about: [
              { '@type': 'Thing', name: 'Ancient Wisdom' },
              { '@type': 'Thing', name: 'Modern Education' },
              { '@type': 'Thing', name: 'Integrated Learning' },
              { '@type': 'Thing', name: 'Ethical Education' },
              { '@type': 'Thing', name: 'Conscious Leadership' },
            ],
          },
        ]}
      />
      <div>
        <div className="min-h-screen bg-gray-50">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-orange-50 to-red-50">
            <div className="container-max section-padding">
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                  About <span className="gradient-text">SSH University</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed mb-8">
                  SSH University is a forward-looking centre of learning that harmonises ancient wisdom with modern education. Inspired by the ethos of eYogi Gurukul, we believe that true education nurtures both intellect and inner awareness. Our vibrant learning ecosystem encourages academic excellence, ethical reflection, and purposeful innovation — empowering students to think critically while remaining grounded in timeless human values.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to="/courses">
                    <Button size="lg">Explore Our Programs</Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="outline" size="lg">
                      Get in Touch
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </section>
          {/* Mission Section */}
          <section className="section-padding bg-white">
            <div className="container-max">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">Our Mission</h2>
                  <p className="text-lg text-gray-600 mb-6">
                    At SSH University, we unite the best of both worlds: the rigour of modern scholarship and the depth of traditional insight. Our faculty, students, and partners work together to explore knowledge that not only advances society but also cultivates balance, compassion, and consciousness. Rooted in the spiritual and cultural heritage of India yet open to global perspectives, SSH University stands as a place where ambition meets awareness, and learning becomes a journey of self-realisation and service.
                  </p>
                  <p className="text-lg text-gray-600 mb-8">
                    We design integrated academic programmes that blend contemporary disciplines with the ethical, spiritual, and philosophical foundations of timeless wisdom. Our mission is to cultivate an environment of inquiry, inclusivity, and inner growth, where curiosity and mindfulness coexist.
                  </p>
                  <div className="flex items-center space-x-4">
                    <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                      <BookOpenIcon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Integrated Learning</h3>
                      <p className="text-gray-600">
                        Blending modern scholarship with ancient wisdom
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <img
                    src="/ssh-app/Images/Logo.png"
                    alt="SSH University logo - Ancient wisdom meets modern learning"
                    className="rounded-2xl shadow-2xl object-contain bg-white p-6 logo-pop"
                  />
                </div>
              </div>
            </div>
          </section>
          {/* Stats Section */}
          <section className="section-padding gradient-bg text-white">
            <div className="container-max">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Impact</h2>
                <p className="text-xl opacity-90">Growing community of learners worldwide</p>
              </div>
              <div className="grid md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-4xl md:text-5xl font-bold mb-2">{stat.number}</div>
                    <div className="text-lg opacity-90">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
          {/* Values Section */}
          <section className="section-padding bg-white">
            <div className="container-max">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Our Values</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  The principles that guide our mission to share Vedic wisdom with the world
                </p>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, index) => (
                  <Card key={index} className="text-center card-hover">
                    <CardContent className="pt-8">
                      <div className="h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <value.icon className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                      <p className="text-gray-600">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
          {/* Team Section */}
          <section className="section-padding">
            <div className="container-max">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Meet Our Team</h2>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Dedicated educators and technologists committed to sharing ancient wisdom
                </p>
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {team.map((member, index) => (
                  <Card key={index} className="text-center card-hover">
                    <CardContent className="pt-8">
                      <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4">
                        <img
                          src={member.image}
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
                      <p className="text-orange-600 font-medium mb-3">{member.role}</p>
                      <p className="text-gray-600 text-sm">{member.bio}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
          {/* Vision Section */}
          <section className="section-padding bg-white">
            <div className="container-max">
              <div className="text-center max-w-4xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                  Our Vision for the Future
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  To be a transformative global university where the wisdom of ancient traditions and the innovation of modern science come together — inspiring learners to lead with integrity, wisdom, and compassion, and to create a world guided by knowledge, balance, and collective well-being.
                </p>
                <div className="grid md:grid-cols-3 gap-8 mt-12">
                  <div className="text-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <GlobeAltIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Global Impact</h3>
                    <p className="text-gray-600 text-sm">
                      Creating positive change through integrated learning and sustainable innovation
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <StarIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Conscious Leadership</h3>
                    <p className="text-gray-600 text-sm">
                      Developing leaders who balance ambition with awareness and service
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <HeartIcon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">Collective Well-being</h3>
                    <p className="text-gray-600 text-sm">
                      Fostering harmony between individual growth and planetary consciousness
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
          {/* CTA Section */}
          <section className="section-padding gradient-bg text-white">
            <div className="container-max text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Join Our Community</h2>
              <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
                Become part of a transformative learning community dedicated to harmonizing ancient wisdom with modern education. Join us in our mission to create leaders who balance intellect with inner awareness.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth/signup">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white text-orange-600 hover:bg-gray-100"
                  >
                    Start Your Journey
                  </Button>
                </Link>
                <Link to="/gurukuls">
                  <Button variant="primary" size="lg">
                    Explore Programs
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
