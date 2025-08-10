

'use client';

import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button, buttonVariants } from '@/components/ui/button';
import { ArrowUp, ArrowDown, RotateCw, Trash2, Plus, RefreshCcw, Pencil, CalendarClock, BellRing, MessageSquare, Airplay, Loader2, Play, Maximize, Minimize, FileText, AlertCircle, BookOpen, Mail, CalendarDays, Settings } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from './ui/dialog';
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
  remoteControlMode?: 'inactive' | 'controlling' | 'controlled';
  onPlayClick?: (index: number) => void;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  onRestoreGridSettings: () => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  onOpenChat?: () => void;
  onStartControlledSession?: () => void;
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
}: Omit<EventListManagementProps, 'onAddEvent' | 'onSchedule' | 'onNotificationManager' | 'remoteControlMode' | 'onPlayClick' | 'gridGap' | 'onGridGapChange' | 'borderColor' | 'onBorderColorChange' | 'isChatEnabled' | 'onIsChatEnabledChange' | 'onRestoreGridSettings' | 'onStartControlledSession' | 'categories'>) {
    
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

// --- Client-side component to build the webcal:// link ---
const CalendarLink = ({ category, children }: { category?: string; children: React.ReactNode }) => {
  const [href, setHref] = useState('');

  useEffect(() => {
    // This runs only on the client
    const protocol = 'webcal://';
    const host = window.location.host;
    const path = category 
      ? `/api/calendar?category=${encodeURIComponent(category)}`
      : '/api/calendar';
    
    // Replace http/https from host if it's there from some SSR frameworks
    const cleanHost = host.replace(/^https?:\/\//, '');

    setHref(`${protocol}${cleanHost}${path}`);
  }, [category]);

  if (!href) {
    // Render a disabled or placeholder button on the server or before hydration
    return (
        <Button variant="secondary" className="w-full justify-start gap-2" disabled>
            {children}
        </Button>
    );
  }

  return (
    <a href={href} className={cn(buttonVariants({ variant: "secondary" }), "w-full justify-start gap-2")}>
        {children}
    </a>
  );
};

const CalendarDialogContent = ({ categories }: { categories: string[] }) => {
  return (
    <DialogContent>
        <DialogHeader>
            <DialogTitle>Suscripción a Calendario</DialogTitle>
            <DialogDescription>
                Elige una categoría para suscribirte. Tu calendario se actualizará automáticamente.
            </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-72">
            <div className="p-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                <CalendarLink>
                    Todos los Eventos
                </CalendarLink>
                {categories.filter(c => c.toLowerCase() !== '24/7').map(category => (
                    <CalendarLink key={category} category={category}>
                        {category}
                    </CalendarLink>
                ))}
            </div>
        </ScrollArea>
    </DialogContent>
  );
};

function HomePageMenu({ eventProps }: { eventProps: EventListManagementProps }) {
  const { 
    gridGap, onGridGapChange, 
    borderColor, onBorderColorChange,
    onRestoreGridSettings,
    isChatEnabled, onIsChatEnabledChange,
    onNotificationManager,
    categories
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
          <EventList {...eventProps} />
           {eventProps.onAddEvent && (
            <Button variant="outline" className="w-full mt-4 flex-shrink-0" onClick={eventProps.onAddEvent}>
                <Plus className="mr-2 h-4 w-4" />
                Añadir Evento/Canal
            </Button>
           )}
        </AccordionContent>
      </AccordionItem>
      <Separator className="my-4"/>
      <div className="space-y-2">
          <Dialog>
              <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                      <BookOpen />
                      Tutorial
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                  <DialogHeader>
                      <DialogTitle>Tutorial de Uso</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96 pr-6">
                      <div className="text-sm text-muted-foreground space-y-4">
                          <p>¡Bienvenido a <strong>Deportes para Todos</strong>! Esta guía detallada te enseñará a usar la plataforma como un experto para que no te pierdas ni un segundo de tus eventos deportivos favoritos.</p>
                          
                          <h3 className="font-bold text-foreground mt-6">1. Entendiendo la Pantalla Principal</h3>
                          <p>La página de inicio es tu centro de comando. Aquí encontrarás todo el contenido organizado para un acceso rápido y sencillo.</p>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Barra Superior:</strong> Aquí se encuentra el logo, la barra de búsqueda (icono de lupa) y los botones de configuración y de inicio de transmisión.</li>
                              <li><strong>Categorías:</strong> Un carrusel horizontal que te permite filtrar el contenido. Puedes deslizarte para ver categorías como "En Vivo", "Fútbol", "Baloncesto", "Canales", etc. Al hacer clic en una, la página mostrará solo el contenido de esa categoría.</li>
                              <li><strong>Carruseles de Eventos:</strong> (En vista de escritorio) El contenido está agrupado en filas por estado: "En Vivo", "Próximos", "Canales 24/7", etc. Puedes deslizar cada carrusel para explorar los eventos.</li>
                              <li><strong>Tarjetas de Eventos/Canales:</strong> Cada tarjeta representa un partido, carrera o canal. Muestra información clave como el nombre del evento, la hora y un indicador de estado (ej: "En Vivo" en rojo, "Próximo" en gris").</li>
                          </ul>

                          <h3 className="font-bold text-foreground mt-6">2. Cómo Seleccionar un Evento para Ver</h3>
                          <p>Este es el paso fundamental para construir tu vista múltiple.</p>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Haz clic en una Tarjeta:</strong> Cuando encuentres un evento o canal que te interese, simplemente haz clic en su tarjeta.</li>
                              <li><strong>Elige una Opción de Transmisión:</strong> Se abrirá una ventana emergente (diálogo) con uno o más botones. Cada botón representa una fuente o calidad de transmisión diferente (ej: "Opción 1", "Opción 2"). <br/>
                              <span className="text-xs italic"><strong>Consejo:</strong> Si una opción no funciona, puedes volver a esta ventana y probar otra.</span></li>
                              <li><strong>Asignación Automática a Ventana:</strong> Al seleccionar una opción, el evento se asigna automáticamente a la primera "ventana" de visualización disponible (tienes hasta 9). Verás que la tarjeta del evento en la página principal ahora muestra un número, indicando en qué ventana se verá.</li>
                          </ul>

                          <h3 className="font-bold text-foreground mt-6">3. Gestiona tu Selección Personalizada</h3>
                          <p>Una vez que has elegido uno o más eventos, puedes gestionarlos desde el panel de configuración.</p>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Botón de Configuración (icono de engranaje <Settings className="inline-block h-4 w-4" />):</strong> Ubicado en la esquina superior derecha, este botón abre un panel donde puedes ver y administrar todos los eventos que has seleccionado.</li>
                              <li><strong>Dentro del Panel:</strong> Cada evento seleccionado aparece en una lista. Aquí puedes:
                                  <ul className="list-disc pl-6 mt-1">
                                      <li><strong>Reordenar:</strong> Usa las flechas hacia arriba y abajo para cambiar la posición de los eventos en la cuadrícula de visualización.</li>
                                      <li><strong>Modificar:</strong> Haz clic en el icono del lápiz (<Pencil className="inline-block h-4 w-4" />) para volver a abrir el diálogo de opciones y cambiar la fuente de transmisión sin tener que eliminar el evento.</li>
                                      <li><strong>Eliminar:</strong> Haz clic en el icono de la papelera (<Trash2 className="inline-block h-4 w-4" />) para quitar un evento de tu selección y liberar esa ventana.</li>
                                  </ul>
                              </li>
                          </ul>

                          <h3 className="font-bold text-foreground mt-6">4. ¡A Disfrutar! Iniciar la Vista Múltiple</h3>
                          <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Botón de "Play" (<Play className="inline-block h-4 w-4" />):</strong> Este es el botón más importante. Una vez que hayas seleccionado al menos un evento, este botón (ubicado en la esquina superior derecha) se activará. Haz clic en él para ir a la pantalla de visualización.</li>
                              <li><strong>La Magia de la Cuadrícula Dinámica:</strong> La pantalla de visualización se dividirá automáticamente para mostrar todos los eventos que seleccionaste. La cuadrícula se adapta de forma inteligente: si eliges 2 eventos, verás 2 ventanas; si eliges 4, verás una cuadrícula de 2x2, y así hasta 9.</li>
                          </ul>
                      </div>
                  </ScrollArea>
                  <DialogFooter>
                      <DialogClose asChild><Button>Entendido</Button></DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
           <Dialog>
              <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                      <AlertCircle />
                      Errores y Soluciones
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                  <DialogHeader>
                      <DialogTitle>Solución de Errores Comunes</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96 pr-6">
                      <div className="text-sm text-muted-foreground space-y-4">
                          <p>A continuación, te presentamos una guía detallada para resolver los problemas más frecuentes que podrías encontrar al intentar reproducir videos. Sigue estos pasos en orden para maximizar las chances de éxito.</p>
                          <h3 className="font-bold text-foreground">1. Configurar un DNS público (Cloudflare o Google)</h3>
                          <p><span className="font-semibold text-foreground">El Problema:</span> Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios o servidores de video a través de su DNS. Esto provoca que el video nunca cargue y veas una pantalla en negro o un error de conexión.</p>
                          <p><span className="font-semibold text-foreground">La Solución:</span> Cambiar el DNS de tu dispositivo o router a uno público como el de Cloudflare (<a href="https://one.one.one.one" target="_blank" rel="noopener noreferrer" className="text-primary underline">1.1.1.1</a>) o Google (8.8.8.8) puede saltarse estas restricciones. Estos servicios son gratuitos, rápidos y respetan tu privacidad. Este es el método más efectivo y soluciona la mayoría de los casos.</p>
                          <h3 className="font-bold text-foreground">2. Instalar una Extensión de Reproductor de Video</h3>
                          <p><span className="font-semibold text-foreground">El Problema:</span> Algunos streams de video utilizan formatos modernos como M3U8 o MPD que no todos los navegadores soportan de forma nativa. Si el navegador no sabe cómo "leer" el formato, el video no se reproducirá.</p>
                          <p><span className="font-semibold text-foreground">La Solución:</span> Instalar una extensión como "<a href="https://chromewebstore.google.com/detail/reproductor-mpdm3u8m3uepg/opmeopcambhfimffbomjgemehjkbbmji?hl=es" target="_blank" rel="noopener noreferrer" className="text-primary underline">Reproductor MPD/M3U8/M3U/EPG</a>" (para Chrome/Edge) le da a tu navegador las herramientas necesarias para decodificar y reproducir estos formatos.</p>
                          <h3 className="font-bold text-foreground">3. Cambiar de Navegador</h3>
                          <p><span className="font-semibold text-foreground">El Problema:</span> A veces, las configuraciones específicas de un navegador, una actualización reciente o una extensión conflictiva pueden impedir la reproducción.</p>
                          <p><span className="font-semibold text-foreground">La Solución:</span> Probar con un navegador diferente es una forma rápida de descartar problemas locales. Recomendamos usar las versiones más recientes de Google Chrome, Mozilla Firefox o Microsoft Edge.</p>
                          <h3 className="font-bold text-foreground">4. Desactivar Bloqueadores de Anuncios (Adblockers)</h3>
                          <p><span className="font-semibold text-foreground">El Problema:</span> Los bloqueadores de anuncios son muy útiles, pero a veces pueden ser demasiado agresivos. Pueden bloquear no solo los anuncios, sino también los scripts o reproductores de video necesarios para que la transmisión funcione.</p>
                          <p><span className="font-semibold text-foreground">La Solución:</span> Intenta desactivar tu Adblocker (como AdBlock, uBlock Origin, etc.) temporalmente para este sitio web. Recarga la página después de desactivarlo.</p>
                          <h3 className="font-bold text-foreground">5. Optimizar para Escritorio</h3>
                          <p><span className="font-semibold text-foreground">El Problema:</span> La aplicación está diseñada y optimizada para la experiencia en una computadora de escritorio o portátil. Los dispositivos móviles (celulares, tabletas) tienen limitaciones de hardware y software que pueden causar errores de reproducción o problemas de rendimiento.</p>
                          <p><span className="font-semibold text-foreground">La Solución:</span> Para una experiencia más estable y fluida, recomendamos encarecidamente usar la plataforma en una computadora.</p>
                          <h3 className="font-bold text-foreground">6. Reiniciar el Dispositivo y la Red</h3>
                          <p><span className="font-semibold text-foreground">El Problema:</span> Problemas temporales de software, caché acumulada o fallos en la conexión de red pueden impedir que el contenido cargue correctamente.</p>
                          <p><span className="font-semibold text-foreground">La Solución:</span> El clásico "apagar y volver a encender".</p>
                      </div>
                  </ScrollArea>
                  <DialogFooter>
                      <DialogClose asChild><Button>Entendido</Button></DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
           <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { if(onNotificationManager) onNotificationManager(); }}>
              <BellRing />
              Notificaciones
          </Button>
          <Dialog>
              <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                      <CalendarDays />
                      Añadir a Calendario
                  </Button>
              </DialogTrigger>
              <CalendarDialogContent categories={categories} />
          </Dialog>
          <Dialog>
              <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                      <Mail />
                      Contacto
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                  <DialogHeader>
                      <DialogTitle>Contacto</DialogTitle>
                  </DialogHeader>
                  <div className="text-sm text-muted-foreground py-4">
                      <p>¿Tienes alguna sugerencia o encontraste un error? ¡Tu opinión nos ayuda a mejorar! Comunícate con nosotros para reportar fallos, enlaces incorrectos o proponer nuevos canales a deportesparatodosvercel@gmail.com.</p>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button variant={'outline'}>Cerrar</Button>
                      </DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
          <Dialog>
              <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start gap-2">
                      <FileText />
                      Aviso Legal
                  </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                  <DialogHeader>
                      <DialogTitle>Descargo de Responsabilidad – Derechos de Autor</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="h-96 pr-6">
                      <div className="text-sm text-muted-foreground space-y-4">
                          <p>Deportes para Todos es una plataforma que actúa únicamente como agregador de enlaces embebidos provenientes de terceros. No alojamos, retransmitimos ni manipulamos directamente ninguna señal de audio o video. Todos los contenidos audiovisuales visibles en este sitio están incrustrados mediante iframes públicos desde plataformas externas como streamtp3.com, la12hd.com, YouTube, Twitch, OK.ru, entre otras.</p>
                          <p>No participamos en la creación, alteración ni distribución de dichas señales, y no somos responsables de la legalidad de los contenidos a los que se accede a través de estos terceros. Cualquier infracción potencial corresponde a dichos proveedores externos.</p>
                          <h3 className="font-bold text-foreground">Sobre la legalidad y responsabilidad de terceros:</h3>
                          <p>Existen antecedentes de sitios sancionados por alojar y retransmitir directamente contenido con derechos de autor. En contraste, Deportes para Todos no aloja señales ni transmite contenido, y se limita exclusivamente a insertar enlaces públicos de terceros mediante código iframe. No participamos en la obtención ni distribución del contenido audiovisual y no tenemos control sobre su disponibilidad o legalidad.</p>
                          <h3 className="font-bold text-foreground">Uso de marcas y logos:</h3>
                          <p>Todas las marcas, nombres comerciales, logotipos o imágenes presentes en el sitio son propiedad de sus respectivos dueños. En Deportes para Todos se utilizan exclusivamente con fines informativos o ilustrativos, respetando el derecho de cita previsto por el Artículo 32 de la Ley 11.723 de Propiedad Intelectual de Argentina.</p>
                          <h3 className="font-bold text-foreground">Legislación aplicable:</h3>
                          <p>Este sitio opera bajo las leyes de la República Argentina. El mero hecho de insertar un iframe público no configura, por sí solo, un delito conforme al derecho argentino, siempre que no se participe en la obtención o manipulación del contenido protegido.</p>
                          <h3 className="font-bold text-foreground">Uso personal y responsabilidad del usuario:</h3>
                          <p>El acceso a esta página se realiza bajo responsabilidad del usuario. Si en tu país este tipo de contenido se encuentra restringido, es tu obligación cumplir con las leyes locales. No nos responsabilizamos por el uso indebido o ilegal de los enlaces por parte de los visitantes.</p>
                          <h3 className="font-bold text-foreground">Sobre el uso de subdominios:</h3>
                          <p>Deportes para Todos utiliza subdominios como https://www.google.com/search?q=gh.deportesparatodos.com con fines exclusivamente organizativos y técnicos, para centralizar y facilitar el acceso a iframes de terceros. Estos subdominios no almacenan, manipulan ni retransmiten contenido audiovisual, sino que actúan como una ventana hacia los streams originales disponibles públicamente en sitios como streamtp3.com, la12hd.com y otros. En ningún caso se modifica la fuente original ni se interviene en el contenido emitido por dichos terceros.</p>
                          <h3 className="font-bold text-foreground">Sobre la experiencia del usuario:</h3>
                          <p>Deportes para Todos puede aplicar medidas para mejorar la experiencia de navegación, como la reducción de anuncios emergentes o contenido intrusivo de terceros. Estas medidas no interfieren con el contenido audiovisual transmitido dentro de los reproductores embebidos, ni modifican las señales originales. Cualquier bloqueo se limita a elementos externos ajenos a la emisión en sí.</p>
                          <h3 className="font-bold text-foreground">Monetización, publicidad y patrocinadores</h3>
                          <p>Deportes para Todos puede exhibir anuncios publicitarios proporcionados por plataformas de monetización de terceros (como Monetag) y/o incluir contenido patrocinado de empresas vinculadas al sector iGaming (casas de apuestas, juegos online y plataformas similares).</p>
                          <p>Estos ingresos publicitarios permiten el mantenimiento del sitio, pero no están directamente vinculados al contenido embebido ni implican relación comercial con las plataformas desde las cuales se obtiene dicho contenido.</p>
                          <p>Deportes para Todos no gestiona ni opera plataformas de apuestas, ni aloja contenido audiovisual, y no obtiene beneficios económicos derivados de la transmisión de señales protegidas. Toda la monetización se genera por el tráfico general del sitio, independientemente del contenido de terceros que se pueda visualizar mediante iframes.</p>
                          <p>Los contenidos promocionados, ya sea por publicidad programática o acuerdos de patrocinio, se presentan conforme a la legislación vigente y no representan un respaldo o relación directa con los titulares de los derechos de las transmisiones que pudieran visualizarse mediante terceros.</p>
                          <p>The Blogger Network, LLC) for the purposes of placing advertising on the Site, and Monumetric will collect and use certain data for advertising purposes. To learn more about Monumetric’s data usage, click here: <a href="https://www.monumetric.com/publisher-advertising-privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Publisher Advertising Privacy</a></p>
                          <h3 className="font-bold text-foreground">Notificaciones de derechos de autor:</h3>
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
                          <p className="font-bold">Al utilizar este sitio web, usted declara haber leído, comprendido y aceptado este descargo de responsabilidad en su totalidad.</p>
                      </div>
                  </ScrollArea>
                  <DialogFooter>
                      <DialogClose asChild><Button>Cerrar</Button></DialogClose>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      </div>
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
                        />
                        <Input
                            type="text"
                            value={eventProps.borderColor}
                            onChange={(e) => eventProps.onBorderColorChange(e.target.value)}
                            placeholder="#000000"
                            className="flex-grow"
                        />
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={eventProps.onRestoreGridSettings} className="w-full">
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
