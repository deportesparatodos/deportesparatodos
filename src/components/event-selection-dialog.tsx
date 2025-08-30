

'use client';

import { FC, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogClose,
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
import { Loader2, Trash2, X } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';

interface EventSelectionDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
  onSelect: (event: Event, optionUrl: string) => void;
  isModification: boolean;
  modificationIndex: number | null;
  onRemove: (index: number) => void;
  isLoading: boolean;
  container?: HTMLElement;
}

const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);


export const EventSelectionDialog: FC<EventSelectionDialogProps> = ({
  isOpen,
  onOpenChange,
  event,
  onSelect,
  isModification,
  modificationIndex,
  onRemove,
  isLoading,
  container,
}) => {

  if (!event) return null;

  const isLive = event.status?.toLowerCase() === 'en vivo';
  const timeDisplay = isLive ? 'AHORA' : isValidTimeFormat(event.time) ? event.time : '--:--';
  
  const selectedOptionUrl = event.selectedOption;
  const isTCChaserEvent = event.source === 'tc-chaser';
  const isChannel = event.category === 'Canal';

  const handleRemove = () => {
    if (modificationIndex !== null) {
      onRemove(modificationIndex);
      onOpenChange(false);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogPortal container={container}>
        <DialogContent 
          hideClose={false}
          className="max-w-3xl bg-secondary border-border text-foreground p-0 flex flex-col sm:flex-row max-h-[90vh] sm:h-auto sm:max-h-[500px]"
          onInteractOutside={(e) => {
            if ((e.target as HTMLElement)?.closest('[data-radix-popper-content-wrapper]')) {
              e.preventDefault();
            }
          }}
          >
           {/* Left/Top Panel - Event Info */}
           <div className="w-full sm:w-1/2 flex-shrink-0 flex flex-col">
              <div className="relative w-full aspect-video rounded-t-lg sm:rounded-tr-none sm:rounded-l-lg overflow-hidden">
                <Image
                  src={event.image || 'https://i.ibb.co/dHPWxr8/depete.jpg'}
                  alt={event.title}
                  fill
                  className={(isTCChaserEvent || isChannel) ? 'object-contain bg-white p-2' : 'object-cover'}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null; 
                    target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                  }}
                />
              </div>
              <div className="p-4 text-center">
                <DialogTitle className="text-lg font-bold">{event.title}</DialogTitle>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-1">
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
              </div>
              {isModification && (
                <div className="px-4 pb-4 mt-auto">
                    <Button
                        variant="destructive"
                        className="w-full"
                        onClick={handleRemove}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Eliminar Selección
                    </Button>
                </div>
              )}
           </div>
          
           {/* Right/Bottom Panel - Options */}
           <div className="w-full sm:w-1/2 flex flex-col border-t sm:border-t-0 sm:border-l border-border">
              <ScrollArea className="flex-grow h-full">
                  <div className="flex items-center justify-center h-full p-4">
                      {isLoading ? (
                          <div className="flex items-center justify-center h-full">
                              <Loader2 className="h-8 w-8 animate-spin" />
                          </div>
                      ) : event.options.length === 0 ? (
                          <div className="flex items-center justify-center h-full text-center text-muted-foreground">
                              No se encontraron opciones de transmisión.
                          </div>
                      ) : (
                          <TooltipProvider>
                              <div className="grid grid-cols-1 gap-2 w-full max-w-xs mx-auto">
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
                                                          isSelected && "bg-primary text-primary-foreground hover:bg-primary/90"
                                                      )}
                                                      onClick={() => onSelect(event, option.url)}
                                                  >
                                                      <span className="truncate">{option.label}</span>
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
                      )}
                  </div>
              </ScrollArea>
           </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
