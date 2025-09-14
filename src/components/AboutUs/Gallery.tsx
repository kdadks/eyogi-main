'use client'

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Media } from '@/components/Media'
import { Camera } from 'lucide-react'
import { useState } from 'react'
import { DialogTitle } from '@radix-ui/react-dialog'

type GalleryProps = {
  photos: Array<{
    id?: string | null | undefined
    image: any
  }>
}

function Gallery({ photos }: GalleryProps) {
  const [photosOffset, setPhotosOffSet] = useState<number>(0)
  return (
    <Dialog>
      <DialogContent className="h-[90vh] w-[90vw] p-16">
        <DialogTitle className="hidden" />
        <Carousel
          className="h-full w-full [&>div]:h-full"
          opts={{
            startIndex: photosOffset,
          }}
        >
          <CarouselContent className="h-full">
            {photos.map((photo, index) => (
              <CarouselItem key={index} className="h-full">
                <div className="relative h-full w-full">
                  <Media resource={photo.image} imgClassName="object-scale-down" />
                  <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-full bg-white/50 p-1 px-2 text-xs ">
                    <Camera className="h-3 w-3" /> {`${index + 1} / ${photos.length}`}
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselPrevious />
          <CarouselNext />
        </Carousel>
      </DialogContent>
      <div className="hidden lg:grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.slice(0, 8).map((photo, index) => (
          <DialogTrigger
            key={photo.id}
            className="relative h-full w-full cursor-pointer"
            onClick={() => setPhotosOffSet(index)}
          >
            <Media resource={photo.image} imgClassName="object-cover" className="aspect-square" />
          </DialogTrigger>
        ))}
      </div>

      <Carousel className="h-full lg:hidden [&>div]:h-full">
        <CarouselContent className="h-full max-w-[calc(100vw-16px)] ">
          {photos.map((photo, index) => (
            <CarouselItem key={index} className="h-full w-full">
              <div className="relative aspect-square">
                <Media
                  resource={photo.image}
                  imgClassName="object-cover"
                  className="aspect-square"
                />
                <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-full bg-white/50 p-1 px-2 text-xs">
                  <Camera className="h-3 w-3" /> {`${index + 1} / ${photos.length}`}
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="h-8 w-8 translate-x-[150%]" />
        <CarouselNext className="h-8 w-8 -translate-x-[150%]" />
      </Carousel>
    </Dialog>
  )
}

export default Gallery
