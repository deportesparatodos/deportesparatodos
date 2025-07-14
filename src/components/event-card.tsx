
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

const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);

export const EventCard: FC<EventCardProps> = ({ event, selection, onClick }) => {
  const timeDisplay =
    event.status.toLowerCase() === 'en vivo'
      ? 'AHORA'
      : isValidTimeFormat(event.time)
      ? event.time
      : '--:--';

  return (
    <div 
      className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border border-border flex flex-col h-full"
      onClick={onClick}
    >
      <div className="relative w-full aspect-video">
        <Image
          src={event.image || 'https://i.ibb.co/dHPWxr8/depete.jpg'}
          alt={event.title}
          layout="fill"
          objectFit="cover"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; 
            target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
          }}
        />
        {selection.isSelected && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <span className="text-5xl font-extrabold text-white drop-shadow-lg">{selection.window}</span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col flex-grow">
        <h3 className="font-bold text-sm flex-grow min-h-[40px]">{event.title}</h3>
        <div className="flex items-center justify-between text-xs mt-1">
          <p className="text-muted-foreground font-semibold">{timeDisplay}</p>
          {event.status && (
            <Badge className={cn(
                "text-xs font-bold border-0 h-5",
                event.status.toLowerCase() === 'en vivo' && 'bg-red-600 text-white',
                event.status.toLowerCase() === 'próximo' && 'bg-blue-600 text-white',
                event.status.toLowerCase() === 'finalizado' && 'bg-black text-white',
                event.status.toLowerCase() === 'desconocido' && 'bg-yellow-500 text-black'
            )}>{event.status}</Badge>
          )}
        </div>
      </div>
    </div>
  );
};
