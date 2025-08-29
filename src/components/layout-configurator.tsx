

'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, RotateCw, Trash2, Plus, Pencil, Airplay, Maximize, Minimize, Settings, AlertCircle, CalendarDays, BookOpen, Mail, FileText, X } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

export interface EventListManagementProps {
  order: number[];
  onOrderChange: (newOrder: number[]) => void;
  eventDetails: (Event | null)[];
  onReload?: (index: number) => void;
  onRemove: (index: number) => void;
  onModify: (event: Event, index: number) => void;
  isViewPage: boolean;
  onAddEvent: () => void;
  onSchedule: () => void;
  onNotificationManager: () => void;
  onRemoteControl?: () => Promise<string | undefined>;
  onToggleFullscreen?: (index: number) => void;
  fullscreenIndex?: number | null;
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
  isTutorialOpen: boolean;
  onIsTutorialOpenChange: (open: boolean) => void;
  isErrorsOpen: boolean;
  onIsErrorsOpenChange: (open: boolean) => void;
  onStopSession?: () => void;
  isRemoteControlView?: boolean;
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
                    
                    <div className="flex-grow flex flex-col gap-2 min-w-0">
                        <p className="text-sm font-semibold truncate text-center min-w-0">
                            {event.title}
                        </p>
                         <div className="flex items-center justify-center gap-1 flex-wrap">
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
        onOpenTutorial, onOpenErrors, onNotificationManager, onOpenCalendar,
        onAddEvent, onSchedule, onRemoteControl,
        onStopSession,
        isRemoteControlView = false,
    } = props;
        
    const order = props.order || [];

    return (
      <div className="flex flex-col h-full bg-background text-foreground">
        <div className="p-4 flex-shrink-0 flex items-center justify-between">
           <h2 className="text-lg font-semibold">Configuración</h2>
           {onStopSession && (
              <Button variant="destructive" size="sm" onClick={onStopSession}>
                  <X className="mr-2 h-4 w-4" /> Desconectar
              </Button>
           )}
        </div>
        
        <Separator />

        <ScrollArea className="flex-grow h-0">
          <div className='p-4 space-y-4'>
              <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-events">
                  <AccordionItem value="item-events" className="border rounded-lg px-4">
                      <AccordionTrigger>Eventos/Canales Seleccionados ({order.length})</AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4">
                          <>
                              <EventList {...props} />
                              <div className="space-y-2 pt-2">
                                  <Button variant="outline" className="w-full flex-shrink-0" onClick={onAddEvent}>
                                      <Plus className="mr-2 h-4 w-4" />
                                      Añadir Evento/Canal
                                  </Button>
                                  <Button variant="outline" className="w-full justify-center" onClick={onSchedule}>
                                      <CalendarDays className="mr-2 h-4 w-4" /> Programar Selección
                                  </Button>
                              </div>
                          </>
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

                  <AccordionItem value="item-features" className="border rounded-lg px-4">
                      <AccordionTrigger>Funciones Adicionales</AccordionTrigger>
                      <AccordionContent className="pt-4 pb-4 space-y-2">
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
                           {!isRemoteControlView && onNotificationManager && (
                                <>
                                  <Separator className="my-2"/>
                                  <Button variant="outline" className="w-full justify-start" onClick={onNotificationManager}>
                                      <Mail className="mr-2 h-4 w-4" /> Notificaciones por Correo
                                  </Button>
                                  <Button variant="outline" className="w-full justify-start" onClick={onOpenCalendar}>
                                    <CalendarDays className="mr-2 h-4 w-4" /> Suscripción a Calendario
                                  </Button>
                                </>
                           )}
                      </AccordionContent>
                  </AccordionItem>
                  
                  {!isRemoteControlView && (
                    <>
                        {onRemoteControl && (
                          <AccordionItem value="item-remote" className="border rounded-lg px-4">
                              <AccordionTrigger>Control Remoto</AccordionTrigger>
                              <AccordionContent className="pt-4 pb-4 space-y-4">
                                  <Alert>
                                      <Airplay className="h-4 w-4" />
                                      <AlertTitle>Activa el Control Remoto</AlertTitle>
                                      <AlertDescription>
                                          Puedes controlar esta vista desde otro dispositivo (como tu teléfono) o dejar que otro dispositivo tome el control.
                                      </AlertDescription>
                                  </Alert>
                                  <Button className="w-full" onClick={onRemoteControl}>
                                      <Settings className="mr-2 h-4 w-4" /> Activar Control Remoto
                                  </Button>
                              </AccordionContent>
                          </AccordionItem>
                        )}
                        
                        <AccordionItem value="item-help" className="border rounded-lg px-4">
                            <AccordionTrigger>Ayuda y Soporte</AccordionTrigger>
                            <AccordionContent className="pt-4 pb-4 space-y-2">
                                <Button variant="outline" className="w-full justify-start" onClick={onOpenTutorial}>
                                    <BookOpen className="mr-2 h-4 w-4" /> Tutorial de Uso
                                </Button>
                                <Button variant="outline" className="w-full justify-start" onClick={onOpenErrors}>
                                    <AlertCircle className="mr-2 h-4 w-4" /> Solución de Errores
                                </Button>
                                <a href="https://forms.gle/491b1iE9p63s11K39" target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button variant="outline" className="w-full justify-start">
                                        <FileText className="mr-2 h-4 w-4" /> Contacto
                                    </Button>
                                </a>
                                <a href="https://www.terminos-y-condiciones.com/live/2357d1eb-6062-4235-a743-346779893d56" target="_blank" rel="noopener noreferrer" className="w-full">
                                    <Button variant="outline" className="w-full justify-start">
                                        <FileText className="mr-2 h-4 w-4" /> Aviso Legal
                                    </Button>
                                </a>
                            </AccordionContent>
                        </AccordionItem>
                    </>
                  )}
              </Accordion>
          </div>
        </ScrollArea>
      </div>
    );
}
