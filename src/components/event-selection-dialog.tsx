
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
import type { Event, StreamOption } from './event-carousel';
import { Badge } from './ui/badge';
import { cn, getDomainFromUrl } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2 } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface EventSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSelect: (event: Event, optionUrl: string) => void;
  isModification: boolean;
  onRemove: () => void;
  windowNumber: number;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setEventForDialog: (event: Event) => void;
}

const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);


export const EventSelectionDialog: FC<EventSelectionDialogProps> = ({
  isOpen,
  onOpenChange,
  event,
  onSelect,
  isLoading,
  isModification,
  onRemove,
}) => {
  if (!event) return null;

  const isLive = event.status?.toLowerCase() === 'en vivo';
  const timeDisplay = isLive ? 'AHORA' : isValidTimeFormat(event.time) ? event.time : '--:--';
  
  const selectedOptionUrl = event.selectedOption;
  const isTCChaserEvent = event.source === 'tc-chaser';
  const isChannel = event.category === 'Canal';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md bg-secondary border-border text-foreground p-0 flex flex-col max-h-[90vh]"
        onInteractOutside={(e) => {
           // This allows tooltips to work inside the dialog without closing it.
          if ((e.target as HTMLElement)?.closest('[data-radix-popper-content-wrapper]')) {
            e.preventDefault();
          }
        }}
        >
         <DialogHeader className="flex-shrink-0">
          <div className={cn("relative w-full aspect-video rounded-t-lg overflow-hidden mb-4", (isTCChaserEvent || isChannel) && "bg-white p-2")}>
            <Image
              src={event.image || 'https://i.ibb.co/dHPWxr8/depete.jpg'}
              alt={event.title}
              layout="fill"
              objectFit={(isTCChaserEvent || isChannel) ? 'contain' : 'cover'}
              className={(isTCChaserEvent || isChannel) ? 'object-contain' : 'object-cover'}
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

        <div className="px-6 flex-grow overflow-y-auto min-h-[100px] flex flex-col">
             {isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            ) : event.options.length === 0 ? (
                 <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                    No se encontraron opciones de transmisión.
                </div>
            ) : (
              <ScrollArea className="h-full">
                <TooltipProvider>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pr-4">
                    {event.options.map((option, index) => {
                        const domain = getDomainFromUrl(option.url);
                        const isSelected = selectedOptionUrl === option.url;
                        return (
                            <Tooltip key={index} delayDuration={300}>
                                <TooltipTrigger asChild>
                                    <Button
                                    variant={isSelected ? 'default' : 'secondary'}
                                    className={cn(
                                        "w-full border border-border hover:scale-105 transition-transform duration-200", 
                                        event.options.length === 1 && "sm:col-span-2",
                                        isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                                    )}
                                    onClick={() => onSelect(event, option.url)}
                                    >
                                    {option.label}
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
              </ScrollArea>
            )}
        </div>
         <DialogFooter className="p-6 pt-4 flex-shrink-0">
          {isModification && (
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => {
                onRemove();
                onOpenChange(false);
              }}
            >
              Eliminar Selección
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
