import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Info, GraduationCap, Users, Video, Calendar, BookOpen } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Metadata } from 'next'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import Gallery from '@/components/AboutUs/Gallery'
import GalleryYt from '@/components/AboutUs/GalleryYt'
import { Media } from '@/components/Media'
import VideoYt from '@/components/AboutUs/Video'
import RichText from '@/components/RichText'

export const metadata: Metadata = {
  title: 'About Us',
}

export default async function AboutUsPage() {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.findGlobal({
    slug: 'about-us',
  })

  return (
    <div>
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 relative z-10 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">About eYogi Gurukul</h1>
          <p className="text-xl opacity-90">
            Preserving and sharing ancient wisdom through modern education since 2018
          </p>
        </div>
      </section>

      {/* What is Gurukul Section */}
      <div className="bg-white">
        <section className="py-16 container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
                Our Tradition
              </div>
              <h2 className="text-3xl font-bold mb-6">What is Gurukul?</h2>
              <RichText
                className="text-gray-700"
                data={result.whatIsGurukul.description}
                enableGutter={false}
              />
            </div>
            <div className="relative h-80 md:h-96 rounded-xl overflow-hidden shadow-xl">
              <Media
                resource={result.whatIsGurukul.photo}
                imgClassName="object-cover"
                className="aspect-square"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                <p className="text-white text-sm">
                  Traditional Gurukul - A place of holistic learning and growth
                </p>
              </div>
            </div>
          </div>
        </section>
        {/* What is eYogi Gurukul Section */}
        <section className="py-16 bg-orange-50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1 relative h-80 md:h-96 rounded-xl overflow-hidden shadow-xl">
                <Media
                  resource={result.whatIsEYogiGurukul.photo}
                  imgClassName="object-cover"
                  className="aspect-square"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                  <p className="text-white text-sm">
                    eYogi Gurukul - Blending tradition with modern education
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
                  Our Organization
                </div>
                <h2 className="text-3xl font-bold mb-6">What is eYogi Gurukul?</h2>
                <RichText
                  className="text-gray-700"
                  data={result.whatIsEYogiGurukul.description}
                  enableGutter={false}
                />
              </div>
            </div>
          </div>
        </section>
        {/* Videos and Photos Gallery Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Our Journey
            </div>
            <h2 className="text-3xl font-bold">Videos & Photos</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Explore our gallery of memorable moments, classes, events, and celebrations from over
              the years.
            </p>
          </div>
          <Tabs defaultValue="photos" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
              <TabsTrigger
                value="photos"
                className="flex items-center gap-2 data-[state=active]:bg-orange-100 text-base hover:bg-orange-200"
              >
                <Info className="h-4 w-4" /> Photos
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="flex items-center gap-2 data-[state=active]:bg-orange-100 text-base hover:bg-orange-200"
              >
                <Video className="h-4 w-4" /> Videos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="photos" className="mt-8">
              <Gallery photos={result.gallery.galleryImages} />
            </TabsContent>
            <TabsContent value="videos" className="mt-8 p-0">
              <GalleryYt ytLinks={result.gallery.ytLinks} />
            </TabsContent>
          </Tabs>
        </section>
        {/* Course Experience Section */}
        {/* <section className="py-16 bg-orange-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
                Our Courses
              </div>
              <h2 className="text-3xl font-bold">The Course Experience</h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                Discover what a typical course looks like at eYogi Gurukul, from interactive classes
                to assessments and graduation.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="overflow-hidden border-none shadow-lg">
                <div className="relative h-48">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Interactive class session"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm">
                    Classes
                  </div>
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Interactive Learning</h3>
                  <p className="text-gray-600">
                    Our classes blend traditional teaching methods with modern technology. Students
                    engage in discussions, practice sessions, and receive personalized guidance from
                    experienced Gurus.
                  </p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-none shadow-lg">
                <div className="relative h-48">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Quiz session"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm">
                    Assessment
                  </div>
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Knowledge Assessment</h3>
                  <p className="text-gray-600">
                    Students demonstrate their understanding through quizzes, projects, and
                    practical demonstrations. Assessment is designed to be supportive and
                    growth-oriented.
                  </p>
                </CardContent>
              </Card>
              <Card className="overflow-hidden border-none shadow-lg">
                <div className="relative h-48">
                  <Image
                    src="/placeholder.svg?height=400&width=600"
                    alt="Graduation ceremony"
                    fill
                    className="object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-orange-600 text-white px-3 py-1 rounded-full text-sm">
                    Graduation
                  </div>
                </div>
                <CardContent className="pt-6">
                  <h3 className="font-bold text-lg mb-2">Celebration of Achievement</h3>
                  <p className="text-gray-600">
                    Upon completion, students participate in a traditional graduation ceremony that
                    honors their dedication and accomplishments in preserving and advancing ancient
                    knowledge.
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="mt-12 text-center">
              <div className="relative aspect-video max-w-3xl mx-auto rounded-xl overflow-hidden shadow-xl">
                <Image
                  src="/placeholder.svg?height=600&width=1000"
                  alt="Course teaching video"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-orange-600 rounded-full p-4 text-white shadow-lg hover:bg-orange-700 cursor-pointer transition-transform hover:scale-110">
                    <Play className="h-10 w-10" />
                  </div>
                </div>
              </div>
              <p className="text-gray-600 mt-4">
                Watch a sample class to experience our teaching methodology
              </p>
            </div>
          </div>
        </section> */}

        {/* Lectures and Workshops Section */}
        <section className="py-16  bg-orange-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
                Public Engagements
              </div>
              <h2 className="text-3xl font-bold">Lectures & Workshops</h2>
              <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
                Our Gurus regularly conduct public lectures and workshops on Indian Knowledge
                Systems and related topics.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative rounded-xl overflow-hidden aspect-video shadow-xl before:content-[''] before:absolute before:inset-0 before:z-10 hover:before:pointer-events-none before:pointer-events-auto">
                <VideoYt ytLink={result.lecturesAndWorkshops[0].ytLink} />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-4">Sharing Ancient Wisdom</h3>
                <p className="text-gray-700 mb-4">
                  Our public lectures and workshops are designed to introduce the richness of Indian
                  Knowledge Systems to a wider audience. These sessions cover a range of topics
                  including:
                </p>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-start">
                    <div className="bg-orange-100 p-1 rounded-full mr-3 mt-1">
                      <BookOpen className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-gray-700">
                      <strong>Vedic Knowledge:</strong> Exploring the wisdom of ancient texts
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-orange-100 p-1 rounded-full mr-3 mt-1">
                      <Users className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-gray-700">
                      <strong>Yoga Philosophy:</strong> Understanding the deeper aspects of yoga
                      beyond physical postures
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-orange-100 p-1 rounded-full mr-3 mt-1">
                      <Calendar className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-gray-700">
                      <strong>Cultural Traditions:</strong> Celebrating and preserving cultural
                      heritage
                    </span>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-orange-100 p-1 rounded-full mr-3 mt-1">
                      <GraduationCap className="h-4 w-4 text-orange-600" />
                    </div>
                    <span className="text-gray-700">
                      <strong>Modern Applications:</strong> Applying ancient wisdom to contemporary
                      challenges
                    </span>
                  </li>
                </ul>
                <p className="text-gray-700">
                  These events serve as gateways for many to discover the depth and relevance of
                  traditional knowledge in today&apos;s world, often inspiring participants to join
                  our more comprehensive courses.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Events Section */}
        <section className="py-16 container mx-auto px-4">
          <div className="text-center mb-12">
            <div className="inline-block bg-orange-100 text-orange-600 px-4 py-1 rounded-full text-sm font-medium mb-4">
              Our Events
            </div>
            <h2 className="text-3xl font-bold">Graduation Events & Celebrations</h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Our graduation ceremonies are joyous occasions that honor students&apos; achievements
              and showcase their learning journey.
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <RichText
                className="text-gray-700"
                data={result.graduationEvents.description}
                enableGutter={false}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {result.graduationEvents.photos.map((photo) => (
                <div className="relative aspect-square rounded-lg overflow-hidden" key={photo.id}>
                  <Media
                    resource={photo.photo}
                    imgClassName="object-cover"
                    className="aspect-square"
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
      </div>
      <section className="py-16 text-white">
        <div className="container mx-auto flex flex-col px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Our Community</h2>
          <p className="max-w-2xl mx-auto mb-8 text-orange-50">
            Experience the transformative power of ancient wisdom in a modern context. Explore our
            courses, attend our events, or connect with our community.
          </p>
          <div className="flex justify-center gap-4 lg:gap-8">
            <Button
              className="text-lg md:text-2xl bg-white text-orange-700 hover:scale-105 transition-transform rounded-xl hover:bg-white"
              size="lg"
              asChild
            >
              <Link href="/membership">Membership</Link>
            </Button>
            <Button
              className="text-lg md:text-2xl hover:scale-105 bg-transparent text-white hover:bg-white hover:text-red-600 border-2 transition-all border-white rounded-xl"
              size="lg"
              asChild
            >
              <Link href="/donation">Donate</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
