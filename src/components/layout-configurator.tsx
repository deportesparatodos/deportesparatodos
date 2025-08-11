

'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, RotateCw, Trash2, Plus, Pencil, CalendarClock, BellRing, MessageSquare, Airplay, Loader2, Maximize, Minimize, Settings, Play } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertCircle } from 'lucide-react';

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
  remoteSessionId?: string | null;
  remoteControlMode?: 'inactive' | 'controlling' | 'controlled';
  onStartControlledSession?: () => void;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  onRestoreGridSettings: () => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  categories: string[];
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
}: Pick<EventListManagementProps, 'order' | 'onOrderChange' | 'eventDetails' | 'onReload' | 'onRemove' | 'onModify' | 'isViewPage' | 'onToggleFullscreen' | 'fullscreenIndex'>) {
    
  const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
    const validOrder = Array.isArray(order) ? [...order] : [];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < validOrder.length) {
      const itemToMove = validOrder.splice(currentIndex, 1)[0];
      validOrder.splice(targetIndex, 0, itemToMove);
      onOrderChange(validOrder);
    }
  };

  const activeEventsCount = Array.isArray(order) ? order.length : 0;

  if (activeEventsCount === 0) {
      return <p className="text-muted-foreground text-center py-8">No hay eventos seleccionados.</p>
  }
  
  return (
    <div className="space-y-4">
        {order.map((originalIndex, currentIndex) => {
            const event = Array.isArray(eventDetails) && eventDetails[originalIndex] ? eventDetails[originalIndex] : null;
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
    gridGap, onGridGapChange, 
    borderColor, onBorderColorChange,
    onRestoreGridSettings,
    isChatEnabled, onIsChatEnabledChange,
  } = eventProps;

  const GridPreview = () => (
    <div className="space-y-3">
        <Label>Vista Previa</Label>
        <div 
          className="w-full aspect-video rounded-md p-1 grid grid-cols-3 grid-rows-2"
          style={{
            backgroundColor: borderColor,
            gap: `${gridGap / 4}rem`,
          }}
        >
          {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-secondary/80 rounded-sm flex items-center justify-center" />
          ))}
        </div>
    </div>
  );

  return (
    <Accordion type="single" collapsible className="w-full space-y-4 py-1">
        
        <AccordionItem value="item-1" className="border rounded-lg px-4">
            <AccordionTrigger>Diseño de Cuadrícula</AccordionTrigger>
            <AccordionContent className="pt-4 pb-4 space-y-6">
                <GridPreview />
                <div className="space-y-3">
                    <Label>Espaciado entre ventanas ({gridGap}px)</Label>
                    <Slider
                        value={[gridGap]}
                        onValueChange={(value) => onGridGapChange(value[0])}
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
                            onChange={(e) => onBorderColorChange(e.target.value)}
                            className="w-12 h-10 p-1"
                        />
                        <Input
                            type="text"
                            value={borderColor}
                            onChange={(e) => onBorderColorChange(e.target.value)}
                            placeholder="#000000"
                            className="flex-grow"
                        />
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={onRestoreGridSettings} className="w-full">
                    Restaurar
                </Button>
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
           {eventProps.remoteControlMode === 'controlled' ? (
                <div className="relative p-4 rounded-lg bg-muted/50">
                    <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm z-10 flex items-center justify-center p-4 text-center">
                        <Alert variant="destructive" className='bg-yellow-500/10 border-yellow-500/50 text-yellow-500'>
                            <AlertCircle className="h-4 w-4 !text-yellow-500" />
                            <AlertTitle className="font-bold">Control Remoto Activo</AlertTitle>
                            <AlertDescription className="text-yellow-500/80">
                                Para hacer cambios, utilice el dispositivo controlador. Si usted no conectó nada, recargue la página.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <EventList {...eventProps} />
                </div>
            ) : (
                 <>
                    <EventList {...eventProps} />
                    {eventProps.onAddEvent && (
                        <Button variant="outline" className="w-full mt-4 flex-shrink-0" onClick={eventProps.onAddEvent}>
                            <Plus className="mr-2 h-4 w-4" />
                            Añadir Evento/Canal
                        </Button>
                    )}
                 </>
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
      <Accordion type="single" collapsible defaultValue="item-3" className="w-full space-y-4 py-1">
          {eventProps.remoteControlMode !== 'controlling' && (
              <AccordionItem value="remote-control" className="border rounded-lg px-4">
                  <AccordionTrigger>Control Remoto</AccordionTrigger>
                  <AccordionContent className="pt-4 pb-4 text-center">
                      {eventProps.remoteControlMode === 'controlled' && eventProps.remoteSessionId ? (
                          <>
                              <p className="text-sm text-muted-foreground mb-2">
                                  Sesión de control activa. Usa este código en el otro dispositivo:
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
              <AccordionTrigger>Eventos/Canales Seleccionados ({Array.isArray(eventProps.order) ? eventProps.order.length : 0})</AccordionTrigger>
              <AccordionContent className="pt-2 pb-4">
                   {eventProps.remoteControlMode === 'controlled' ? (
                        <Alert variant="destructive" className='bg-yellow-500/10 border-yellow-500/50 text-yellow-500 text-center'>
                            <AlertCircle className="h-4 w-4 !text-yellow-500 mx-auto mb-2" />
                            <AlertTitle className="font-bold text-center mb-1">Control Remoto Activo</AlertTitle>
                            <AlertDescription className="text-yellow-500/80 text-center">
                                Parece que hay un control remoto conectado. Para hacer cambios, hágalos desde el control remoto. Si usted no conectó nada, recargue la página.
                            </AlertDescription>
                        </Alert>
                   ) : (
                       <>
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
                       </>
                   )}
              </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-1" className="border rounded-lg px-4">
            <AccordionTrigger>Diseño de Cuadrícula</AccordionTrigger>
            <AccordionContent className="pt-4 pb-4 space-y-6">
                <div className="space-y-3">
                    <Label>Espaciado entre ventanas ({eventProps.gridGap}px)</Label>
                    <Slider
                        value={[eventProps.gridGap]}
                        onValueChange={(value) => eventProps.onGridGapChange(value[0])}
                        max={32}
                        step={1}
                        disabled={eventProps.remoteControlMode === 'controlled'}
                    />
                </div>
                <div className="space-y-3">
                    <Label>Color de Borde</Label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="color"
                            value={eventProps.borderColor}
                            onChange={(e) => eventProps.onBorderColorChange(e.target.value)}
                            className="w-12 h-10 p-1"
                            disabled={eventProps.remoteControlMode === 'controlled'}
                        />
                        <Input
                            type="text"
                            value={eventProps.borderColor}
                            onChange={(e) => eventProps.onBorderColorChange(e.target.value)}
                            placeholder="#000000"
                            className="flex-grow"
                            disabled={eventProps.remoteControlMode === 'controlled'}
                        />
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={eventProps.onRestoreGridSettings} className="w-full" disabled={eventProps.remoteControlMode === 'controlled'}>
                    Restaurar
                </Button>
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
                        checked={eventProps.isChatEnabled}
                        onCheckedChange={eventProps.onIsChatEnabledChange}
                        disabled={eventProps.remoteControlMode === 'controlled'}
                    />
                </div>
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
