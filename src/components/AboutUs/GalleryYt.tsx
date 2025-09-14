'use client'

import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'

import Video from './Video'

type GalleryYtProps = {
  ytLinks: Array<{ id?: string | null | undefined; Link: string }>
}

function GalleryYt({ ytLinks }: GalleryYtProps) {
  return (
    <Carousel className="h-full [&>div]:h-full">
      <CarouselContent className="h-full max-w-[calc(100vw-16px)] ">
        {ytLinks.map((link, index) => (
          <CarouselItem key={index} className="h-full w-full">
            <div key={index} className="relative rounded-xl overflow-hidden aspect-video group ">
              <Video ytLink={link.Link} />
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious className="h-8 w-8 translate-x-[150%] lg:h-16 lg:w-16 " />
      <CarouselNext className="h-8 w-8 -translate-x-[150%] lg:h-16 lg:w-16 " />
    </Carousel>
  )
}

export default GalleryYt
