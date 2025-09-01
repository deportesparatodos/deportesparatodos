

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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { useState } from 'react';

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
  categories?: string[];
  onOpenTutorial?: () => void;
  onOpenErrors?: () => void;
  onOpenCalendar?: () => void;
  onOpenPresets?: () => void;
  isTutorialOpen?: boolean;
  onIsTutorialOpenChange?: (open: boolean) => void;
  isErrorsOpen?: boolean;
  onIsErrorsOpenChange?: (open: boolean) => void;
  onStopSession?: () => void;
  isRemoteControlView?: boolean;
  onOpenChat?: () => void;
  remoteControlMode?: 'inactive' | 'controlled' | 'controlling';
  controlledSessionCode?: string;
  onActivateRemoteControl?: () => void;
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
  
  const activeEventsCount = validOrder.length;
  
  const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
      const newOrder = [...validOrder];
      const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (targetIndex >= 0 && targetIndex < activeEventsCount) {
          [newOrder[currentIndex], newOrder[targetIndex]] = [newOrder[targetIndex], newOrder[currentIndex]];
          
          const finalOrder = Array.from({length: 9}, (_, i) => i);
          let newOrderCursor = 0;
          const usedIndexes = new Set(newOrder);

          for(let i=0; i<9; i++) {
            if(eventDetails[i] !== null) {
              finalOrder[i] = newOrder[newOrderCursor++];
            }
          }

          const fullOrder = Array.from({ length: 9 }, (_, i) => i);
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
        onOpenTutorial, onOpenErrors, onNotificationManager, onOpenCalendar, onOpenPresets,
        onAddEvent, onSchedule,
        isRemoteControlView = false,
        onOpenChat,
        remoteControlMode,
        controlledSessionCode,
        onActivateRemoteControl,
        isViewPage,
    } = props;
        
    const order = props.order || [];
    const isSessionActive = remoteControlMode === 'controlled';
    const [contactOpen, setContactOpen] = useState(false);
    const [legalNoticeOpen, setLegalNoticeOpen] = useState(false);

    return (
      <div className="flex flex-col h-full bg-background text-foreground relative">
        {!isRemoteControlView && (
            <>
                <div className="p-4 flex-shrink-0 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Configuración</h2>
                </div>
                <Separator />
            </>
        )}

        {isSessionActive && !isRemoteControlView && (
             <div className="absolute inset-0 bg-secondary/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center text-center p-4">
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
                              <Button variant="outline" className="w-full flex-shrink-0" onClick={onAddEvent}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Añadir Evento/Canal
                              </Button>
                            )}
                            {!isViewPage && onOpenPresets && !isRemoteControlView && (
                                <Button variant="outline" className="w-full justify-center" onClick={onOpenPresets}>
                                    <LayoutGrid className="mr-2 h-4 w-4" /> Presets
                                </Button>
                            )}
                            {isViewPage && onSchedule && !isRemoteControlView && (
                                <Button variant="outline" className="w-full justify-center" onClick={onSchedule}>
                                    <CalendarDays className="mr-2 h-4 w-4" /> Programar Selección
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
                          {isViewPage && onOpenChat && (
                            <Button variant="outline" className="w-full justify-start" onClick={onOpenChat}>
                                <MessageSquare className="mr-2 h-4 w-4" /> Abrir Chat en Vista
                            </Button>
                          )}
                          {!isRemoteControlView && (
                            <>
                                <Separator className="my-2"/>
                                {onNotificationManager && (
                                    <Button variant="outline" className="w-full justify-start" onClick={onNotificationManager}>
                                        <Mail className="mr-2 h-4 w-4" /> Notificaciones por Correo
                                    </Button>
                                )}
                                {onOpenCalendar && (
                                    <Button variant="outline" className="w-full justify-start" onClick={onOpenCalendar}>
                                        <CalendarDays className="mr-2 h-4 w-4" /> Suscripción a Calendario
                                    </Button>
                                )}
                            </>
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
                              <Dialog open={contactOpen} onOpenChange={setContactOpen}>
                                <DialogTrigger asChild>
                                  <Button variant="outline" className="w-full justify-start">
                                      <FileText className="mr-2 h-4 w-4" /> Contacto
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Contacto</DialogTitle>
                                        <DialogDescription>
                                        ¿Tienes alguna sugerencia o encontraste un error? ¡Tu opinión nos ayuda a mejorar! Comunícate con nosotros para reportar fallos, enlaces incorrectos o proponer nuevos canales a deportesparatodosvercel@gmail.com.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button>Cerrar</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                              </Dialog>
                               <Dialog open={legalNoticeOpen} onOpenChange={setLegalNoticeOpen}>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">
                                        <FileText className="mr-2 h-4 w-4" /> Aviso Legal
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>Descargo de Responsabilidad – Derechos de Autor</DialogTitle>
                                    </DialogHeader>
                                    <ScrollArea className="h-96 pr-6">
                                        <div className="text-sm text-muted-foreground space-y-4">
                                            <p>Deportes para Todos es una plataforma que actúa únicamente como agregador de enlaces embebidos provenientes de terceros. No alojamos, retransmitimos ni manipulamos directamente ninguna señal de audio o video. Todos los contenidos audiovisuales visibles en este sitio están incrustrados mediante iframes públicos desde plataformas externas como streamtp3.com, la12hd.com, YouTube, Twitch, OK.ru, entre otras.</p>
                                            <p>No participamos en la creación, alteración ni distribución de dichas señales, y no somos responsables de la legalidad de los contenidos a los que se accede a través de estos terceros. Cualquier infracción potencial corresponde a dichos proveedores externos.</p>
                                            
                                            <h3 className="font-bold text-foreground mt-4">Sobre la legalidad y responsabilidad de terceros:</h3>
                                            <p>Existen antecedentes de sitios sancionados por alojar y retransmitir directamente contenido con derechos de autor. En contraste, Deportes para Todos no aloja señales ni transmite contenido, y se limita exclusivamente a insertar enlaces públicos de terceros mediante código iframe. No participamos en la obtención ni distribución del contenido audiovisual y no tenemos control sobre su disponibilidad o legalidad.</p>

                                            <h3 className="font-bold text-foreground mt-4">Uso de marcas y logos:</h3>
                                            <p>Todas las marcas, nombres comerciales, logotipos o imágenes presentes en el sitio son propiedad de sus respectivos dueños. En Deportes para Todos se utilizan exclusivamente con fines informativos o ilustrativos, respetando el derecho de cita previsto por el Artículo 32 de la Ley 11.723 de Propiedad Intelectual de Argentina.</p>

                                            <h3 className="font-bold text-foreground mt-4">Legislación aplicable:</h3>
                                            <p>Este sitio opera bajo las leyes de la República Argentina. El mero hecho de insertar un iframe público no configura, por sí solo, un delito conforme al derecho argentino, siempre que no se participe en la obtención o manipulación del contenido protegido.</p>

                                            <h3 className="font-bold text-foreground mt-4">Uso personal y responsabilidad del usuario:</h3>
                                            <p>El acceso a esta página se realiza bajo responsabilidad del usuario. Si en tu país este tipo de contenido se encuentra restringido, es tu obligación cumplir con las leyes locales. No nos responsabilizamos por el uso indebido o ilegal de los enlaces por parte de los visitantes.</p>
                                            
                                            <h3 className="font-bold text-foreground mt-4">Sobre el uso de subdominios:</h3>
                                            <p>Deportes para Todos utiliza subdominios como https://www.google.com/search?q=gh.deportesparatodos.com con fines exclusivamente organizativos y técnicos, para centralizar y facilitar el acceso a iframes de terceros. Estos subdominios no almacenan, manipulan ni retransmiten contenido audiovisual, sino que actúan como una ventana hacia los streams originales disponibles públicamente en sitios como streamtp3.com, la12hd.com y otros. En ningún caso se modifica la fuente original ni se interviene en el contenido emitido por dichos terceros.</p>

                                            <h3 className="font-bold text-foreground mt-4">Sobre la experiencia del usuario:</h3>
                                            <p>Deportes para Todos puede aplicar medidas para mejorar la experiencia de navegación, como la reducción de anuncios emergentes o contenido intrusivo de terceros. Estas medidas no interfieren con el contenido audiovisual transmitido dentro de los reproductores embebidos, ni modifican las señales originales. Cualquier bloqueo se limita a elementos externos ajenos a la emisión en sí.</p>

                                            <h3 className="font-bold text-foreground mt-4">Monetización, publicidad y patrocinadores</h3>
                                            <p>Deportes para Todos puede exhibir anuncios publicitarios proporcionados por plataformas de monetización de terceros (como Monetag) y/o incluir contenido patrocinado de empresas vinculadas al sector iGaming (casas de apuestas, juegos online y plataformas similares).</p>
                                            <p>Estos ingresos publicitarios permiten el mantenimiento del sitio, pero no están directamente vinculados al contenido embebido ni implican relación comercial con las plataformas desde las cuales se obtiene dicho contenido.</p>
                                            <p>Deportes para Todos no gestiona ni opera plataformas de apuestas, ni aloja contenido audiovisual, y no obtiene beneficios económicos derivados de la transmisión de señales protegidas. Toda la monetización se genera por el tráfico general del sitio, independientemente del contenido de terceros que se pueda visualizar mediante iframes.</p>
                                            <p>Los contenidos promocionados, ya sea por publicidad programática o acuerdos de patrocinio, se presentan conforme a la legislación vigente y no representan un respaldo o relación directa con los titulares de los derechos de las transmisiones que pudieran visualizarse mediante terceros.</p>
                                            <p>The Blogger Network, LLC) for the purposes of placing advertising on the Site, and Monumetric will collect and use certain data for advertising purposes. To learn more about Monumetric’s data usage, click here: Publisher Advertising Privacy</p>

                                            <h3 className="font-bold text-foreground mt-4">Notificaciones de derechos de autor:</h3>
                                            <p>Si usted es titular de derechos o su representante y considera que un contenido embebido desde una fuente externa infringe sus derechos, puede enviarnos una notificación formal mandando un mail a deportesparatodosvercel@gmail.com. Aunque no estamos sujetos a la legislación DMCA de EE.UU., colaboramos voluntariamente con cualquier requerimiento legítimo bajo dicho marco.</p>
                                            <p>Por favor incluya en su notificación:</p>
                                            <ul className="list-disc pl-6 space-y-1">
                                                <li>(a) Su firma (física o digital) como titular o representante autorizado.</li>
                                                <li>(b) Identificación clara del contenido presuntamente infringido.</li>
                                                <li>(c) Enlace directo al contenido incrustado en Deportes para Todos.</li>
                                                <li>(d) Datos de contacto válidos (correo electrónico).</li>
                                                <li>(e) Una declaración de buena fe indicando que el uso no está autorizado por usted, su agente o la ley.</li>
                                                <li>(f) Una declaración de veracidad de la información, bajo pena de perjurio.</li>
                                            </ul>
                                            <p>Una vez recibida y analizada la notificación, procederemos a desactivar el enlace correspondiente si así corresponde. También podremos notificar al proveedor del iframe, si fuera posible.</p>
                                            <p className="pt-2">Al utilizar este sitio web, usted declara haber leído, comprendido y aceptado este descargo de responsabilidad en su totalidad.</p>
                                        </div>
                                    </ScrollArea>
                                    <DialogFooter>
                                        <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                               </Dialog>
                          </AccordionContent>
                    </AccordionItem>
                  )}
              </Accordion>
          </div>
        </ScrollArea>
      </div>
    );
}
