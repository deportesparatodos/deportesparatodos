
"use client";

import type { FC } from 'react';
import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, Loader2, AlertTriangle, Tv, Search, X, RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


export interface Event {
  time: string;
  title: string;
  options: string[];
  buttons: string[];
  category: string;
  language: string;
  date: string;
  source: string;
  image?: string;
  status: 'Próximo' | 'En Vivo' | 'Finalizado';
}

interface CopiedStates {
  [key: string]: boolean;
}

interface EventListComponentProps {
  onSelectEvent?: (url: string) => void;
  events: Event[];
  isLoading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

export const EventListComponent: FC<EventListComponentProps> = ({ onSelectEvent, events, isLoading, error, onRefresh }) => {
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});
  const [searchTerm, setSearchTerm] = useState('');
  const isSelectMode = !!onSelectEvent;

  const handleAction = async (url: string) => {
    if (isSelectMode && onSelectEvent) {
      onSelectEvent(url);
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedStates(prev => ({ ...prev, [url]: true }));
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [url]: false }));
        }, 1500);
      } catch (err) {
        console.error("Error al copiar: ", err);
      }
    }
  };
  
  const allFilteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const f1Events = allFilteredEvents.filter(event => 
    event.title.toLowerCase().includes('f1') || event.title.toLowerCase().includes('formula 1')
  );

  const otherEvents = allFilteredEvents.filter(event => 
    !f1Events.includes(event)
  );

  const renderEventCard = (event: Event, eventIndex: number) => {
    const imageSrc = event.title.toLowerCase().includes('mlb')
      ? 'https://p.alangulotv.live/mlb'
      : event.image;

    return (
      <Card key={`${event.title}-${eventIndex}`} className="bg-muted/50 overflow-hidden">
        <div className="flex items-center gap-4 p-4">
          {imageSrc && (
            <Image
              src={imageSrc}
              alt={event.title}
              width={56}
              height={56}
              className="rounded-md object-cover h-14 w-14 flex-shrink-0"
              data-ai-hint="event broadcast"
              unoptimized
            />
          )}
          <div className="flex-grow">
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2 flex-wrap flex-grow">
                <p className="font-semibold text-foreground text-sm leading-tight">{event.title}</p>
                {event.status && (
                  <Badge className={cn(
                    "text-xs font-bold border-0 rounded-none",
                    event.status === 'En Vivo' && 'bg-destructive text-destructive-foreground',
                    event.status === 'Próximo' && 'bg-muted-foreground text-background',
                    event.status === 'Finalizado' && 'bg-black text-white'
                  )}>{event.status}</Badge>
                )}
              </div>
              <div className="flex-shrink-0">
                <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md">{event.time}</p>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Canales</h4>
              <div className="flex flex-wrap gap-2">
                {event.options.map((url, channelIndex) => {
                  const isCopied = copiedStates[url];
                  const buttonLabel = event.buttons[channelIndex] || 'Canal';
                  const Icon = isSelectMode ? Tv : (isCopied ? CheckCircle2 : Copy);

                  return (
                    <Tooltip key={`${event.title}-${eventIndex}-${channelIndex}`}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className={cn(
                            "transition-all duration-200 h-auto whitespace-normal justify-start text-left py-1.5",
                            !isSelectMode && isCopied && "border-green-500 bg-green-500/10 text-green-600 hover:text-green-600"
                          )}
                          onClick={() => handleAction(url)}
                        >
                          <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span>{isSelectMode ? buttonLabel : (isCopied ? '¡Copiado!' : 'Copiar')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{isSelectMode ? `Seleccionar ${buttonLabel}` : `Copiar ${buttonLabel}`}</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </Card>
    );
  };


  if (isLoading && !allFilteredEvents.length) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>{error}</p>
        <p className="text-sm text-muted-foreground">Inténtalo de nuevo más tarde.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-card text-card-foreground flex flex-col">
      <div className="px-6 flex-shrink-0 pb-5">
        <div className="flex items-center gap-2">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar evento por título..."
              className="h-9 w-full pl-10 pr-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          {onRefresh && (
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 flex-shrink-0"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <span className="sr-only">Actualizar eventos</span>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      <div className="flex-grow px-4 pb-4 overflow-y-auto">
        <TooltipProvider delayDuration={300}>
          {allFilteredEvents.length > 0 ? (
            <div className="space-y-4">
              {f1Events.length > 0 && (
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="f1-events" className="border-b-0">
                        <Card className="bg-muted/50 overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                                <div className="flex w-full items-center">
                                    <div className="flex flex-col items-center justify-center text-sm font-semibold text-primary w-16 flex-shrink-0">
                                        <span>{f1Events[0].time}</span>
                                        <span>-</span>
                                        <span>{f1Events[f1Events.length - 1].time}</span>
                                    </div>
                                    <div className="flex-grow flex justify-center">
                                        <Image
                                            src="https://p.alangulotv.live/f1"
                                            alt="Formula 1 Logo"
                                            width={80}
                                            height={20}
                                            className="object-contain"
                                            data-ai-hint="formula 1 logo"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="w-16 flex-shrink-0" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <div className="space-y-4 p-4">
                                    {f1Events.map(renderEventCard)}
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                </Accordion>
              )}
              {otherEvents.map(renderEventCard)}
            </div>
          ) : (
             <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center">
                    {searchTerm ? `No se encontraron eventos para "${searchTerm}".` : "No hay eventos disponibles."}
                </p>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};
