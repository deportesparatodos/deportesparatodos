
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { Event } from './event-carousel';

interface EventCardProps {
  event: Event;
  selection: { isSelected: boolean; window: number | null };
  onClick: () => void;
}

export const EventCard: FC<EventCardProps> = ({ event, selection, onClick }) => {
  const timeDisplay = 
    event.status.toLowerCase() === 'en vivo' ? 'AHORA' : 
    (event.status.toLowerCase() === 'desconocido' || event.status.toLowerCase() === 'finalizado') ? '--:--' : 
    event.time;

  return (
    <div 
      className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg"
      onClick={onClick}
    >
      <div className="relative w-full aspect-video">
        <Image
          src={event.image || 'https://placehold.co/600x400.png'}
          alt={event.title}
          layout="fill"
          objectFit="cover"
        />
        {selection.isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <span className="text-5xl font-extrabold text-white drop-shadow-lg">{selection.window}</span>
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold truncate text-sm">{event.title}</h3>
        <div className="flex items-center justify-between text-xs mt-1">
          <p className="text-muted-foreground font-semibold">{timeDisplay}</p>
          {event.status && event.status.toLowerCase() !== 'próximo' && (
            <Badge className={cn(
                "text-xs font-bold border-0 h-5",
                event.status.toLowerCase() === 'en vivo' && 'bg-red-600 text-white',
                event.status.toLowerCase() === 'finalizado' && 'bg-black text-white',
                event.status.toLowerCase() === 'desconocido' && 'bg-yellow-500 text-black'
            )}>{event.status}</Badge>
          )}
        </div>
      </div>
    </div>
  );
};

    