
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
import { cn, getDomainFromUrl } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EventSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  selectedEvents: (Event | null)[];
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
  selectedEvents,
  onSelect,
  isModification,
  onRemove,
  windowNumber,
}) => {
  if (!event) return null;

  const timeDisplay = isValidTimeFormat(event.time) ? event.time : '';
  
  const selectedOptionUrl = event.selectedOption;


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-secondary border-border text-foreground p-0"
        onInteractOutside={(e) => {
           // This allows tooltips to work inside the dialog without closing it.
          if ((e.target as HTMLElement)?.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
        >
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
          <DialogTitle className="text-center text-lg font-bold px-6">{event.title}</DialogTitle>
           <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-1 px-6">
                {timeDisplay && <p className="font-semibold">{timeDisplay}</p>}
                {event.status && (
                    <Badge className={cn(
                        "text-xs font-bold border-0 h-5",
                        event.status.toLowerCase() === 'en vivo' && 'bg-red-600 text-white',
                        event.status.toLowerCase() === 'próximo' && 'bg-gray-600 text-white',
                        event.status.toLowerCase() === 'finalizado' && 'bg-black text-white',
                        event.status.toLowerCase() === 'desconocido' && 'bg-yellow-500 text-black'
                    )}>{event.status}</Badge>
                )}
            </div>
        </DialogHeader>

        <div className="py-4 px-6">
            <TooltipProvider>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {event.options.map((option, index) => {
                    const domain = getDomainFromUrl(option);
                    return (
                        <Tooltip key={index} delayDuration={300}>
                            <TooltipTrigger asChild>
                                <Button
                                variant={selectedOptionUrl === option ? 'default' : 'secondary'}
                                className={cn(
                                "w-full border border-border hover:scale-105 transition-transform duration-200", 
                                event.options.length === 1 && "sm:col-span-2"
                                )}
                                onClick={() => onSelect(event, option)}
                                >
                                {event.buttons[index] || `Opción ${index + 1}`}
                                </Button>
                            </TooltipTrigger>
                            {domain && (
                                <TooltipContent>
                                    <p>{domain}</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    );
                })}
                </div>
            </TooltipProvider>
        </div>

      </DialogContent>
    </Dialog>
  );
};
