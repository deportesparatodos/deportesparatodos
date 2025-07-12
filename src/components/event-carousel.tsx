
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


export interface Event {
  time: string;
  title: string;
  options: string[];
  buttons: string[];
  category: string;
  language: string;
  date: string;
  source: string;
  image?: string;
  status: 'Próximo' | 'En Vivo' | 'Finalizado' | 'Desconocido';
}


interface EventCarouselProps {
  title: string;
  events: Event[];
  onSelect: (event: Event, optionUrl: string) => void;
  getEventSelection: (event: Event) => { isSelected: boolean; window: number | null };
  activeWindow: number;
}

export const EventCarousel: FC<EventCarouselProps> = ({ title, events, onSelect, getEventSelection, activeWindow }) => {
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
          slidesToScroll: 'auto',
        }}
        className="w-full relative"
      >
        <CarouselContent className="-ml-4 py-4 px-12">
          {events.map((event, index) => (
            <CarouselItem key={`${event.title}-${index}`} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7 pl-4">
              <EventCard 
                event={event} 
                onSelect={onSelect}
                selection={getEventSelection(event)}
                activeWindow={activeWindow}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
        <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
      </Carousel>
    </div>
  );
};
