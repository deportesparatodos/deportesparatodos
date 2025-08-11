

'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, RotateCw, Trash2, Plus, Pencil, Airplay, Maximize, Minimize, Settings, AlertCircle, CalendarDays, BookOpen, Mail } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from './ui/alert';

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
  remoteControlMode: 'inactive' | 'controlling' | 'controlled';
  onActivateControlledMode: () => void;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  onRestoreGridSettings: () => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  categories: string[];
  onOpenTutorial: () => void;
  onOpenErrors: () => void;
  onOpenCalendar: () => void;
  isSheet?: boolean;
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
    
  const validOrder = Array.isArray(order) ? order : [];
  
  const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...validOrder];
    const itemToMove = newOrder.splice(currentIndex, 1)[0];
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    newOrder.splice(newIndex, 0, itemToMove);
    onOrderChange(newOrder);
  };
  
  const activeEventsCount = validOrder.length;

  if (activeEventsCount === 0) {
      return <p className="text-muted-foreground text-center py-8">No hay eventos seleccionados.</p>
  }
  
  return (
    <div className="space-y-4">
        {validOrder.map((originalIndex, currentIndex) => {
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


export function LayoutConfigurator(props: EventListManagementProps) {
  
  const { 
    gridGap, onGridGapChange, 
    borderColor, onBorderColorChange,
    onRestoreGridSettings,
    isChatEnabled, onIsChatEnabledChange,
    remoteControlMode, remoteSessionId, onActivateControlledMode,
    onOpenTutorial, onOpenErrors, onNotificationManager, onOpenCalendar,
    isSheet
  } = props;
  
  if (isSheet) {
    return (
        <div className="space-y-2 mt-4">
          <Button variant="outline" className="w-full justify-start" onClick={onOpenTutorial}>
            <BookOpen className="mr-2 h-4 w-4" /> Tutorial de Uso
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onOpenErrors}>
            <AlertCircle className="mr-2 h-4 w-4" /> Solución de Errores
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onNotificationManager}>
            <Mail className="mr-2 h-4 w-4" /> Notificaciones por Correo
          </Button>
          <Button variant="outline" className="w-full justify-start" onClick={onOpenCalendar}>
            <CalendarDays className="mr-2 h-4 w-4" /> Suscripción a Calendario
          </Button>
        </div>
    );
  }

  return (
    <>
        <Accordion type="single" collapsible className="w-full space-y-4">
            <AccordionItem value="item-events" className="border rounded-lg px-4">
                <AccordionTrigger>Eventos/Canales Seleccionados ({(props.order || []).length})</AccordionTrigger>
                <AccordionContent className="pt-2 pb-4">
                    {props.remoteControlMode === 'controlled' ? (
                        <Alert variant="destructive" className='bg-yellow-500/10 border-yellow-500/50 text-yellow-500 text-center'>
                            <AlertCircle className="h-4 w-4 !text-yellow-500 mx-auto mb-2" />
                            <AlertTitle className="font-bold text-center mb-1">Control Remoto Activo</AlertTitle>
                            <AlertDescription className="text-yellow-500/80 text-center">
                                Para hacer cambios, use el dispositivo controlador. Si no conectó nada, recargue la página.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <>
                            <EventList {...props} />
                            {props.onAddEvent && (
                                <Button variant="outline" className="w-full mt-4 flex-shrink-0" onClick={props.onAddEvent}>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Añadir Evento/Canal
                                </Button>
                            )}
                        </>
                    )}
                </AccordionContent>
            </AccordionItem>
            
            <AccordionItem value="remote-control" className="border rounded-lg px-4">
                <AccordionTrigger>Control Remoto</AccordionTrigger>
                <AccordionContent className="pt-4 pb-4 text-center">
                    {remoteControlMode === 'controlled' ? (
                        <>
                            <p className="text-sm text-muted-foreground mb-2">
                            Sesión de control remoto activa. Código:
                            </p>
                            <div className="p-3 bg-muted rounded-lg">
                            <p className="text-3xl font-bold tracking-widest text-primary">
                                {remoteSessionId || '----'}
                            </p>
                            </div>
                        </>
                        ) : (
                        <Button onClick={onActivateControlledMode} className="w-full">
                            <Airplay className="mr-2 h-4 w-4" /> Activar Control Remoto
                        </Button>
                    )}
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-grid" className="border rounded-lg px-4">
                <AccordionTrigger>Diseño de Cuadrícula</AccordionTrigger>
                <AccordionContent className="pt-4 pb-4 space-y-6">
                    <div className="space-y-3">
                        <Label>Espaciado entre ventanas ({gridGap}px)</Label>
                        <Slider
                            value={[gridGap]}
                            onValueChange={(value) => onGridGapChange(value[0])}
                            max={32}
                            step={1}
                            disabled={remoteControlMode === 'controlled'}
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
                                disabled={remoteControlMode === 'controlled'}
                            />
                            <Input
                                type="text"
                                value={borderColor}
                                onChange={(e) => onBorderColorChange(e.target.value)}
                                placeholder="#000000"
                                className="flex-grow"
                                disabled={remoteControlMode === 'controlled'}
                            />
                        </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={onRestoreGridSettings} className="w-full" disabled={remoteControlMode === 'controlled'}>
                        Restaurar
                    </Button>
                </AccordionContent>
            </AccordionItem>

            <AccordionItem value="item-features" className="border rounded-lg px-4">
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
                            disabled={remoteControlMode === 'controlled'}
                        />
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    </>
  );
}
