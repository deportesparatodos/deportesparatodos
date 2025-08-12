
'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { ArrowUp, ArrowDown, RotateCw, Trash2, Plus, Pencil, Airplay, Maximize, Minimize, Settings, AlertCircle, CalendarDays, BookOpen, Mail, FileText, X, Play } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
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
  isTutorialOpen: boolean;
  onIsTutorialOpenChange: (open: boolean) => void;
  isErrorsOpen: boolean;
  onIsErrorsOpenChange: (open: boolean) => void;
  showTopSeparator?: boolean;
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
        showTopSeparator, onSchedule
    } = props;
    
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isLegalOpen, setIsLegalOpen] = useState(false);
    
    const order = props.order || [];

    return (
      <div className="flex flex-col h-full">
         {showTopSeparator && <Separator className="w-full flex-shrink-0" />}
         <div className="p-4 flex-shrink-0">
          <h2 className="text-lg font-semibold text-center">Configuración</h2>
        </div>
        <Separator className="w-full flex-shrink-0" />

        <ScrollArea className="flex-grow h-0">
          <div className='p-4 space-y-4'>
              <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="item-events">
                  <AccordionItem value="item-events" className="border rounded-lg px-4">
                      <AccordionTrigger>Eventos/Canales Seleccionados ({order.length})</AccordionTrigger>
                      <AccordionContent className="pt-2 pb-4 space-y-4">
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
                                  <div className="space-y-2 pt-2">
                                      {props.onAddEvent && (
                                          <Button variant="outline" className="w-full flex-shrink-0" onClick={props.onAddEvent}>
                                              <Plus className="mr-2 h-4 w-4" />
                                              Añadir Evento/Canal
                                          </Button>
                                      )}
                                     {props.onSchedule && (
                                        <Button variant="outline" className="w-full justify-center" onClick={props.onSchedule}>
                                            <CalendarDays className="mr-2 h-4 w-4" /> Programar Selección
                                        </Button>
                                      )}
                                  </div>
                              </>
                          )}
                      </AccordionContent>
                  </AccordionItem>
                  
                 {props.remoteControlMode !== 'controlling' && (
                  <AccordionItem value="remote-control" className="border rounded-lg px-4">
                      <AccordionTrigger>Control Remoto</AccordionTrigger>
                      <AccordionContent className="pt-4 pb-4 text-center">
                          {remoteControlMode === 'controlled' ? (
                                  <div className="text-center space-y-2">
                                  <p className="text-sm text-muted-foreground mb-2">
                                  Sesión de control remoto activa. Código:
                                  </p>
                                  <div className="p-3 bg-muted rounded-lg">
                                  <p className="text-3xl font-bold tracking-widest text-primary">
                                      {remoteSessionId || '----'}
                                  </p>
                                  </div>
                              </div>
                          ) : (
                              <Button onClick={onActivateControlledMode} className="w-full">
                                  <Airplay className="mr-2 h-4 w-4" /> Activar Control Remoto
                              </Button>
                          )}
                      </AccordionContent>
                  </AccordionItem>
                  )}


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
          </div>
        </ScrollArea>
        <div className="p-4 mt-auto border-t">
            <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start" onClick={onOpenTutorial}>
                    <BookOpen className="mr-2 h-4 w-4" /> Tutorial de Uso
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={onOpenErrors}>
                    <AlertCircle className="mr-2 h-4 w-4" /> Solución de Errores
                </Button>
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
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsContactOpen(true)}>
                    <Mail className="mr-2 h-4 w-4" /> Contacto
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setIsLegalOpen(true)}>
                    <FileText className="mr-2 h-4 w-4" /> Aviso Legal
                </Button>
            </div>
        </div>
        
        <Dialog open={props.isTutorialOpen} onOpenChange={props.onIsTutorialOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Tutorial de Uso</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96 pr-6">
                   <div className="text-sm text-muted-foreground space-y-4">
                        <h3 className="font-bold text-foreground mt-4">¡Bienvenido a DEPORTES PARA TODOS!</h3>
                        <p>Esta plataforma te permite ver múltiples eventos deportivos o canales de televisión al mismo tiempo, en una sola pantalla. A continuación, te explicamos cómo funciona.</p>

                        <h3 className="font-bold text-foreground mt-4">Paso 1: Explorar y Seleccionar Eventos</h3>
                        <p>Al entrar, verás varias listas de eventos: "En Vivo", "Próximos", "Canales 24/7", etc. Simplemente haz clic en la tarjeta del evento o canal que te interese. Al hacerlo, se abrirá un menú con las diferentes opciones de transmisión disponibles para ese evento.</p>
                        <p>Selecciona una de las opciones de transmisión. Una vez que lo hagas, el evento se añadirá automáticamente a tu selección, que puedes ver representada por un número en el botón verde de "Play" (<Play className="inline-block h-4 w-4" />) en la parte superior derecha.</p>
                        <p>Puedes seguir añadiendo eventos o canales hasta un máximo de 9. Verás una marca de verificación verde sobre las tarjetas de los eventos que ya has seleccionado.</p>

                        <h3 className="font-bold text-foreground mt-4">Paso 2: Configurar tu Selección</h3>
                        <p>Antes de iniciar la transmisión, puedes personalizar cómo se verán tus selecciones. Haz clic en el icono de engranaje (<Settings className="inline-block h-4 w-4" />) para abrir el panel de configuración. Aquí podrás:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Gestionar tu Selección:</strong> En el desplegable "Eventos/Canales", puedes reordenar las ventanas con las flechas, cambiar la fuente de transmisión con el lápiz, o eliminar un evento con el bote de basura.</li>
                            <li><strong>Ajustar el Diseño:</strong> Modifica el espaciado entre las ventanas y el color del borde para una mejor organización visual.</li>
                            <li><strong>Activar el Chat:</strong> Habilita o deshabilita el chat en vivo, que aparecerá en la pantalla de transmisión.</li>
                        </ul>

                        <h3 className="font-bold text-foreground mt-4">Paso 3: Iniciar la Transmisión</h3>
                        <p>Cuando estés listo, presiona el botón verde de "Play" (<Play className="inline-block h-4 w-4" />). La aplicación organizará todas tus selecciones en una cuadrícula en la pantalla. Desde esta vista, puedes seguir accediendo al menú de configuración para hacer ajustes en tiempo real, como recargar una ventana que no carga (<RotateCw className="inline-block h-4 w-4" />) o poner una en pantalla completa (<Maximize className="inline-block h-4 w-4" />).</p>
                        
                        <h3 className="font-bold text-foreground mt-4">Funciones Avanzadas</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Control Remoto (<Airplay className="inline-block h-4 w-4" />):</strong> Te permite usar un dispositivo (como tu móvil) para controlar lo que se ve en otro (como tu TV). En la pantalla que quieres controlar, abre el menú y pulsa "Activar Control Remoto" para generar un código. En el dispositivo que usarás como control, introduce ese código.</li>
                            <li><strong>Programar Selección (<CalendarDays className="inline-block h-4 w-4" />):</strong> Guarda una selección de eventos y prográmala para que se active automáticamente en una fecha y hora específicas. Ideal para no perderte los partidos del fin de semana.</li>
                            <li><strong>Notificaciones y Calendario (<Mail className="inline-block h-4 w-4" />, <CalendarDays className="inline-block h-4 w-4"/>):</strong> Suscríbete para recibir correos con la agenda diaria o para añadir los eventos directamente a tu calendario personal.</li>
                        </ul>
                        <p className="pt-2">¡Eso es todo! Explora las opciones y disfruta del deporte a tu manera.</p>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button>Entendido</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={props.isErrorsOpen} onOpenChange={props.onIsErrorsOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Solución de Errores Comunes</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96 pr-6">
                     <div className="text-sm text-muted-foreground space-y-4">
                        <p>A continuación, te presentamos una guía detallada para resolver los problemas más frecuentes que podrías encontrar al intentar reproducir videos. Sigue estos pasos en orden para maximizar las chances de éxito.</p>
                        
                        <h3 className="font-bold text-foreground">1. Configurar un DNS público (Cloudflare o Google)</h3>
                        <p><span className="font-semibold text-foreground">El Problema:</span> Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios o servidores de video a través de su DNS. Esto provoca que el video nunca cargue y veas una pantalla en negro o un error de conexión.</p>
                        <p><span className="font-semibold text-foreground">La Solución:</span> Cambiar el DNS de tu dispositivo o router a uno público como el de <a href="https://one.one.one.one" target="_blank" rel="noopener noreferrer" className="text-primary underline">Cloudflare (1.1.1.1)</a> o Google (8.8.8.8) puede saltarse estas restricciones.</p>
                        
                        <h3 className="font-bold text-foreground">2. Instalar una Extensión de Reproductor de Video</h3>
                        <p><span className="font-semibold text-foreground">El Problema:</span> Algunos streams de video utilizan formatos modernos como M3U8 o MPD que no todos los navegadores soportan de forma nativa. Si el navegador no sabe cómo "leer" el formato, el video no se reproducirá.</p>
                        <p><span className="font-semibold text-foreground">La Solución:</span> Instalar una extensión como <a href="https://chromewebstore.google.com/detail/reproductor-mpdm3u8m3uepg/opmeopcambhfimffbomjgemehjkbbmji?hl=es" target="_blank" rel="noopener noreferrer" className="text-primary underline">"Reproductor MPD/M3U8/M3U/EPG"</a> (para Chrome/Edge) le da a tu navegador las herramientas necesarias para decodificar y reproducir estos formatos.</p>

                        <h3 className="font-bold text-foreground">3. Cambiar de Navegador</h3>
                        <p><span className="font-semibold text-foreground">El Problema:</span> A veces, las configuraciones específicas de un navegador, una actualización reciente o una extensión conflictiva pueden impedir la reproducción.</p>
                        <p><span className="font-semibold text-foreground">La Solución:</span> Probar con un navegador diferente es una forma rápida de descartar problemas locales. Recomendamos usar las versiones más recientes de Google Chrome, Mozilla Firefox o Microsoft Edge.</p>

                        <h3 className="font-bold text-foreground">4. Desactivar Bloqueadores de Anuncios (Adblockers)</h3>
                        <p><span className="font-semibold text-foreground">El Problema:</span> Los bloqueadores de anuncios son muy útiles, pero a veces pueden ser demasiado agresivos. Pueden bloquear no solo los anuncios, sino también los scripts o reproductores de video necesarios para que la transmisión funcione.</p>
                        <p><span className="font-semibold text-foreground">La Solución:</span> Intenta desactivar tu Adblocker (como AdBlock, uBlock Origin, etc.) temporalmente para este sitio web.</p>

                        <h3 className="font-bold text-foreground">5. Optimizar para Escritorio</h3>
                        <p><span className="font-semibold text-foreground">El Problema:</span> La aplicación está diseñada y optimizada para la experiencia en una computadora de escritorio o portátil. Los dispositivos móviles (celulares, tabletas) tienen limitaciones de hardware y software que pueden causar errores de reproducción o problemas de rendimiento.</p>
                        <p><span className="font-semibold text-foreground">La Solución:</span> Para una experiencia más estable y fluida, recomendamos encarecidamente usar la plataforma en una computadora.</p>

                        <h3 className="font-bold text-foreground">6. Reiniciar el Dispositivo y la Red</h3>
                        <p><span className="font-semibold text-foreground">El Problema:</span> Problemas temporales de software, caché acumulada o fallos en la conexión de red pueden impedir que el contenido cargue correctamente.</p>
                        <p><span className="font-semibold text-foreground">La Solución:</span> El clásico "apagar y volver a encender".</p>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Contacto</DialogTitle>
                </DialogHeader>
                <div className="text-sm text-muted-foreground">
                    <p>Si tienes alguna pregunta, sugerencia o problema técnico, no dudes en contactarnos a través de nuestro correo electrónico: <a href="mailto:deportesparatodosvercek@gmail.com" className="text-primary underline">deportesparatodosvercek@gmail.com</a>.</p>
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isLegalOpen} onOpenChange={setIsLegalOpen}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Aviso Legal</DialogTitle>
                </DialogHeader>
                <ScrollArea className="h-96 pr-6">
                    <div className="text-sm text-muted-foreground space-y-4">
                        <h3 className="font-bold text-foreground">Descargo de Responsabilidad – Derechos de Autor</h3>
                        <p>DEPORTES PARA TODOS es una plataforma que actúa únicamente como agregador de enlaces embebidos provenientes de terceros. No alojamos, retransmitimos ni manipulamos directamente ninguna señal de audio o video. Todos los contenidos audiovisuales visibles en este sitio están incrustados mediante iframes públicos desde plataformas externas como streamtp3.com, la12hd.com, YouTube, Twitch, OK.ru, entre otras.</p>
                        <p>No participamos en la creación, alteración ni distribución de dichas señales, y no somos responsables de la legalidad de los contenidos a los que se accede a través de estos terceros. Cualquier infracción potencial corresponde a dichos proveedores externos.</p>
                        
                        <h3 className="font-bold text-foreground">Sobre la legalidad y responsabilidad de terceros</h3>
                        <p>Existen antecedentes de sitios sancionados por alojar y retransmitir directamente contenido con derechos de autor. En contraste, DEPORTES PARA TODOS no aloja señales ni transmite contenido, y se limita exclusivamente a insertar enlaces públicos de terceros mediante código iframe. No participamos en la obtención ni distribución del contenido audiovisual y no tenemos control sobre su disponibilidad o legalidad.</p>

                        <h3 className="font-bold text-foreground">Uso de marcas y logos</h3>
                        <p>Todas las marcas, nombres comerciales, logotipos o imágenes presentes en el sitio son propiedad de sus respectivos dueños. En DEPORTES PARA TODOS se utilizan exclusivamente con fines informativos o ilustrativos, respetando el derecho de cita previsto por el Artículo 32 de la Ley 11.723 de Propiedad Intelectual de Argentina.</p>

                        <h3 className="font-bold text-foreground">Legislación aplicable</h3>
                        <p>Este sitio opera bajo las leyes de la República Argentina. El mero hecho de insertar un iframe público no configura, por sí solo, un delito conforme al derecho argentino, siempre que no se participe en la obtención o manipulación del contenido protegido.</p>

                        <h3 className="font-bold text-foreground">Uso personal y responsabilidad del usuario</h3>
                        <p>El acceso a esta página se realiza bajo responsabilidad del usuario. Si en tu país este tipo de contenido se encuentra restringido, es tu obligación cumplir con las leyes locales. No nos responsabilizamos por el uso indebido o ilegal de los enlaces por parte de los visitantes.</p>
                        
                        <h3 className="font-bold text-foreground">Sobre el uso de subdominios</h3>
                        <p>DEPORTES PARA TODOS utiliza subdominios como gh.deportesparatodos.tv con fines exclusivamente organizativos y técnicos, para centralizar y facilitar el acceso a iframes de terceros. Estos subdominios no almacenan, manipulan ni retransmiten contenido audiovisual, sino que actúan como una ventana hacia los streams originales disponibles públicamente en sitios como streamtp3.com, la12hd.com y otros. En ningún caso se modifica la fuente original ni se interviene en el contenido emitido por dichos terceros.</p>

                        <h3 className="font-bold text-foreground">Sobre la experiencia del usuario</h3>
                        <p>DEPORTES PARA TODOS puede aplicar medidas para mejorar la experiencia de navegación, como la reducción de anuncios emergentes o contenido intrusivo de terceros. Estas medidas no interfieren con el contenido audiovisual transmitido dentro de los reproductores embebidos, ni modifican las señales originales. Cualquier bloqueo se limita a elementos externos ajenos a la emisión en sí.</p>

                        <h3 className="font-bold text-foreground">Monetización, publicidad y patrocinadores</h3>
                        <p>DEPORTES PARA TODOS puede exhibir anuncios publicitarios proporcionados por plataformas de monetización de terceros (como Monetag) y/o incluir contenido patrocinado de empresas vinculadas al sector iGaming (casas de apuestas, juegos online y plataformas similares).</p>
                        <p>Estos ingresos publicitarios permiten el mantenimiento del sitio, pero no están directamente vinculados al contenido embebido ni implican relación comercial con las plataformas desde las cuales se obtiene dicho contenido.</p>
                        <p>DEPORTES PARA TODOS no gestiona ni opera plataformas de apuestas, ni aloja contenido audiovisual, y no obtiene beneficios económicos derivados de la transmisión de señales protegidas. Toda la monetización se genera por el tráfico general del sitio, independientemente del contenido de terceros que se pueda visualizar mediante iframes.</p>
                        <p>Los contenidos promocionados, ya sea por publicidad programática o acuerdos de patrocinio, se presentan conforme a la legislación vigente y no representan un respaldo o relación directa con los titulares de los derechos de las transmisiones que pudieran visualizarse mediante terceros.</p>
                        <p>Nos reservamos el derecho de incluir o remover campañas publicitarias en cualquier momento, y recomendamos a los usuarios consultar la política de privacidad de cada plataforma externa a la que accedan desde este sitio.</p>
                        
                        <h3 className="font-bold text-foreground">Relación con los dueños del contenido</h3>
                        <p>DEPORTES PARA TODOS no tiene relación alguna con los titulares de los derechos de las transmisiones embebidas, ni con las plataformas que los alojan. Todo el contenido audiovisual visualizado mediante iframes es responsabilidad exclusiva del sitio externo que lo provee.</p>

                        <h3 className="font-bold text-foreground">Mecanismos de seguridad</h3>
                        <p>No se utilizan mecanismos técnicos para eludir bloqueos, restricciones regionales (geobloqueos) ni sistemas de autenticación de las plataformas externas.</p>

                        <h3 className="font-bold text-foreground">Cookies y datos del usuario</h3>
                        <p>Este sitio puede utilizar cookies de terceros para ofrecer una mejor experiencia de usuario, realizar estadísticas anónimas de uso o mostrar anuncios relevantes. Al navegar por DEPORTES PARA TODOS usted acepta este uso de cookies. Recomendamos consultar las políticas de privacidad de los servicios externos vinculados a este sitio.</p>
                        <p>El contenido patrocinado relacionado con plataformas de iGaming está destinado únicamente a usuarios mayores de 18 años. DEPORTES PARA TODOS no se responsabiliza por el acceso a dichas plataformas por parte de menores de edad.</p>
                        <p>This Site is affiliated with Monumetric (dba for The Blogger Network, LLC) for the purposes of placing advertising on the Site, and Monumetric will collect and use certain data for advertising purposes. To learn more about Monumetric’s data usage, click here: <a href="https://www.monumetric.com/publisher-advertising-privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Publisher Advertising Privacy</a></p>

                        <h3 className="font-bold text-foreground">Notificaciones de derechos de autor</h3>
                        <p>Si usted es titular de derechos o su representante y considera que un contenido embebido desde una fuente externa infringe sus derechos, puede enviarnos una notificación formal. Aunque no estamos sujetos a la legislación DMCA de EE.UU., colaboramos voluntariamente con cualquier requerimiento legítimo bajo dicho marco.</p>
                        <p>Por favor incluya en su notificación:</p>
                        <ul className="list-disc pl-5 space-y-1">
                          <li>(a) Su firma (física o digital) como titular o representante autorizado.</li>
                          <li>(b) Identificación clara del contenido presuntamente infringido.</li>
                          <li>(c) Enlace directo al contenido incrustado en DEPORTES PARA TODOS.</li>
                          <li>(d) Datos de contacto válidos (correo electrónico).</li>
                          <li>(e) Una declaración de buena fe indicando que el uso no está autorizado por usted, su agente o la ley.</li>
                          <li>(f) Una declaración de veracidad de la información, bajo pena de perjurio.</li>
                        </ul>
                        <p>Una vez recibida y analizada la notificación, procederemos a desactivar el enlace correspondiente si así corresponde. También podremos notificar al proveedor del iframe, si fuera posible.</p>

                        <p>Al utilizar este sitio web, usted declara haber leído, comprendido y aceptado este descargo de responsabilidad en su totalidad.</p>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
    );
}
