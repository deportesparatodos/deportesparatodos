
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
  const timeDisplay = event.status === 'En Vivo' ? 'AHORA' : event.status === 'Desconocido' ? '--:--' : event.time;

  return (
    <div 
      className="relative group cursor-pointer"
      onClick={onClick}
    >
      <div 
        className="w-full overflow-hidden rounded-lg transition-transform duration-300 ease-in-out aspect-video"
      >
        <div className="relative w-full h-full">
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
                <p className="text-muted-foreground font-semibold">{timeDisplay}</p>
                {event.status && event.status !== 'Próximo' && (
                    <Badge className={cn(
                        "text-xs font-bold border-0 h-5",
                        event.status === 'En Vivo' && 'bg-red-600 text-white',
                        event.status === 'Finalizado' && 'bg-black text-white',
                        event.status === 'Desconocido' && 'bg-yellow-500 text-black'
                    )}>{event.status}</Badge>
                )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
