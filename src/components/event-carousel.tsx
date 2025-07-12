
'use client';

import type { FC } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EventCard } from './event-card';
import type { Event } from './event-list';

interface EventCarouselProps {
  title: string;
  events: Event[];
  onSelect: (event: Event, optionUrl: string) => void;
  getEventSelection: (event: Event) => { isSelected: boolean; window: number | null };
}

export const EventCarousel: FC<EventCarouselProps> = ({ title, events, onSelect, getEventSelection }) => {
  if (events.length === 0) {
    return null;
  }

  return (
    <div className="w-full space-y-4">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Carousel
        opts={{
          align: "start",
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {events.map((event, index) => (
            <CarouselItem key={`${event.title}-${index}`} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7 pl-4">
              <EventCard 
                event={event} 
                onSelect={onSelect}
                selection={getEventSelection(event)}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="ml-14" />
        <CarouselNext className="mr-14" />
      </Carousel>
    </div>
  );
};

    