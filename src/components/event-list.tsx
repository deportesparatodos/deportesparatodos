
"use client";

import type { FC } from 'react';
import { useState, useMemo } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, Loader2, AlertTriangle, Tv, Search, X, RotateCw, History } from 'lucide-react';
import { cn, getUrlOrigin } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";


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
  status: 'Próximo' | 'En Vivo' | 'Finalizado' | 'Desconocido';
}

interface EventGrouping {
    all: boolean;
    enVivo: boolean;
    f1: boolean;
    mlb: boolean;
    nba: boolean;
    mundialDeClubes: boolean;
    deportesDeCombate: boolean;
    deportesDeMotor: boolean;
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
  selectedUrl?: string | null;
}

export const EventListComponent: FC<EventListComponentProps> = ({ onSelectEvent, events, isLoading, error, eventGrouping, searchTerm, selectedUrl }) => {
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

  const activeEvents = events.filter(e => e.status !== 'Finalizado');
  const finishedEvents = events.filter(e => e.status === 'Finalizado').sort((a, b) => {
      if (a.date !== b.date) return b.date.localeCompare(a.date);
      return b.time.localeCompare(b.time);
  });
  
  const { all: groupAll, enVivo: groupEnVivo, f1: groupF1, mlb: groupMlb, mundialDeClubes: groupMundial, nba: groupNba, deportesDeCombate: groupCombate, deportesDeMotor: groupMotor, liga1: groupLiga1, ligaPro: groupLigaPro, mls: groupMls, otros: groupOtros } = eventGrouping;

  const selectedEventInfo = useMemo(() => {
    if (!selectedUrl) return null;
    const event = events.find(e => e.options.includes(selectedUrl));
    if (event) {
        return { event, url: selectedUrl };
    }
    return null;
  }, [selectedUrl, events]);


  const allFilteredEvents = useMemo(() => {
    const filtered = activeEvents.filter(event =>
      event.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    // Exclude the selected event from the main list if it exists
    if (selectedEventInfo) {
      return filtered.filter(e => e !== selectedEventInfo.event);
    }
    return filtered;
  }, [activeEvents, searchTerm, selectedEventInfo]);
  
  const liveEvents = allFilteredEvents.filter(event => event.status === 'En Vivo');

  const motorImage = 'https://images.vexels.com/media/users/3/139434/isolated/preview/4bcbe9b4d3e6f6e4c1207c142a98c2d8-carrera-de-coches-de-carreras-de-ferrari.png';
  const deportesDeMotorEvents = groupAll && groupMotor ? allFilteredEvents.filter(event =>
      event.image === motorImage
  ) : [];

  const mundialDeClubesEvents = groupAll && groupMundial ? allFilteredEvents.filter(event =>
    event.image === 'https://p.alangulotv.live/copamundialdeclubes' &&
    !deportesDeMotorEvents.includes(event)
  ) : [];

  const nbaEvents = groupAll && groupNba ? allFilteredEvents.filter(event =>
    (event.title.toLowerCase().includes('nba') || event.image === 'https://p.alangulotv.live/nba') &&
    !deportesDeMotorEvents.includes(event) &&
    !mundialDeClubesEvents.includes(event)
  ) : [];
  
  const f1Events = groupAll && groupF1 ? allFilteredEvents.filter(event => 
    (event.title.toLowerCase().includes('f1') || event.title.toLowerCase().includes('formula 1')) &&
    !deportesDeMotorEvents.includes(event) &&
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event)
  ) : [];

  const mlbImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Major_League_Baseball_logo.svg/1200px-Major_League_Baseball_logo.svg.png';
  const mlbEvents = groupAll && groupMlb ? allFilteredEvents.filter(event => 
    (event.title.toLowerCase().includes('mlb') || event.image === 'https://p.alangulotv.live/mlb') && 
    !deportesDeMotorEvents.includes(event) &&
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
    !deportesDeMotorEvents.includes(event) &&
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event) &&
    !f1Events.includes(event) && 
    !mlbEvents.includes(event)
  ) : [];

  const liga1Keywords = ['liga1max', 'l1max'];
  const liga1Image = 'https://a.espncdn.com/combiner/i?img=%2Fi%2Fleaguelogos%2Fsoccer%2F500%2F1813.png';

  const liga1Events = groupAll && groupLiga1 ? allFilteredEvents.filter(event =>
    (event.image === liga1Image || event.buttons.some(b => b && liga1Keywords.includes(b.toLowerCase()))) &&
    !deportesDeMotorEvents.includes(event) &&
    !mundialDeClubesEvents.includes(event) &&
    !nbaEvents.includes(event) &&
    !f1Events.includes(event) &&
    !mlbEvents.includes(event) &&
    !deportesDeCombateEvents.includes(event)
  ) : [];

  const ligaProImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Football_of_Ecuador_-_Liga_Pro_logo_%28mini%29.svg/1200px-Football_of_Ecuador_-_Liga_Pro_logo_%28mini%29.svg.png';
  const ligaProEvents = groupAll && groupLigaPro ? allFilteredEvents.filter(event =>
    (event.title.toLowerCase().includes('primera a') || event.image === ligaProImage) &&
    !deportesDeMotorEvents.includes(event) &&
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
          (event.buttons.some(b => b && b.toLowerCase() === mlsButton))
      ) &&
      !deportesDeMotorEvents.includes(event) &&
      !mundialDeClubesEvents.includes(event) &&
      !nbaEvents.includes(event) &&
      !f1Events.includes(event) &&
      !mlbEvents.includes(event) &&
      !deportesDeCombateEvents.includes(event) &&
      !liga1Events.includes(event) &&
      !ligaProEvents.includes(event)
  ) : [];


  const otherEvents = allFilteredEvents.filter(event => 
    !deportesDeMotorEvents.includes(event) &&
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
  
  if (deportesDeMotorEvents.length > 0) {
      eventGroups.push({
          id: 'deportes-de-motor',
          name: 'Deportes de Motor',
          events: deportesDeMotorEvents,
          isLive: deportesDeMotorEvents.some(e => e.status === 'En Vivo'),
          startTime: deportesDeMotorEvents[0].time,
          logo: motorImage,
          logoProps: { width: 60, height: 60, className: 'object-contain' }
      });
  }
  if (mlsEvents.length > 0) {
      eventGroups.push({
          id: 'mls',
          name: 'MLS',
          events: mlsEvents,
          isLive: mlsEvents.some(e => e.status === 'En Vivo'),
          startTime: mlsEvents[0].time,
          logo: mlsEvents[0].image || mlsImage,
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
          logo: ligaProEvents[0].image || ligaProImage,
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
          logo: liga1Events[0].image || liga1Image,
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
          logo: nbaEvents[0].image || "https://p.alangulotv.live/nba",
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
          logo: f1Events[0].image || "https://p.alangulotv.live/f1",
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
          logo: mlbImage,
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
          logo: deportesDeCombateEvents[0].image || "https://p.alangulotv.live/boxeo",
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
    const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2, 'Desconocido': 3 };
    ungroupedEvents.sort((a, b) => {
        if (a.status !== b.status) {
            return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
        }
        return a.time.localeCompare(b.time);
    });
  }

  const renderEventCard = (event: Event, eventIndex: number, isSelectedEventCard: boolean = false) => {
    const imageSrc = event.image;
    const isMotorsport = event.image === motorImage;

    return (
      <Card key={`${event.title}-${eventIndex}`} className={cn("overflow-hidden", isSelectedEventCard ? "bg-muted" : "bg-muted/50")}>
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
                    event.status === 'Finalizado' && 'bg-black text-white',
                    event.status === 'Desconocido' && 'bg-yellow-500 text-yellow-950'
                  )}>{event.status}</Badge>
                )}
                 {isMotorsport && (
                  <Dialog>
                    <DialogTrigger asChild>
                       <Badge variant="outline" className="text-xs font-bold border-yellow-500/50 bg-yellow-500/10 text-yellow-700 cursor-pointer hover:bg-yellow-500/20 rounded-none">
                          <AlertTriangle className="h-3 w-3 mr-1"/>
                          Aviso
                       </Badge>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Aviso sobre Eventos de Motor</DialogTitle>
                      </DialogHeader>
                       <div className="text-sm text-muted-foreground space-y-4">
                        <p>
                          Este evento puede no estar en vivo, a veces, ni siquiera es de hoy, pero aparece en el listado.
                          En caso de querer ver este tipo de eventos, revisar la página de la categoría y sus calendarios 
                          para ver qué evento hay realmente hoy (P1, P2, P3, QUALY, CARRERA, ETC), y el horario al que se 
                          transmite, cuando llegue ese horario y sea la fecha, podrá ver el evento sin problemas. 
                          Disculpe los inconvenientes.
                        </p>
                        <p>
                            Un calendario recomendado es <a href="https://www.motorsport.com/all/schedule/2025/live/" target="_blank" rel="noopener noreferrer" className="text-primary underline">este</a>, el cual además puedes agregar a tu calendario (Google, Outlook, Apple, etc).
                        </p>
                       </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
              <div className="flex-shrink-0">
                <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md">
                    {event.status === 'En Vivo' ? 'AHORA' : event.time}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Canales</h4>
              <div className="flex flex-wrap gap-2">
                {event.options.map((url, channelIndex) => {
                  const isCopied = copiedStates[url];
                  const buttonLabel = event.buttons[channelIndex] || 'Canal';
                  const Icon = isSelectMode ? Tv : (isCopied ? CheckCircle2 : Copy);
                  const origin = getUrlOrigin(url);
                  const isButtonSelected = url === selectedUrl;

                  return (
                    <Tooltip key={`${event.title}-${eventIndex}-${channelIndex}`}>
                      <TooltipTrigger asChild>
                        <Button
                          variant={"outline"}
                          size="sm"
                          className={cn(
                            "transition-all duration-200 h-auto whitespace-normal justify-start text-left py-1.5",
                             isButtonSelected 
                               ? 'bg-background text-foreground hover:bg-background/90' 
                               : 'bg-background/50',
                            !isSelectMode && isCopied && "border-green-500 bg-green-500/10 text-green-600 hover:text-green-600"
                          )}
                          onClick={() => handleAction(url)}
                        >
                          <Icon className="mr-2 h-4 w-4 flex-shrink-0" />
                          <span>{isSelectMode ? buttonLabel : (isCopied ? '¡Copiado!' : 'Copiar')}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {origin ? <p>{origin}</p> : <p>{isSelectMode ? `Seleccionar ${buttonLabel}` : `Copiar ${buttonLabel}`}</p>}
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


  if (isLoading && !events.length) {
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
  
  const hasActiveResults = eventGroups.length > 0 || ungroupedEvents.length > 0;
  const hasFinishedResults = finishedEvents.length > 0 && !searchTerm;
  const noResults = !selectedEventInfo && !hasActiveResults && !hasFinishedResults;

  return (
    <div className="h-full w-full bg-card text-card-foreground flex flex-col">
      <div className="flex-grow overflow-y-auto">
        <TooltipProvider delayDuration={300}>
            <div className="space-y-4">
              {/* Pinned Selected Event */}
              {selectedEventInfo && (
                  <div>
                      <h3 className="text-sm font-semibold text-muted-foreground text-center mb-2">Seleccionado</h3>
                      {renderEventCard(selectedEventInfo.event, -1, true)}
                  </div>
              )}

              {/* Active Events */}
              {hasActiveResults && (
                <>
                  {eventGroups.length > 0 && (
                    <Accordion type="multiple" defaultValue={[]} className="w-full space-y-4">
                      {eventGroups.map((group) => (
                        <AccordionItem value={`${group.id}-events`} className="border-b-0" key={group.id}>
                          <Card className="bg-muted/50 overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                                <div className="flex w-full items-center">
                                    <div className="w-20 flex-shrink-0">
                                        {group.startTime && (
                                          <div className="flex flex-col items-center justify-center gap-1 text-center">
                                            {(() => {
                                                const allTimes = group.events.map(e => e.time);
                                                const uniqueTimes = [...new Set(allTimes)];
                                                const isLive = group.events.some(e => e.status === 'En Vivo');
                                                
                                                if (isLive) {
                                                   return <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md w-full">AHORA</p>
                                                }

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
                                            <div className="flex items-center gap-2">
                                              {group.isLive && (
                                                  <Badge className="text-xs font-bold border-0 rounded-none bg-destructive text-destructive-foreground">En Vivo</Badge>
                                              )}
                                              {group.id === 'deportes-de-motor' && (
                                                <Dialog>
                                                  <DialogTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Badge variant="outline" className="text-xs font-bold border-yellow-500/50 bg-yellow-500/10 text-yellow-700 cursor-pointer hover:bg-yellow-500/20 rounded-none">
                                                        <AlertTriangle className="h-3 w-3 mr-1"/>
                                                        Aviso
                                                    </Badge>
                                                  </DialogTrigger>
                                                  <DialogContent>
                                                    <DialogHeader>
                                                      <DialogTitle>Aviso sobre Eventos de Motor</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="text-sm text-muted-foreground space-y-4">
                                                      <p>
                                                        Este evento puede no estar en vivo, a veces, ni siquiera es de hoy, pero aparece en el listado.
                                                        En caso de querer ver este tipo de eventos, revisar la página de la categoría y sus calendarios 
                                                        para ver qué evento hay realmente hoy (P1, P2, P3, QUALY, CARRERA, ETC), y el horario al que se 
                                                        transmite, cuando llegue ese horario y sea la fecha, podrá ver el evento sin problemas. 
                                                        Disculpe los inconvenientes.
                                                      </p>
                                                      <p>
                                                          Un calendario recomendado es <a href="https://www.motorsport.com/all/schedule/2025/live/" target="_blank" rel="noopener noreferrer" className="text-primary underline">este</a>, el cual además puedes agregar a tu calendario (Google, Outlook, Apple, etc).
                                                      </p>
                                                    </div>
                                                  </DialogContent>
                                                </Dialog>
                                              )}
                                            </div>
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
                                    {group.events.map((event, index) => renderEventCard(event, index))}
                                </div>
                            </AccordionContent>
                          </Card>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                  {ungroupedEvents.map((event, index) => renderEventCard(event, index))}
                </>
              )}
              
              {/* Finished Events */}
              {hasFinishedResults && (
                 <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="finished-events" className="border-b-0">
                        <Card className="bg-muted/50 overflow-hidden">
                            <AccordionTrigger className="p-4 hover:no-underline data-[state=open]:border-b">
                                <div className="flex w-full items-center justify-between">
                                    <div className="flex items-center gap-2 font-semibold text-foreground">
                                        <History className="h-5 w-5" />
                                        <span>Eventos Finalizados</span>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0">
                                <div className="space-y-4 p-4">
                                    {finishedEvents.map((event, index) => renderEventCard(event, index))}
                                </div>
                            </AccordionContent>
                        </Card>
                    </AccordionItem>
                 </Accordion>
              )}

              {noResults && (
                 <div className="flex items-center justify-center h-full pt-10">
                    <p className="text-muted-foreground text-center">
                        {searchTerm ? `No se encontraron eventos para "${searchTerm}".` : "No hay eventos disponibles."}
                    </p>
                </div>
              )}
            </div>
        </TooltipProvider>
      </div>
    </div>
  );
};
