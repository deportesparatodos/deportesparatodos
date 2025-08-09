

'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, RotateCw, Trash2, Plus, RefreshCcw, Pencil, CalendarClock, BellRing, MessageSquare, Airplay, Loader2, Play, Maximize, Minimize } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

export interface EventListManagementProps {
  order: number[];
  onOrderChange: (newOrder: number[]) => void;
  eventDetails: (Event | null)[];
  onReload?: (index: number) => void;
  onRemove: (index: number) => void;
  onModify: (event: Event, index: number) => void;
  isViewPage: boolean;
  onAddEvent?: () => void;
  onSchedule?: () => void;
  onNotificationManager?: () => void;
  onToggleFullscreen?: (index: number) => void;
  fullscreenIndex?: number | null;
  remoteControlMode?: 'inactive' | 'controlling' | 'controlled';
  onPlayClick?: (index: number) => void;
  gridGap?: number;
  onGridGapChange?: (value: number) => void;
  borderColor?: string;
  onBorderColorChange?: (value: string) => void;
  isChatEnabled?: boolean;
  onIsChatEnabledChange?: (value: boolean) => void;
  onOpenChat?: () => void;
  onStartControlledSession?: () => void;
}

export function EventList({
  order,
  onOrderChange,
  eventDetails,
  onReload,
  onRemove,
  onModify,
  isViewPage,
  onToggleFullscreen,
  fullscreenIndex,
}: Omit<EventListManagementProps, 'onAddEvent' | 'onSchedule' | 'onNotificationManager' | 'remoteControlMode' | 'onPlayClick' | 'gridGap' | 'onGridGapChange' | 'borderColor' | 'onBorderColorChange' | 'isChatEnabled' | 'onIsChatEnabledChange' >) {
    
  const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...order];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const itemToMove = newOrder.splice(currentIndex, 1)[0];
      newOrder.splice(targetIndex, 0, itemToMove);
      onOrderChange(newOrder);
    }
  };

  const activeEventsCount = order.length;

  if (activeEventsCount === 0) {
      return <p className="text-muted-foreground text-center py-8">No hay eventos seleccionados.</p>
  }
  
  return (
    <div className="space-y-4">
        {order.map((originalIndex, currentIndex) => {
            const event = eventDetails[originalIndex];
            if (!event) return null;

            const isFullscreen = fullscreenIndex === originalIndex;

            return (
                <div key={originalIndex} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
                    <div 
                        className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold"
                    >
                        {currentIndex + 1}
                    </div>
                    
                    <div className="flex-grow flex flex-col gap-2 text-center">
                        <p className="text-sm font-semibold break-words">
                            {event.title}
                        </p>
                         <div className="flex items-center justify-center gap-1">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={(e) => { e.stopPropagation(); handleMove(currentIndex, 'up'); }}
                                disabled={currentIndex === 0}
                            >
                                <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7" 
                                onClick={(e) => { e.stopPropagation(); handleMove(currentIndex, 'down'); }}
                                disabled={currentIndex === activeEventsCount - 1}
                            >
                                <ArrowDown className="h-4 w-4" />
                            </Button>

                            {isViewPage && onToggleFullscreen && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); onToggleFullscreen(originalIndex); }}
                                >
                                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                                </Button>
                             )}
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7"
                                onClick={(e) => { e.stopPropagation(); onModify(event, originalIndex); }}
                            >
                                <Pencil className="h-4 w-4" />
                            </Button>

                            {isViewPage && onReload && (
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-7 w-7"
                                    onClick={(e) => { e.stopPropagation(); onReload(originalIndex); }}
                                >
                                    <RotateCw className="h-4 w-4" />
                                </Button>
                            )}
                            
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-destructive hover:text-destructive"
                                onClick={(e) => { e.stopPropagation(); onRemove(originalIndex); }}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            )
        })}
    </div>
  );
}


function HomePageMenu({ eventProps }: { eventProps: EventListManagementProps }) {
  const { 
    gridGap = 0, onGridGapChange, 
    borderColor = '#000000', onBorderColorChange,
    isChatEnabled = true, onIsChatEnabledChange,
  } = eventProps;

  return (
    <Accordion type="multiple" defaultValue={["item-1", "item-2", "item-3"]} className="w-full space-y-4 py-1">
        
        <AccordionItem value="item-1" className="border rounded-lg px-4">
            <AccordionTrigger>Diseño de Cuadrícula</AccordionTrigger>
            <AccordionContent className="pt-4 pb-4 space-y-6">
                <div className="space-y-3">
                    <Label>Espaciado entre ventanas ({gridGap}px)</Label>
                    <Slider
                        value={[gridGap]}
                        onValueChange={(value) => onGridGapChange?.(value[0])}
                        max={32}
                        step={1}
                    />
                </div>
                <div className="space-y-3">
                    <Label>Color de Borde</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="color"
                            value={borderColor}
                            onChange={(e) => onBorderColorChange?.(e.target.value)}
                            className="w-12 h-10 p-1"
                        />
                        <Input
                            type="text"
                            value={borderColor}
                            onChange={(e) => onBorderColorChange?.(e.target.value)}
                            placeholder="#000000"
                            className="flex-grow"
                        />
                    </div>
                </div>
            </AccordionContent>
        </AccordionItem>

        <AccordionItem value="item-2" className="border rounded-lg px-4">
            <AccordionTrigger>Funciones Adicionales</AccordionTrigger>
            <AccordionContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                    <Label htmlFor="chat-switch" className="flex flex-col gap-1">
                        <span>Activar Chat en Vivo</span>
                        <span className="text-xs text-muted-foreground">Muestra el botón de chat en la vista de transmisión.</span>
                    </Label>
                    <Switch
                        id="chat-switch"
                        checked={isChatEnabled}
                        onCheckedChange={onIsChatEnabledChange}
                    />
                </div>
            </AccordionContent>
        </AccordionItem>

      <AccordionItem value="item-3" className="border rounded-lg px-4">
        <AccordionTrigger>Eventos/Canales Seleccionados ({eventProps.order.length})</AccordionTrigger>
        <AccordionContent className="pt-2 pb-4">
          <EventList {...eventProps} />
           {eventProps.onAddEvent && (
            <Button variant="outline" className="w-full mt-4 flex-shrink-0" onClick={eventProps.onAddEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Evento/Canal
            </Button>
           )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

function ViewPageMenu({
  eventProps,
}: {eventProps: EventListManagementProps}) {
  const [isStartingRemote, setIsStartingRemote] = useState(false);

  const handleStartRemote = () => {
    if (eventProps.onStartControlledSession) {
      setIsStartingRemote(true);
      eventProps.onStartControlledSession();
    }
  };

  return (
      <Accordion type="multiple" defaultValue={["item-3"]} className="w-full space-y-4 py-1">
          {eventProps.remoteControlMode !== 'controlling' && (
              <AccordionItem value="remote-control" className="border rounded-lg px-4">
                  <AccordionTrigger>Control Remoto</AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4 text-center">
                      {eventProps.remoteControlMode === 'controlled' && eventProps.remoteSessionId ? (
                          <>
                              <p className="text-sm text-muted-foreground mb-2">
                                  Introduce este código en el dispositivo de control:
                              </p>
                              <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-3xl font-bold tracking-widest text-primary">
                                      {eventProps.remoteSessionId}
                                  </p>
                              </div>
                          </>
                      ) : (
                          <>
                              <p className="text-sm text-muted-foreground mb-3">
                                  Activa el modo controlado para manejar esta pantalla desde otro dispositivo.
                              </p>
                              <Button className='w-full' onClick={handleStartRemote} disabled={isStartingRemote}>
                                  {isStartingRemote && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Activar Control Remoto
                              </Button>
                          </>
                      )}
                  </AccordionContent>
              </AccordionItem>
          )}

          <AccordionItem value="item-3" className="border rounded-lg px-4">
              <AccordionTrigger>Eventos/Canales Seleccionados ({eventProps.order.length})</AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                   <EventList {...eventProps} />
                   {eventProps.onAddEvent && (
                      <Button variant="outline" className="w-full mt-4 flex-shrink-0" onClick={eventProps.onAddEvent}>
                          <Plus className="mr-2 h-4 w-4" />
                          Añadir Evento/Canal
                      </Button>
                  )}
                  {eventProps.onSchedule && (
                      <Button variant="outline" className="w-full mt-2 flex-shrink-0" onClick={eventProps.onSchedule}>
                          <CalendarClock className="mr-2 h-4 w-4" />
                          Programar Selección
                      </Button>
                  )}
              </AccordionContent>
          </AccordionItem>
      </Accordion>
  );
}


export function LayoutConfigurator(props: EventListManagementProps) {
  
  if (props.isViewPage) {
    return <ViewPageMenu eventProps={props} />;
  }

  return <HomePageMenu eventProps={props} />;
}
