
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Event } from '@/components/event-list';

interface EventCardProps {
  event: Event;
  onSelect: (event: Event, optionUrl: string) => void;
  selection: { isSelected: boolean; window: number | null };
}

export const EventCard: FC<EventCardProps> = ({ event, onSelect, selection }) => {
  return (
    <div className="relative event-card-hover-container">
      <div 
        className={cn(
          "group w-full overflow-hidden rounded-lg transition-all duration-300 ease-in-out",
          "hover:scale-110 hover:z-10 hover:shadow-2xl"
        )}
      >
        <div className="relative aspect-video">
          <Image
            src={event.image || 'https://placehold.co/600x400.png'}
            alt={event.title}
            layout="fill"
            objectFit="cover"
            className="rounded-lg"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          {selection.isSelected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
              <span className="text-5xl font-extrabold text-white drop-shadow-lg">{selection.window}</span>
            </div>
          )}

          <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
            <h3 className="font-bold truncate text-sm">{event.title}</h3>
            <div className="flex items-center justify-between text-xs mt-1">
              <p className="text-muted-foreground font-semibold">{event.time}</p>
              <Badge className={cn(
                  "text-xs font-bold border-0 h-5",
                  event.status === 'En Vivo' && 'bg-red-600 text-white',
                  event.status === 'Próximo' && 'bg-gray-500 text-white',
                  event.status === 'Finalizado' && 'bg-black text-white',
                  event.status === 'Desconocido' && 'bg-yellow-500 text-black'
              )}>{event.status}</Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Hover options panel */}
      <div className="event-card-options absolute left-full top-0 pl-2 h-full transition-all duration-300 ease-in-out z-20 w-full">
         <div className="bg-background rounded-lg shadow-2xl h-full w-full flex flex-col items-center justify-center p-4">
             <h4 className="font-bold text-sm mb-4 text-center truncate w-full">{event.title}</h4>
            <div className="flex flex-col gap-2 w-full">
                {event.options.map((option, index) => (
                <Button
                    key={index}
                    size="sm"
                    className="w-full bg-secondary hover:bg-primary hover:text-primary-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        onSelect(event, option);
                    }}
                >
                    {event.buttons[index] || `Opción ${index + 1}`}
                </Button>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};
