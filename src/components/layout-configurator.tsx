
'use client';

import { useState } from 'react';
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
        onOpenTutorial, onOpenErrors, onNotificationManager, onOpenCalendar
    } = props;
    
    const [isContactOpen, setIsContactOpen] = useState(false);
    const [isLegalOpen, setIsLegalOpen] = useState(false);
    
    const order = props.order || [];

    return (
      <>
        <div className="p-4 border-b flex-shrink-0 flex items-center justify-center relative">
            <h2 className="text-lg font-semibold text-center">Configuración</h2>
            <DialogClose asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="h-5 w-5" />
                </Button>
            </DialogClose>
        </div>
        <div className="flex-grow h-0">
          <ScrollArea className="h-full">
            <div className='p-4 space-y-4'>
                <Accordion type="single" collapsible className="w-full space-y-4" defaultValue="">
                    <AccordionItem value="item-events" className="border rounded-lg px-4">
                        <AccordionTrigger>Eventos/Canales Seleccionados ({order.length})</AccordionTrigger>
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
        </div>
        <div className="p-4 mt-auto border-t">
            <Separator className='mb-4' />
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
                        <h3 className="font-bold text-foreground mt-4">¡Bienvenido a Deportes para Todos!</h3>
                        <p>Esta guía te ayudará a sacar el máximo provecho de todas las funciones. El objetivo de esta plataforma es simple: permitirte ver múltiples eventos deportivos o canales de televisión al mismo tiempo, en una sola pantalla, sin complicaciones.</p>

                        <h3 className="font-bold text-foreground mt-4">Paso 1: Explorar y Seleccionar Eventos</h3>
                        <p>Al entrar, verás varias listas de eventos: "En Vivo", "Próximos", "Canales 24/7", etc. Simplemente haz clic en la tarjeta del evento o canal que te interese. Al hacerlo, se abrirá un menú con las diferentes opciones de transmisión disponibles para ese evento.</p>
                        <p>Selecciona una de las opciones de transmisión. Una vez que lo hagas, el evento se añadirá automáticamente a tu selección, que puedes ver representada por un número en el botón verde de "Play" (<Play className="inline-block h-4 w-4" />) en la parte superior derecha.</p>
                        <p>Puedes seguir añadiendo eventos o canales hasta un máximo de 9. Verás una marca de verificación verde sobre las tarjetas de los eventos que ya has seleccionado.</p>

                        <h3 className="font-bold text-foreground mt-4">Paso 2: Configurar tu Selección</h3>
                        <p>Antes de empezar a ver, puedes personalizar tu vista. Haz clic en el icono de engranaje (<Settings className="inline-block h-4 w-4" />) para abrir el panel de configuración. Aquí encontrarás varias opciones:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Eventos/Canales Seleccionados:</strong> En este desplegable, verás la lista de todo lo que has añadido. Puedes usar las flechas (<ArrowUp className="inline-block h-4 w-4" /> <ArrowDown className="inline-block h-4 w-4" />) para reordenar las ventanas, el lápiz (<Pencil className="inline-block h-4 w-4" />) para cambiar la opción de transmisión, o el bote de basura (<Trash2 className="inline-block h-4 w-4" />) para eliminar un evento de tu selección.</li>
                            <li><strong>Diseño de Cuadrícula:</strong> Ajusta el espaciado entre las ventanas y cambia el color del borde para una mejor visualización.</li>
                            <li><strong>Funciones Adicionales:</strong> Aquí puedes activar o desactivar el chat en vivo que aparecerá en la pantalla de transmisión.</li>
                        </ul>

                        <h3 className="font-bold text-foreground mt-4">Paso 3: Iniciar la Vista de Transmisión</h3>
                        <p>Cuando tu selección esté lista y configurada a tu gusto, presiona el botón verde de "Play" (<Play className="inline-block h-4 w-4" />). La aplicación pasará a modo de pantalla completa y organizará todas tus selecciones en una cuadrícula para que puedas verlas simultáneamente.</p>
                        <p>Dentro de la vista de transmisión, puedes seguir accediendo al menú de configuración (<Settings className="inline-block h-4 w-4" />) para hacer ajustes en tiempo real, como recargar una ventana específica (<RotateCw className="inline-block h-4 w-4" />) o poner una en pantalla completa (<Maximize className="inline-block h-4 w-4" />).</p>

                        <h3 className="font-bold text-foreground mt-4">Funciones Avanzadas</h3>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Control Remoto (<Airplay className="inline-block h-4 w-4" />):</strong> Permite que otro dispositivo (como tu móvil) controle lo que se ve en la pantalla principal (como tu TV). En la pantalla que quieres controlar, abre el menú de configuración y haz clic en "Activar Control Remoto". En el dispositivo que usarás como control, introduce el código que aparece.</li>
                            <li><strong>Programar Selección (<CalendarDays className="inline-block h-4 w-4" />):</strong> ¿Quieres que una selección específica de partidos de fútbol se active automáticamente el sábado a las 15:00? Con esta función, puedes guardar tu selección actual y programarla para que se cargue a una fecha y hora determinadas.</li>
                            <li><strong>Notificaciones por Correo (<Mail className="inline-block h-4 w-4" />):</strong> Suscríbete para recibir un correo diario con la lista de eventos disponibles, ya sea de todas las categorías o solo de las que te interesan.</li>
                        </ul>
                        <p className="pt-2">¡Eso es todo! Explora, personaliza y disfruta del deporte como nunca antes.</p>
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
                        <p><strong>Deportes para Todos</strong> es una plataforma que funciona como un motor de búsqueda y agregador de contenido multimedia. No alojamos, distribuimos ni transmitimos ningún tipo de material audiovisual por cuenta propia.</p>
                        <p>Nuestro servicio se limita a recopilar y organizar enlaces a transmisiones que están disponibles públicamente en Internet, facilitando a los usuarios el acceso a dicho contenido a través de reproductores de video incrustados (iframes) que provienen de fuentes de terceros.</p>
                        <p>No tenemos control ni responsabilidad sobre la legalidad, calidad, disponibilidad o contenido de las transmisiones de terceros. Los derechos de autor y de transmisión de todo el contenido pertenecen a sus respectivos propietarios y/o difusores. Esta plataforma no se atribuye la propiedad ni los derechos de ninguno de los eventos o canales mostrados.</p>
                        <p>Los logos y marcas comerciales que aparecen en este sitio son propiedad de sus respectivos dueños y se utilizan únicamente con fines identificativos y de referencia, amparados por el derecho de cita.</p>
                        <p>Al utilizar nuestra plataforma, el usuario entiende y acepta que está accediendo a contenido proporcionado por terceros y que <strong>Deportes para Todos</strong> actúa únicamente como un intermediario tecnológico. Cualquier reclamo relacionado con los derechos de autor debe dirigirse a los proveedores de contenido originales que alojan las transmisiones.</p>
                    </div>
                </ScrollArea>
                <DialogFooter>
                    <DialogClose asChild><Button>Entendido</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </>
    );
}
