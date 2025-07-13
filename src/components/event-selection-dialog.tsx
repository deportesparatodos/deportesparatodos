
'use client';

import type { FC } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { Event } from './event-carousel';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface EventSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSelect: (event: Event, optionUrl: string) => void;
  isModification: boolean;
  onRemove: () => void;
  windowNumber: number;
}

const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);


export const EventSelectionDialog: FC<EventSelectionDialogProps> = ({
  isOpen,
  onOpenChange,
  event,
  onSelect,
  isModification,
  onRemove,
  windowNumber,
}) => {
  if (!event) return null;

  const timeDisplay = isValidTimeFormat(event.time) ? event.time : '';


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-secondary border-border text-foreground">
        <DialogHeader>
          <div className="relative w-full aspect-video rounded-t-lg overflow-hidden mb-4">
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
          </div>
          <DialogTitle className="text-center text-lg font-bold">{event.title}</DialogTitle>
           <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-1">
                {timeDisplay && <p className="font-semibold">{timeDisplay}</p>}
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
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2 py-4">
          {event.options.map((option, index) => (
            <Button
              key={index}
              className="w-full bg-background hover:bg-primary hover:text-primary-foreground text-white"
              onClick={() => onSelect(event, option)}
            >
              {event.buttons[index] || `Opción ${index + 1}`}
            </Button>
          ))}
        </div>

        {isModification && (
          <DialogFooter>
            <Button
              variant="destructive"
              className="w-full"
              onClick={onRemove}
            >
              Eliminar Selección
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};
