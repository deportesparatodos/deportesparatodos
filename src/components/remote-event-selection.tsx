

'use client';

import { FC } from 'react';
import Image from 'next/image';
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
import { Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area';
import { DialogContent, DialogHeader, DialogTitle } from './ui/dialog';


interface RemoteEventSelectionProps {
  event: Event;
  onSelect: (event: Event, optionUrl: string) => void;
  isModification: boolean;
  onRemove: () => void;
  isLoading: boolean;
  onBack: () => void;
}

const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);


export const RemoteEventSelection: FC<RemoteEventSelectionProps> = ({
  event,
  onSelect,
  isModification,
  onRemove,
  isLoading,
  onBack,
}) => {
  if (!event) return null;

  const isLive = event.status?.toLowerCase() === 'en vivo';
  const timeDisplay = isLive ? 'AHORA' : isValidTimeFormat(event.time) ? event.time : '--:--';
  
  const selectedOptionUrl = event.selectedOption;
  const isTCChaserEvent = event.source === 'tc-chaser';
  const isChannel = event.category === 'Canal';

  return (
      <DialogContent className="sm:max-w-md bg-secondary border-border text-foreground p-0 flex flex-col max-h-[90vh]">
        <DialogHeader className="p-4 border-b border-border flex-shrink-0 flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-8 w-8">
                <ArrowLeft />
            </Button>
            <DialogTitle className="text-lg font-bold truncate">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0">
            <div className={cn("relative w-full aspect-video", (isTCChaserEvent || isChannel) && "bg-white p-2")}>
              <Image
                src={event.image || 'https://i.ibb.co/dHPWxr8/depete.jpg'}
                alt={event.title}
                fill
                className={(isTCChaserEvent || isChannel) ? 'object-contain' : 'object-cover'}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null; 
                  target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                }}
              />
            </div>
            <div className="px-6 pt-4 pb-2">
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
        </div>
        
        <ScrollArea className="flex-grow h-0 px-6">
            <div className="pt-0 pb-4">
                {isLoading ? (
                    <div className="flex items-center justify-center h-full min-h-[100px]">
                        <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                ) : event.options.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-center text-muted-foreground min-h-[100px]">
                        No se encontraron opciones de transmisión.
                    </div>
                ) : (
                    <TooltipProvider>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
        
        {isModification && (
            <div className="px-6 flex-shrink-0 border-t border-border pt-4 pb-4">
                <Button
                    variant="destructive"
                    className="w-full"
                    onClick={onRemove}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Eliminar Selección
                </Button>
            </div>
        )}
      </DialogContent>
  );
};
