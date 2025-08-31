

'use client';

import { FC } from 'react';
import Image from 'next/image';
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
import { Loader2, Trash2, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RemoteEventSelectionProps {
  event: Event;
  onBack: () => void;
  onSelect: (event: Event, optionUrl: string) => void;
  isModification: boolean;
  onRemove: () => void;
  isLoading: boolean;
}

const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);

export const RemoteEventSelection: FC<RemoteEventSelectionProps> = ({
  event,
  onBack,
  onSelect,
  isModification,
  onRemove,
  isLoading,
}) => {
  const { toast } = useToast();
  if (!event) return null;

  const isLive = event.status?.toLowerCase() === 'en vivo';
  const timeDisplay = isLive ? 'AHORA' : isValidTimeFormat(event.time) ? event.time : '--:--';
  
  const selectedOptionUrl = event.selectedOption;
  const isTCChaserEvent = event.source === 'tc-chaser';
  const isChannel = event.category === 'Canal';
  
  const handleSelect = (optionUrl: string) => {
    onSelect(event, optionUrl);
  };


  return (
    <div className="fixed inset-0 bg-background z-[100] flex flex-col">
        <header className="p-4 border-b flex-shrink-0 flex flex-row items-center gap-2">
            <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                <ArrowLeft />
            </Button>
            <h2 className="text-lg font-bold truncate">{event.title}</h2>
             <p className="sr-only">Selecciona una opción para {event.title}</p>
        </header>
      
        <div className="flex-grow flex flex-col sm:flex-row gap-4 p-4 overflow-hidden">
            {/* Left/Top Panel */}
            <div className="w-full sm:w-1/2 flex-shrink-0 flex flex-col bg-card rounded-lg border border-border">
                <div className="relative w-full aspect-video rounded-t-lg overflow-hidden">
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
                <div className="p-4 text-center flex-grow flex flex-col">
                  <h3 className="text-lg font-bold">{event.title}</h3>
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
                   {isModification && (
                    <div className="mt-auto pt-4">
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
                </div>
            </div>

            {/* Right/Bottom Panel */}
            <div className="w-full sm:w-1/2 flex flex-col bg-card rounded-lg border border-border">
                <div className="flex-grow h-full overflow-y-auto">
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
                                <div className="grid grid-cols-1 gap-2 w-full max-w-xs mx-auto pt-0 pb-4">
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
                                                        onClick={() => handleSelect(option.url)}
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
                </div>
            </div>
        </div>
    </div>
  );
};
