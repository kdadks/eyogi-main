import React from 'react'
import { Link } from 'react-router-dom'
import SEOHead from '../components/seo/SEOHead'
import { generateBreadcrumbSchema } from '../components/seo/StructuredData'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
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
      title: 'Authentic Wisdom',
      description:
        'We preserve and share the authentic teachings of Sanatana Dharma with respect and accuracy.',
    },
    {
      icon: GlobeAltIcon,
      title: 'Global Harmony',
      description:
        'Building bridges between ancient wisdom and modern life to create peace and understanding.',
    },
    {
      icon: UserGroupIcon,
      title: 'Inclusive Learning',
      description:
        'Welcoming learners from all backgrounds to explore and benefit from Vedic knowledge.',
    },
    {
      icon: AcademicCapIcon,
      title: 'Excellence in Education',
      description:
        'Providing high-quality, structured learning experiences with certified instructors.',
    },
  ]

  const team = [
    {
      name: 'Dr. Rajesh Sharma',
      role: 'Founder & Chief Academic Officer',
      image:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop&crop=face',
      bio: 'PhD in Sanskrit Studies with 20+ years of teaching experience in Vedic philosophy.',
    },
    {
      name: 'Priya Patel',
      role: 'Director of Curriculum',
      image:
        'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=300&h=300&fit=crop&crop=face',
      bio: 'Master in Hindu Philosophy, specializing in age-appropriate spiritual education.',
    },
    {
      name: 'Arjun Kumar',
      role: 'Technology Director',
      image:
        'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&h=300&fit=crop&crop=face',
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
        title="About eYogi Gurukul - Hindu Education & Vedic Learning Mission"
        description="Discover eYogi Gurukul's mission to connect ancient Hindu wisdom with modern learning. Learn about our authentic Vedic education approach, expert teachers, and global community of Sanatan Dharma learners."
        keywords={[
          'About eYogi Gurukul',
          'Hindu Education Mission',
          'Vedic Learning Philosophy',
          'Sanatan Dharma Education',
          'Hindu Culture Preservation',
          'Vedic Wisdom Sharing',
          'Traditional Hindu Education',
          'Authentic Hindu Teaching',
          'Hindu Heritage Mission',
          'Vedic Knowledge Preservation',
          'Hindu Spiritual Education',
          'Dharma Education Mission',
          'Hindu Values Teaching',
          'Indian Hindu Culture Education',
          'Vedic Tradition Learning',
        ]}
        canonicalUrl="/about"
        structuredData={[
          generateBreadcrumbSchema([
            { name: 'Home', url: '/' },
            { name: 'About Hindu Education', url: '/about' },
          ]),
          {
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: 'About eYogi Gurukul - Hindu Education Mission',
            description:
              "Learn about eYogi Gurukul's mission to preserve and share authentic Hindu wisdom through modern educational technology.",
            url: 'https://eyogi-gurukul.vercel.app/about',
            mainEntity: {
              '@type': 'EducationalOrganization',
              name: 'eYogi Gurukul',
              mission:
                'To connect ancient Hindu wisdom with modern learning technology, creating eYogis who bridge spiritual science with contemporary life.',
            },
            about: [
              { '@type': 'Thing', name: 'Hindu Education' },
              { '@type': 'Thing', name: 'Vedic Learning' },
              { '@type': 'Thing', name: 'Sanatan Dharma' },
              { '@type': 'Thing', name: 'Hindu Culture Preservation' },
            ],
          },
        ]}
      />
      <div className="min-h-screen bg-gray-50 page-with-header">
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-orange-50 to-red-50">
          <div className="container-max section-padding">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                About <span className="gradient-text">eYogi Gurukul</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-8">
                The "e" in "eYogi Gurukul" connects the ancient Vedic practices of meditation and
                Spirituality of Hinduism to the modern world of science and globalization. We are
                dedicated to preserving and sharing the timeless wisdom of Sanatana Dharma through
                innovative online education.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/courses">
                  <Button size="lg">Explore Our Courses</Button>
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
                  An "eYogi" is a practitioner of meditation and Spirituality who connects the
                  ancient science and Spirituality of Sanatana Dharma (Eternal Laws that govern the
                  inner world) to the modern world. eYogis respect other cultures and embrace
                  integration to build peace and harmony in the world.
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  We believe that ancient wisdom has profound relevance in today's world, offering
                  solutions to modern challenges through time-tested principles of dharma,
                  meditation, and spiritual growth.
                </p>
                <div className="flex items-center space-x-4">
                  <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                    <BookOpenIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">Bridging Ancient & Modern</h3>
                    <p className="text-gray-600">
                      Connecting timeless wisdom with contemporary life
                    </p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <img
                  src="/Images/Logo.png"
                  alt="eYogi Gurukul logo - Ancient wisdom meets modern learning"
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
                We envision a world where ancient wisdom and modern knowledge work together to
                create a more peaceful, harmonious, and spiritually aware global community. Through
                education, we aim to bridge cultural divides and foster understanding between
                different traditions and ways of life.
              </p>
              <div className="grid md:grid-cols-3 gap-8 mt-12">
                <div className="text-center">
                  <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <GlobeAltIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Global Reach</h3>
                  <p className="text-gray-600 text-sm">
                    Making Vedic wisdom accessible to learners worldwide
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <StarIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Excellence</h3>
                  <p className="text-gray-600 text-sm">
                    Maintaining the highest standards in spiritual education
                  </p>
                </div>
                <div className="text-center">
                  <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <HeartIcon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold mb-2">Compassion</h3>
                  <p className="text-gray-600 text-sm">
                    Teaching with love, respect, and understanding
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
              Become part of a global community dedicated to learning, growing, and sharing the
              timeless wisdom of Vedic traditions.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/signup">
                <Button
                  variant="secondary"
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100"
                >
                  Start Learning Today
                </Button>
              </Link>
              <Link to="/gurukuls">
                <Button variant="primary" size="lg">
                  Explore Gurukuls
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}
