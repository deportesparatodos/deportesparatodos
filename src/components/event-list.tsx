
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

interface EventGrouping {
    all: boolean;
    f1: boolean;
    mlb: boolean;
    nba: boolean;
    mundialDeClubes: boolean;
    deportesDeCombate: boolean;
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
  eventGrouping: EventGrouping;
}

export const EventListComponent: FC<EventListComponentProps> = ({ onSelectEvent, events, isLoading, error, onRefresh, eventGrouping }) => {
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
  
  const { all: groupAll, f1: groupF1, mlb: groupMlb, mundialDeClubes: groupMundial, nba: groupNba, deportesDeCombate: groupCombate } = eventGrouping;

  const allFilteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const f1Events = groupAll && groupF1 ? allFilteredEvents.filter(event => 
    event.title.toLowerCase().includes('f1') || event.title.toLowerCase().includes('formula 1')
  ) : [];

  const mlbEvents = groupAll && groupMlb ? allFilteredEvents.filter(event => 
    event.title.toLowerCase().includes('mlb') && !f1Events.includes(event)
  ) : [];
  
  const nbaEvents = groupAll && groupNba ? allFilteredEvents.filter(event =>
    (event.title.toLowerCase().includes('nba') || event.image === 'https://p.alangulotv.live/nba') &&
    !f1Events.includes(event) &&
    !mlbEvents.includes(event)
  ) : [];

  const mundialDeClubesEvents = groupAll && groupMundial ? allFilteredEvents.filter(event =>
    event.image === 'https://p.alangulotv.live/copamundialdeclubes' && 
    !f1Events.includes(event) && 
    !mlbEvents.includes(event) &&
    !nbaEvents.includes(event)
  ) : [];

  const combatKeywords = ['boxeo de primera', 'ko', 'wwe', 'ufc', 'boxeo'];
  const combatImages = [
      'https://p.alangulotv.live/ufc',
      'https://p.alangulotv.live/boxeo',
      'https://i.ibb.co/chR144x9/boxing-glove-emoji-clipart-md.png'
  ];

  const deportesDeCombateEvents = groupAll && groupCombate ? allFilteredEvents.filter(event => 
    (combatKeywords.some(keyword => event.title.toLowerCase().includes(keyword)) || (event.image && combatImages.includes(event.image))) &&
    !f1Events.includes(event) && 
    !mlbEvents.includes(event) &&
    !nbaEvents.includes(event) &&
    !mundialDeClubesEvents.includes(event)
  ) : [];


  const otherEvents = allFilteredEvents.filter(event => 
    !f1Events.includes(event) && 
    !mlbEvents.includes(event) && 
    !nbaEvents.includes(event) && 
    !mundialDeClubesEvents.includes(event) &&
    !deportesDeCombateEvents.includes(event)
  );
  
  const isF1Live = f1Events.some(e => e.status === 'En Vivo');
  const isMlbLive = mlbEvents.some(e => e.status === 'En Vivo');
  const isNbaLive = nbaEvents.some(e => e.status === 'En Vivo');
  const isMundialDeClubesLive = mundialDeClubesEvents.some(e => e.status === 'En Vivo');
  const isDeportesDeCombateLive = deportesDeCombateEvents.some(e => e.status === 'En Vivo');


  const renderEventCard = (event: Event, eventIndex: number) => {
    const imageSrc = event.image;

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
              <Accordion type="multiple" defaultValue={[]} className="w-full space-y-4">
                 {f1Events.length > 0 && (
                    <AccordionItem value="f1-events" className="border-b-0">
                        <Card className="bg-muted/50 overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                                <div className="flex w-full items-center">
                                    <div className="w-20 flex-shrink-0">
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{f1Events[0].time}</p>
                                            <span className="text-xs font-mono text-muted-foreground">-</span>
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{f1Events[f1Events.length - 1].time}</p>
                                        </div>
                                    </div>
                                    <div className="flex-grow flex flex-col items-center justify-center gap-2">
                                        {isF1Live && (
                                            <Badge className="text-xs font-bold border-0 rounded-none bg-destructive text-destructive-foreground">En Vivo</Badge>
                                        )}
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
                                    <div className="w-20 flex-shrink-0" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <div className="space-y-4 p-4">
                                    {f1Events.map(renderEventCard)}
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                 )}
                 {mlbEvents.length > 0 && (
                    <AccordionItem value="mlb-events" className="border-b-0">
                        <Card className="bg-muted/50 overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                                <div className="flex w-full items-center">
                                    <div className="w-20 flex-shrink-0">
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{mlbEvents[0].time}</p>
                                            <span className="text-xs font-mono text-muted-foreground">-</span>
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{mlbEvents[mlbEvents.length - 1].time}</p>
                                        </div>
                                    </div>
                                    <div className="flex-grow flex flex-col items-center justify-center gap-2">
                                        {isMlbLive && (
                                            <Badge className="text-xs font-bold border-0 rounded-none bg-destructive text-destructive-foreground">En Vivo</Badge>
                                        )}
                                        <Image
                                            src="https://p.alangulotv.live/mlb"
                                            alt="MLB Logo"
                                            width={60}
                                            height={34}
                                            className="object-contain"
                                            data-ai-hint="mlb logo"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="w-20 flex-shrink-0" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <div className="space-y-4 p-4">
                                    {mlbEvents.map(renderEventCard)}
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                 )}
                 {nbaEvents.length > 0 && (
                    <AccordionItem value="nba-events" className="border-b-0">
                        <Card className="bg-muted/50 overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                                <div className="flex w-full items-center">
                                    <div className="w-20 flex-shrink-0">
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{nbaEvents[0].time}</p>
                                            <span className="text-xs font-mono text-muted-foreground">-</span>
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{nbaEvents[nbaEvents.length - 1].time}</p>
                                        </div>
                                    </div>
                                    <div className="flex-grow flex flex-col items-center justify-center gap-2">
                                        {isNbaLive && (
                                            <Badge className="text-xs font-bold border-0 rounded-none bg-destructive text-destructive-foreground">En Vivo</Badge>
                                        )}
                                        <Image
                                            src="https://p.alangulotv.live/nba"
                                            alt="NBA Logo"
                                            width={30}
                                            height={60}
                                            className="object-contain h-14"
                                            data-ai-hint="nba logo"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="w-20 flex-shrink-0" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <div className="space-y-4 p-4">
                                    {nbaEvents.map(renderEventCard)}
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                 )}
                 {mundialDeClubesEvents.length > 0 && (
                    <AccordionItem value="mundial-de-clubes-events" className="border-b-0">
                        <Card className="bg-muted/50 overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                                <div className="flex w-full items-center">
                                    <div className="w-20 flex-shrink-0">
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{mundialDeClubesEvents[0].time}</p>
                                            <span className="text-xs font-mono text-muted-foreground">-</span>
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{mundialDeClubesEvents[mundialDeClubesEvents.length - 1].time}</p>
                                        </div>
                                    </div>
                                    <div className="flex-grow flex flex-col items-center justify-center gap-2">
                                        {isMundialDeClubesLive && (
                                            <Badge className="text-xs font-bold border-0 rounded-none bg-destructive text-destructive-foreground">En Vivo</Badge>
                                        )}
                                        <Image
                                            src={mundialDeClubesEvents[0].image || "https://upload.wikimedia.org/wikipedia/en/thumb/7/77/FIFA_Club_World_Cup_logo.svg/250px-FIFA_Club_World_Cup_logo.svg.png"}
                                            alt="Mundial de Clubes Logo"
                                            width={50}
                                            height={50}
                                            className="object-contain"
                                            data-ai-hint="club world cup"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="w-20 flex-shrink-0" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <div className="space-y-4 p-4">
                                    {mundialDeClubesEvents.map(renderEventCard)}
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                 )}
                 {deportesDeCombateEvents.length > 0 && (
                    <AccordionItem value="deportes-de-combate-events" className="border-b-0">
                        <Card className="bg-muted/50 overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                                <div className="flex w-full items-center">
                                    <div className="w-20 flex-shrink-0">
                                        <div className="flex flex-col items-center gap-1 text-center">
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{deportesDeCombateEvents[0].time}</p>
                                            <span className="text-xs font-mono text-muted-foreground">-</span>
                                            <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">{deportesDeCombateEvents[deportesDeCombateEvents.length - 1].time}</p>
                                        </div>
                                    </div>
                                    <div className="flex-grow flex flex-col items-center justify-center gap-2">
                                        {isDeportesDeCombateLive && (
                                            <Badge className="text-xs font-bold border-0 rounded-none bg-destructive text-destructive-foreground">En Vivo</Badge>
                                        )}
                                        <Image
                                            src="https://p.alangulotv.live/boxeo"
                                            alt="Deportes de Combate Logo"
                                            width={40}
                                            height={40}
                                            className="object-contain"
                                            data-ai-hint="combat sports"
                                            unoptimized
                                        />
                                        <p className="font-semibold text-sm text-foreground mt-1">Deportes de Combate</p>
                                    </div>
                                    <div className="w-20 flex-shrink-0" />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <div className="space-y-4 p-4">
                                    {deportesDeCombateEvents.map(renderEventCard)}
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                 )}
              </Accordion>
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
