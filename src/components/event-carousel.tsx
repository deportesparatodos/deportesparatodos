
'use client';

import { FC, useState, useEffect } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { EventCard } from './event-card';
import type { Channel } from './channel-list';
import { Card } from './ui/card';
import Image from 'next/image';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import { Star } from 'lucide-react';
import type { APIMatch } from './featured-match-card';
import { FeaturedMatchCard } from './featured-match-card';

export interface StreamOption {
  url: string;
  label: string;
  hd: boolean;
  language: string;
}

export interface Event {
  id: string;
  time: string;
  title: string;
  options: StreamOption[];
  sources: { source: string; id: string }[];
  buttons: string[];
  category: string;
  language: string;
  date: string;
  source: string;
  image?: string;
  status: 'Próximo' | 'En Vivo' | 'Finalizado' | 'Desconocido';
  selectedOption?: string;
}

interface EventCarouselProps {
  title: string;
  events?: Event[];
  channels?: Channel[];
  onCardClick?: (event: Event) => void;
  onChannelClick?: (channel: Channel) => void;
  getEventSelection?: (event: Event) => { isSelected: boolean; selectedOption: string | null; index: number };
}

export const EventCarousel: FC<EventCarouselProps> = ({ title, events, channels, onCardClick, onChannelClick, getEventSelection }) => {
  const allItems = [
    ...(channels || []),
    ...(events || [])
  ];

  if (!allItems.length) {
    return null;
  }

  return (
    <div className="w-full space-y-2">
      <Carousel
        opts={{
          align: 'start',
          dragFree: true,
          slidesToScroll: 'auto',
        }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-bold">{title}</h2>
          <div className="flex items-center gap-2">
            <CarouselPrevious variant="outline" className="static -translate-x-0 -translate-y-0 rounded-md" />
            <CarouselNext variant="outline" className="static -translate-x-0 -translate-y-0 rounded-md" />
          </div>
        </div>
        <CarouselContent className="-ml-4">
          {allItems.map((item, index) => {
            const isChannel = 'urls' in item;
            
            if (isChannel) {
              const channel = item as Channel;
              const cardOnClick = () => onChannelClick && onChannelClick(channel);
              const cardContent = (
                 <>
                  <div className="relative w-full aspect-video flex items-center justify-center p-4 bg-white flex-shrink-0">
                    <Image
                      src={channel.logo}
                      alt={`${channel.name} logo`}
                      fill
                      className="object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                      }}
                    />
                    {getEventSelection && (() => {
                        const channelAsEvent: Event = { id: `${channel.name}-channel-static`, title: channel.name, options: channel.urls.map(u => ({...u, hd: false, language: ''})), sources: [], buttons: [], time: 'AHORA', category: 'Canal', language: '', date: '', source: '', status: 'En Vivo', image: channel.logo };
                        const selection = getEventSelection(channelAsEvent);
                        return selection.isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="hsl(142.1 76.2% 44.9%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check drop-shadow-lg"><path d="M20 6 9 17l-5-5"/></svg>
                        </div>
                        );
                    })()}
                  </div>
                  <div className="p-3 bg-card flex-grow flex flex-col justify-center min-h-[52px]">
                    <h3 className="font-bold text-sm text-center line-clamp-2">{channel.name}</h3>
                    {channel.recommended && (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-xs font-bold uppercase text-yellow-400">Recomendado</span>
                      </div>
                    )}
                  </div>
                 </>
              );

              return (
              <CarouselItem
                key={`channel-${channel.name}-${index}`}
                className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7 pl-4"
              >
                <Card
                  className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border h-full w-full flex flex-col"
                  onClick={cardOnClick}
                >
                  {cardContent}
                </Card>
              </CarouselItem>
            )
            } else {
              const event = item as Event;
               return (
                <CarouselItem
                  key={`${event.id}-${index}`}
                  className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7 pl-4"
                >
                  <EventCard
                    event={event}
                    selection={getEventSelection ? getEventSelection(event) : { isSelected: false, selectedOption: null, index: -1 }}
                    onClick={() => onCardClick && onCardClick(event)}
                  />
                </CarouselItem>
              );
            }
          })}
        </CarouselContent>
      </Carousel>
    </div>
  );
};

    