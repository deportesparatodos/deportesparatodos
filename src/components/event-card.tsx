
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
    <div className="group relative aspect-[2/3] w-full overflow-hidden rounded-lg">
      <div className="absolute inset-0">
        <Image
          src={event.image || 'https://placehold.co/400x600.png'}
          alt={event.title}
          layout="fill"
          objectFit="cover"
          className="transition-transform duration-300 group-hover:scale-105"
        />
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent transition-opacity duration-300" />
      </div>
      
      {/* Selection Overlay */}
      {selection.isSelected && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <span className="text-5xl font-extrabold text-white drop-shadow-lg">{selection.window}</span>
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <h3 className="font-bold truncate">{event.title}</h3>
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

      {/* Hover buttons */}
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {event.options.map((option, index) => (
          <Button
            key={index}
            size="sm"
            className="bg-white/80 text-black hover:bg-white backdrop-blur-sm"
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
  );
};

    