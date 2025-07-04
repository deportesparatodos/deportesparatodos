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
    enVivo: boolean;
    f1: boolean;
    mlb: boolean;
    nba: boolean;
    mundialDeClubes: boolean;
    deportesDeCombate: boolean;
    liga1: boolean;
    ligaPro: boolean;
    mls: boolean;
    otros: boolean;
}

interface CopiedStates {
  [key: string]: boolean;
}

interface EventListComponentProps {
  onSelectEvent?: (url: string) => void;
  events: Event[];
  isLoading: boolean;
  error: string | null;
  eventGrouping: EventGrouping;
  searchTerm: string;
}

export const EventListComponent: FC<EventListComponentProps> = ({ onSelectEvent, events, isLoading, error, eventGrouping, searchTerm }) => {
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});
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
  
  const { all: groupAll, enVivo: groupEnVivo, f1: groupF1, mlb: groupMlb, mundialDeClubes: groupMundial, nba: groupNba, deportesDeCombate: groupCombate, liga1: groupLiga1, ligaPro: groupLigaPro, mls: groupMls, otros: groupOtros } = eventGrouping;

  const allFilteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const liveEvents = allFilteredEvents.filter(event => event.status === 'En Vivo');

  const mundialDeClubesEvents = groupAll && groupMundial ? allFilteredEvents.filter(event =>
    event.image === 'https://p.alangulotv.live/copamundialdeclubes'
  ) : [];

  const nbaEvents = groupAll && groupNba ? allFilteredEvents.filter(event =>
    (event.title.toLowerCase().includes('nba') || event.image === 'https://p.alangulotv.live/nba') &&
    !mundialDeClubesEvents.includes(event)
  ) : [];
  
  const f1Events = groupAll && groupF1 ? allFilteredEvents.filter(event => 
    (event.title.toLowerCase().includes('f1') || event.title.toLowerCase().includes('formula 1')) &&
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event)
  ) : [];

  const mlbEvents = groupAll && groupMlb ? allFilteredEvents.filter(event => 
    (event.title.toLowerCase().includes('mlb') || event.image === 'https://p.alangulotv.live/mlb') && 
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event) &&
    !f1Events.includes(event)
  ) : [];
  
  const combatKeywords = ['boxeo de primera', 'ko', 'wwe', 'ufc', 'boxeo'];
  const combatImages = [
      'https://p.alangulotv.live/ufc',
      'https://p.alangulotv.live/boxeo',
      'https://i.ibb.co/chR144x9/boxing-glove-emoji-clipart-md.png'
  ];

  const deportesDeCombateEvents = groupAll && groupCombate ? allFilteredEvents.filter(event => 
    (combatKeywords.some(keyword => event.title.toLowerCase().includes(keyword)) || (event.image && combatImages.includes(event.image))) &&
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event) &&
    !f1Events.includes(event) && 
    !mlbEvents.includes(event)
  ) : [];

  const liga1Keywords = ['liga1max', 'l1max'];
  const liga1Image = 'https://a.espncdn.com/combiner/i?img=%2Fi%2Fleaguelogos%2Fsoccer%2F500%2F1813.png';

  const liga1Events = groupAll && groupLiga1 ? allFilteredEvents.filter(event =>
    (event.image === liga1Image || event.buttons.some(b => liga1Keywords.includes(b.toLowerCase()))) &&
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event) &&
    !f1Events.includes(event) &&
    !mlbEvents.includes(event) &&
    !deportesDeCombateEvents.includes(event)
  ) : [];

  const ligaProImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Football_of_Ecuador_-_Liga_Pro_logo_%28mini%29.svg/2048px-Football_of_Ecuador_-_Liga_Pro_logo_%28mini%29.svg.png';
  const ligaProEvents = groupAll && groupLigaPro ? allFilteredEvents.filter(event =>
    (event.title.toLowerCase().includes('primera a') || event.image === ligaProImage) &&
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event) &&
    !f1Events.includes(event) &&
    !mlbEvents.includes(event) &&
    !deportesDeCombateEvents.includes(event) &&
    !liga1Events.includes(event)
  ) : [];
  
  const mlsKeywords = ['mls'];
  const mlsImage = 'https://p.alangulotv.live/mls';
  const mlsButton = 'mls pass';

  const mlsEvents = groupAll && groupMls ? allFilteredEvents.filter(event =>
      (
          (event.image === mlsImage) ||
          (mlsKeywords.some(keyword => event.title.toLowerCase().includes(keyword))) ||
          (event.buttons.some(b => b.toLowerCase() === mlsButton))
      ) &&
      !mundialDeClubesEvents.includes(event) &&
      !nbaEvents.includes(event) &&
      !f1Events.includes(event) &&
      !mlbEvents.includes(event) &&
      !deportesDeCombateEvents.includes(event) &&
      !liga1Events.includes(event) &&
      !ligaProEvents.includes(event)
  ) : [];


  const otherEvents = allFilteredEvents.filter(event => 
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event) &&
    !f1Events.includes(event) && 
    !mlbEvents.includes(event) &&
    !deportesDeCombateEvents.includes(event) &&
    !liga1Events.includes(event) &&
    !ligaProEvents.includes(event) &&
    !mlsEvents.includes(event)
  );

  const eventGroups = [];
  
  if (mlsEvents.length > 0) {
      eventGroups.push({
          id: 'mls',
          name: 'MLS',
          events: mlsEvents,
          isLive: mlsEvents.some(e => e.status === 'En Vivo'),
          startTime: mlsEvents[0].time,
          logo: mlsImage,
          logoProps: { width: 60, height: 60, className: 'object-contain' }
      });
  }
  if (ligaProEvents.length > 0) {
      eventGroups.push({
          id: 'liga-pro',
          name: 'Liga Pro',
          events: ligaProEvents,
          isLive: ligaProEvents.some(e => e.status === 'En Vivo'),
          startTime: ligaProEvents[0].time,
          logo: ligaProImage,
          logoProps: { width: 50, height: 50, className: 'object-contain' }
      });
  }
  if (liga1Events.length > 0) {
      eventGroups.push({
          id: 'liga1',
          name: 'LIGA1',
          events: liga1Events,
          isLive: liga1Events.some(e => e.status === 'En Vivo'),
          startTime: liga1Events[0].time,
          logo: liga1Image,
          logoProps: { width: 50, height: 50, className: 'object-contain' }
      });
  }
  if (mundialDeClubesEvents.length > 0) {
      eventGroups.push({
          id: 'mundial-de-clubes',
          name: 'Mundial de Clubes',
          events: mundialDeClubesEvents,
          isLive: mundialDeClubesEvents.some(e => e.status === 'En Vivo'),
          startTime: mundialDeClubesEvents[0].time,
          logo: mundialDeClubesEvents[0].image || "https://upload.wikimedia.org/wikipedia/en/thumb/7/77/FIFA_Club_World_Cup_logo.svg/250px-FIFA_Club_World_Cup_logo.svg.png",
          logoProps: { width: 50, height: 50, className: 'object-contain' }
      });
  }
  if (nbaEvents.length > 0) {
      eventGroups.push({
          id: 'nba',
          name: 'NBA',
          events: nbaEvents,
          isLive: nbaEvents.some(e => e.status === 'En Vivo'),
          startTime: nbaEvents[0].time,
          logo: "https://p.alangulotv.live/nba",
          logoProps: { width: 30, height: 60, className: 'object-contain h-14' }
      });
  }
  if (f1Events.length > 0) {
      eventGroups.push({
          id: 'f1',
          name: 'Formula 1',
          events: f1Events,
          isLive: f1Events.some(e => e.status === 'En Vivo'),
          startTime: f1Events[0].time,
          logo: "https://p.alangulotv.live/f1",
          logoProps: { width: 80, height: 20, className: 'object-contain' }
      });
  }
  if (mlbEvents.length > 0) {
      eventGroups.push({
          id: 'mlb',
          name: 'MLB',
          events: mlbEvents,
          isLive: mlbEvents.some(e => e.status === 'En Vivo'),
          startTime: mlbEvents[0].time,
          logo: "https://p.alangulotv.live/mlb",
          logoProps: { width: 60, height: 34, className: 'object-contain' }
      });
  }
  if (deportesDeCombateEvents.length > 0) {
      eventGroups.push({
          id: 'deportes-de-combate',
          name: 'Deportes de Combate',
          events: deportesDeCombateEvents,
          isLive: deportesDeCombateEvents.some(e => e.status === 'En Vivo'),
          startTime: deportesDeCombateEvents[0].time,
          logo: "https://p.alangulotv.live/boxeo",
          logoProps: { width: 40, height: 40, className: 'object-contain' }
      });
  }
  
  const ungroupedEvents = [];
  if (otherEvents.length > 0) {
    if (groupAll && groupOtros) {
      eventGroups.push({
        id: 'otros',
        name: 'Otros',
        events: otherEvents,
        isLive: otherEvents.some(e => e.status === 'En Vivo'),
        startTime: otherEvents[0].time,
        logo: "https://cdn-icons-png.flaticon.com/512/9192/9192710.png",
        logoProps: { width: 40, height: 40, className: 'object-contain' }
      });
    } else {
      ungroupedEvents.push(...otherEvents);
    }
  }

  eventGroups.sort((a, b) => {
      if (a.isLive && !b.isLive) return -1;
      if (!a.isLive && b.isLive) return 1;
      return a.startTime.localeCompare(b.startTime);
  });
  
  if (groupAll && groupEnVivo && liveEvents.length > 0) {
    const enVivoGroup = {
        id: 'en-vivo',
        name: 'TODOS LOS EVENTOS',
        events: liveEvents.sort((a, b) => a.time.localeCompare(b.time)),
        isLive: true,
        startTime: null,
        logo: null,
        logoProps: {}
    };
    eventGroups.unshift(enVivoGroup);
  }


  if (ungroupedEvents.length > 1) {
    const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2 };
    ungroupedEvents.sort((a, b) => {
        if (a.status !== b.status) {
            return (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
        }
        return a.time.localeCompare(b.time);
    });
  }

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
      <div className="flex-grow overflow-y-auto">
        <TooltipProvider delayDuration={300}>
          {allFilteredEvents.length > 0 || eventGroups.length > 0 ? (
            <div className="space-y-4">
              {eventGroups.length > 0 && (
                <Accordion type="multiple" defaultValue={[]} className="w-full space-y-4">
                  {eventGroups.map((group, index) => (
                    <AccordionItem value={`${group.id}-events`} className={cn(
                        "border-b-0",
                        index === 0 && "mt-[16px]"
                    )} key={group.id}>
                      <Card className="bg-muted/50 overflow-hidden">
                        <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                            <div className="flex w-full items-center">
                                <div className="w-20 flex-shrink-0">
                                    {group.startTime && (
                                      <div className="flex flex-col items-center justify-center gap-1 text-center">
                                        {(() => {
                                            const allTimes = group.events.map(e => e.time);
                                            const uniqueTimes = [...new Set(allTimes)];
                                            
                                            if (uniqueTimes.length === 1) {
                                                return (
                                                    <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">
                                                        {uniqueTimes[0]}
                                                    </p>
                                                );
                                            }
                                            const startTime = group.events[0].time;
                                            const endTime = group.events[group.events.length - 1].time;

                                            return (
                                                <>
                                                    <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">
                                                        {startTime}
                                                    </p>
                                                    <span className="text-xs font-mono text-muted-foreground">-</span>
                                                    <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">
                                                        {endTime}
                                                    </p>
                                                </>
                                            );
                                        })()}
                                      </div>
                                    )}
                                </div>
                                <div className="flex-grow flex flex-col items-center justify-center gap-2">
                                    {group.logo ? (
                                      <>
                                        {group.isLive && (
                                            <Badge className="text-xs font-bold border-0 rounded-none bg-destructive text-destructive-foreground">En Vivo</Badge>
                                        )}
                                        <Image
                                            src={group.logo}
                                            alt={`${group.name} Logo`}
                                            width={group.logoProps.width}
                                            height={group.logoProps.height}
                                            className={group.logoProps.className}
                                            data-ai-hint={`${group.id} logo`}
                                            unoptimized
                                        />
                                        <p className="font-semibold text-sm text-foreground mt-1">{group.name}</p>
                                      </>
                                    ) : (
                                      <>
                                         <p className="font-semibold text-lg text-foreground">{group.name}</p>
                                          {group.isLive && (
                                            <Badge className="text-xs font-bold border-0 rounded-none bg-destructive text-destructive-foreground">EN VIVO</Badge>
                                          )}
                                      </>
                                    )}
                                </div>
                                <div className="w-20 flex-shrink-0" />
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-0">
                            <div className="space-y-4 p-4">
                                {group.events.map(renderEventCard)}
                            </div>
                        </AccordionContent>
                      </Card>
                    </AccordionItem>
                  ))}
                </Accordion>
              )}
              {ungroupedEvents.map((event, index) => {
                  const isFirstElementInList = eventGroups.length === 0 && index === 0;
                  const card = renderEventCard(event, index);
                  return (
                      <div key={card.key} className={cn(
                          isFirstElementInList && "mt-[16px]"
                      )}>
                          {card}
                      </div>
                  );
              })}
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
