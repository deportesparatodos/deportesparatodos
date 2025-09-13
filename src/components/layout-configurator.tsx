

'use client';

import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, RotateCw, Trash2, Plus, Pencil, Airplay, Maximize, Minimize, Settings, AlertCircle, CalendarDays, BookOpen, Mail, FileText, X, MessageSquare, LayoutGrid } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

export interface EventListManagementProps {
  order: number[];
  onOrderChange: (newOrder: number[]) => void;
  eventDetails: (Event | null)[];
  onReload?: (index: number) => void;
  onRemove: (index: number) => void;
  onModify: (index: number) => void;
  isViewPage: boolean;
  onAddEvent?: () => void;
  onSchedule?: () => void;
  onNotificationManager?: () => void;
  onToggleFullscreen?: (index: number) => void;
  fullscreenIndex?: number | null;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  onRestoreGridSettings: () => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  onOpenTutorial?: () => void;
  onOpenErrors?: () => void;
  onOpenCalendar?: () => void;
  onOpenPresets?: () => void;
  onOpenContact?: () => void;
  onOpenLegalNotice?: () => void;
  onStopSession?: () => void;
  isRemoteControlView?: boolean;
  onOpenChat?: () => void;
  remoteControlMode?: 'inactive' | 'controlled' | 'controlling';
  controlledSessionCode?: string;
  onActivateRemoteControl?: () => void;
  onClearSelections?: () => void;
  onClose?: () => void;
  isSessionActive?: boolean;
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
  isRemoteControlView,
}: Pick<EventListManagementProps, 'order' | 'onOrderChange' | 'eventDetails' | 'onReload' | 'onRemove' | 'onModify' | 'isViewPage' | 'onToggleFullscreen' | 'fullscreenIndex' | 'isRemoteControlView'>) {
    
  const validOrder = Array.isArray(order) ? order : [];
  
  const activeEventsCount = validOrder.length;
  
  const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
      const newOrder = [...validOrder];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex >= 0 && targetIndex < activeEventsCount) {
          [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
          
          const fullOrder = Array.from({ length: 9 }, (_, i) => i);
          const usedIndexes = new Set(newOrder);

          const finalFullOrder = [...newOrder, ...fullOrder.filter(i => !usedIndexes.has(i))]

          onOrderChange(finalFullOrder);
      }
  };


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
                <div key={originalIndex} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50 min-w-0">
                    <div 
                        className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold"
                    >
                        {currentIndex + 1}
                    </div>
                    
                    <div className="flex-grow flex flex-col gap-2 min-w-0">
                        <div className="h-[40px] flex items-center w-full justify-center text-center">
                            <p className="text-sm font-semibold line-clamp-2 break-words">
                                {event.title}
                            </p>
                        </div>
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

                            {(isViewPage || isRemoteControlView) && onToggleFullscreen && (
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
                                onClick={(e) => { e.stopPropagation(); onModify(originalIndex); }}
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
        onOpenTutorial, onOpenErrors, onNotificationManager, onOpenCalendar, onOpenPresets, onOpenContact, onOpenLegalNotice,
        onAddEvent, onSchedule, onClearSelections,
        isRemoteControlView = false,
        onOpenChat,
        remoteControlMode,
        controlledSessionCode,
        onActivateRemoteControl,
        isViewPage,
        onClose,
        isSessionActive
    } = props;
        
    const order = props.order || [];
    const hasSelections = order.length > 0;
    
    return (
      <div className="flex flex-col h-full bg-background text-foreground relative">
        {!isRemoteControlView && (
            <>
                <div className="p-4 flex-shrink-0 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Configuración</h2>
                     {onClose && (
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-foreground">
                            <X className="h-5 w-5" />
                        </Button>
                     )}
                </div>
                <Separator />
            </>
        )}

        {isSessionActive && !isRemoteControlView && (
             <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
                {onClose && (
                    <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-2 right-2 h-8 w-8 text-foreground">
                        <X className="h-5 w-5" />
                    </Button>
                )}
                <p className="font-semibold text-foreground">Sesión de control remoto activa.</p>
                <p className="text-sm text-muted-foreground mb-2">Realice las modificaciones desde ahí.</p>
                <p className="text-sm text-muted-foreground">Su código de control remoto es: <span className="font-bold text-lg text-primary tracking-widest">{controlledSessionCode}</span></p>
             </div>
        )}

        <ScrollArea className="flex-grow h-0">
          <div className='p-4 space-y-4' style={{ opacity: isSessionActive && !isRemoteControlView ? 0.2 : 1, pointerEvents: isSessionActive && !isRemoteControlView ? 'none' : 'auto' }}>
              <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-events">
                  <AccordionItem value="item-events" className="border rounded-lg px-4">
                      <AccordionTrigger>Eventos/Canales Seleccionados ({order.length})</AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4">
                          <EventList {...props} />
                           <div className="space-y-2 pt-2">
                            {onAddEvent && (
                              <Button variant="outline" className="w-full justify-center" onClick={onAddEvent}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Añadir Evento/Canal
                              </Button>
                            )}
                             {onSchedule && (
                               <Button variant="outline" className="w-full justify-center" onClick={onSchedule}>
                                   <CalendarDays className="mr-2 h-4 w-4" /> Programar Selección
                               </Button>
                             )}
                            {onOpenPresets && (
                                <Button variant="outline" className="w-full justify-center" onClick={onOpenPresets}>
                                    <LayoutGrid className="mr-2 h-4 w-4" /> Presets
                                </Button>
                            )}
                            {onClearSelections && hasSelections && (
                                <Button variant="destructive" className="w-full" onClick={onClearSelections}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    ELIMINAR SELECCIONES
                                </Button>
                            )}
                            {isViewPage && onActivateRemoteControl && !isRemoteControlView && remoteControlMode !== 'controlled' && (
                                <Button variant="outline" className="w-full justify-center" onClick={onActivateRemoteControl}>
                                    <Airplay className="mr-2 h-4 w-4" /> Activar Control Remoto
                                </Button>
                            )}
                          </div>
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
                          {isRemoteControlView && onOpenChat && (
                            <Button variant="outline" className="w-full justify-start" onClick={onOpenChat}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Abrir Chat en Vista
                            </Button>
                          )}
                          {!isRemoteControlView && onNotificationManager && (
                            <Button variant="outline" className="w-full justify-start" onClick={onNotificationManager}>
                                <Mail className="mr-2 h-4 w-4" /> Notificaciones por Correo
                            </Button>
                          )}
                          {!isRemoteControlView && onOpenCalendar && (
                            <Button variant="outline" className="w-full justify-start" onClick={onOpenCalendar}>
                                <CalendarDays className="mr-2 h-4 w-4" /> Suscripción a Calendario
                            </Button>
                          )}
                      </AccordionContent>
                  </AccordionItem>
                  
                  {!isRemoteControlView && (
                    <AccordionItem value="item-help" className="border rounded-lg px-4">
                          <AccordionTrigger>Ayuda y Soporte</AccordionTrigger>
                          <AccordionContent className="pt-4 pb-4 space-y-2">
                              {onOpenTutorial && (
                              <Button variant="outline" className="w-full justify-start" onClick={onOpenTutorial}>
                                  <BookOpen className="mr-2 h-4 w-4" /> Tutorial de Uso
                              </Button>
                              )}
                              {onOpenErrors && (
                              <Button variant="outline" className="w-full justify-start" onClick={onOpenErrors}>
                                  <AlertCircle className="mr-2 h-4 w-4" /> Solución de Errores
                              </Button>
                              )}
                              {onOpenContact && (
                                <Button variant="outline" className="w-full justify-start" onClick={onOpenContact}>
                                    <FileText className="mr-2 h-4 w-4" /> Contacto
                                </Button>
                              )}
                              {onOpenLegalNotice && (
                                <Button variant="outline" className="w-full justify-start" onClick={onOpenLegalNotice}>
                                    <FileText className="mr-2 h-4 w-4" /> Aviso Legal
                                </Button>
                              )}
                          </AccordionContent>
                    </AccordionItem>
                  )}
              </Accordion>
          </div>
        </ScrollArea>
        {isRemoteControlView && (
             <div className="p-4 mt-auto border-t">
                <Button variant="destructive" className="w-full" onClick={onStopSession}>
                    Detener Control
                </Button>
             </div>
        )}
      </div>
    );
}
