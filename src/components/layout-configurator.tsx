

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
import { ScrollArea } from './ui/scroll-area';

interface EventListManagementProps {
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
}

export function EventListManagement({
  order,
  onOrderChange,
  eventDetails,
  onReload,
  onRemove,
  onModify,
  isViewPage,
  onAddEvent,
  onSchedule,
  onNotificationManager,
  onToggleFullscreen,
  fullscreenIndex,
  remoteControlMode,
}: EventListManagementProps) {
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

  return (
    <div className="space-y-4">
       {onNotificationManager && !isViewPage && (
          <Button variant="outline" className="w-full mt-2 flex-shrink-0" onClick={onNotificationManager}>
              <BellRing className="mr-2 h-4 w-4" />
              Gestionar Notificaciones
          </Button>
      )}
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

                      {remoteControlMode === 'controlling' && onToggleFullscreen && (
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
      {activeEventsCount === 0 && (
          <p className="text-muted-foreground text-center pt-8">No hay eventos seleccionados.</p>
      )}
      {isViewPage && onAddEvent && (
          <Button variant="outline" className="w-full mt-4 flex-shrink-0" onClick={onAddEvent}>
              <Plus className="mr-2 h-4 w-4" />
              Añadir Evento/Canal
          </Button>
      )}
      {isViewPage && onSchedule && (
          <Button variant="outline" className="w-full mt-2 flex-shrink-0" onClick={onSchedule}>
              <CalendarClock className="mr-2 h-4 w-4" />
              Programar Selección
          </Button>
      )}
       {isViewPage && onNotificationManager && (
          <Button variant="outline" className="w-full mt-2 flex-shrink-0" onClick={onNotificationManager}>
              <BellRing className="mr-2 h-4 w-4" />
              Gestionar Notificaciones
          </Button>
      )}
    </div>
  );
}


interface LayoutConfiguratorProps extends EventListManagementProps {
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  onOpenChat?: () => void;
  remoteSessionId?: string | null;
  onStartControlledSession?: () => void;
}

export function LayoutConfigurator({
  gridGap,
  onGridGapChange,
  borderColor,
  onBorderColorChange,
  isChatEnabled,
  onIsChatEnabledChange,
  onOpenChat,
  remoteSessionId,
  remoteControlMode,
  onStartControlledSession,
  ...eventProps
}: LayoutConfiguratorProps) {
  
  const [isStartingRemote, setIsStartingRemote] = useState(false);

  const handleStartRemote = () => {
    if (onStartControlledSession) {
      setIsStartingRemote(true);
      onStartControlledSession();
    }
  };

  const handleRestoreDefaults = () => {
    onGridGapChange(0);
    onBorderColorChange('#000000');
  }

  return (
    <Accordion type="single" collapsible className="w-full space-y-4 py-1">
      <AccordionItem value="item-1" className="border rounded-lg px-4">
        <AccordionTrigger>Diseño de Cuadrícula</AccordionTrigger>
        <AccordionContent className="pt-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="grid-gap">Bordes ({gridGap}px)</Label>
              <Slider
                id="grid-gap"
                min={0}
                max={20}
                step={1}
                value={[gridGap]}
                onValueChange={(value) => onGridGapChange(value[0])}
              />
            </div>
            <div className="space-y-3">
              <Label htmlFor="border-color">Color de Borde</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="border-color"
                  type="color"
                  value={borderColor}
                  onChange={(e) => onBorderColorChange(e.target.value)}
                  className="w-14 h-10 p-1"
                />
                <Input
                  type="text"
                  value={borderColor}
                  onChange={(e) => onBorderColorChange(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Vista Previa</Label>
              <div className="p-2 rounded-md aspect-video" style={{ backgroundColor: borderColor }}>
                <div className="grid grid-cols-3 h-full" style={{ gap: `${gridGap}px`}}>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                  <div className="bg-card rounded-sm"></div>
                </div>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleRestoreDefaults} className="w-full gap-2">
                <RefreshCcw />
                Restaurar
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
      
      {eventProps.isViewPage && remoteControlMode !== 'controlling' && (
        <AccordionItem value="remote-control" className="border rounded-lg px-4">
            <AccordionTrigger>Control Remoto</AccordionTrigger>
            <AccordionContent className="pt-4 text-center">
              {remoteControlMode === 'controlled' && remoteSessionId ? (
                <>
                  <p className="text-sm text-muted-foreground mb-2">
                      Introduce este código en el dispositivo de control:
                  </p>
                  <div className="p-3 bg-muted rounded-lg">
                      <p className="text-3xl font-bold tracking-widest text-primary">
                          {remoteSessionId}
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
      
      <AccordionItem value="item-2" className="border rounded-lg px-4">
        <AccordionTrigger>Funciones Adicionales</AccordionTrigger>
        <AccordionContent className="pt-2">
            <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-1.5 pr-4">
                        <Label>Activar Chat</Label>
                        <p className="text-xs text-muted-foreground">
                            Muestra u oculta el botón para abrir el chat en la vista de visualización.
                        </p>
                    </div>
                    <Switch
                        checked={isChatEnabled}
                        onCheckedChange={onIsChatEnabledChange}
                    />
                </div>
                {onOpenChat && (
                    <Button variant="outline" className="w-full" onClick={onOpenChat}>
                        <MessageSquare className="mr-2 h-4 w-4" />
                        Abrir Chat
                    </Button>
                )}
            </div>
        </AccordionContent>
      </AccordionItem>
      
       {remoteControlMode !== 'controlling' && (
            <AccordionItem value="item-3" className="border rounded-lg px-4">
                <AccordionTrigger>Eventos/Canales Seleccionados ({eventProps.order.length})</AccordionTrigger>
                <AccordionContent className="pt-2">
                    <EventListManagement {...eventProps} remoteControlMode={remoteControlMode} />
                </AccordionContent>
            </AccordionItem>
        )}
    </Accordion>
  );
}
