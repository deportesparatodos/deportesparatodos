
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

interface RemoteEventSelectionProps {
  event: Event;
  onSelect: (event: Event, optionUrl: string) => void;
  isModification: boolean;
  onRemove: () => void;
  onClose: () => void;
}

const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);

export const RemoteEventSelection: FC<RemoteEventSelectionProps> = ({
  event,
  onSelect,
  isModification,
  onRemove,
  onClose,
}) => {
  if (!event) return null;

  const isLive = event.status?.toLowerCase() === 'en vivo';
  const timeDisplay = isLive ? 'AHORA' : isValidTimeFormat(event.time) ? event.time : '--:--';
  
  const selectedOptionUrl = event.selectedOption;
  const isTCChaserEvent = event.source === 'tc-chaser';
  const isChannel = event.category === 'Canal';

  return (
    <div className="fixed inset-0 z-[210] bg-background text-foreground flex flex-col">
      <header className="flex-shrink-0 p-4 flex items-center gap-2 border-b">
        <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowLeft />
        </Button>
        <h2 className="text-lg font-bold truncate">{event.title}</h2>
      </header>

      <div className="flex-grow overflow-y-auto">
        <div className="relative w-full aspect-video">
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
        <div className="p-4 space-y-4">
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
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

            {event.options.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-muted-foreground min-h-[100px]">
                    No se encontraron opciones de transmisión.
                </div>
            ) : (
                <TooltipProvider>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {event.options.map((option, index) => {
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
                                    <TooltipContent>
                                        <p>{getDomainFromUrl(option.url) || 'N/A'}</p>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </TooltipProvider>
            )}
        </div>
      </div>
      
      {isModification && (
        <footer className="p-4 flex-shrink-0 border-t">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onRemove}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Eliminar Selección
          </Button>
        </footer>
      )}
    </div>
  );
};

