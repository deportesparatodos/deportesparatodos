
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Loader2, Tv, X, Menu, Search, RotateCw } from 'lucide-react';
import type { Event } from '@/components/event-carousel'; 
import { EventCarousel } from '@/components/event-carousel';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
    DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';
import { EventSelectionDialog } from '@/components/event-selection-dialog';
import { channels } from '@/components/channel-list';
import type { Channel } from '@/components/channel-list';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/event-card';
import { useIsMobile } from '@/hooks/use-is-mobile';


export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const isMobile = useIsMobile(650);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data: Event[] = await response.json();
      
      const processedEvents = data.map(e => ({
        ...e,
        category: e.category.toLowerCase() === 'other' ? 'Otros' : e.category,
        status: e.status ? (e.status.charAt(0).toUpperCase() + e.status.slice(1)) as Event['status'] : 'Desconocido',
      }));

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();

      const storedSelectedEvents = localStorage.getItem('selectedEvents');
      if (storedSelectedEvents) {
        setSelectedEvents(JSON.parse(storedSelectedEvents));
      }
  }, [fetchEvents]);

  useEffect(() => {
    localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
  }, [selectedEvents]);

  const { liveEvents, upcomingEvents, unknownEvents, finishedEvents, filteredChannels, searchResults, allSortedEvents } = useMemo(() => {
    const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Desconocido': 2, 'Próximo': 3, 'Finalizado': 4 };

    const live = events.filter((e) => e.status.toLowerCase() === 'en vivo');
    live.sort((a,b) => {
        const aIsEmbedStream = a.options.some(opt => opt.startsWith('https://embedstreams.top'));
        const bIsEmbedStream = b.options.some(opt => opt.startsWith('https://embedstreams.top'));

        if (aIsEmbedStream && !bIsEmbedStream) return 1;
        if (!aIsEmbedStream && bIsEmbedStream) return -1;
        
        return a.time.localeCompare(b.time);
    });

    const upcoming = events.filter((e) => e.status.toLowerCase() === 'próximo').sort((a,b) => a.time.localeCompare(b.time));
    const unknown = events.filter((e) => e.status.toLowerCase() === 'desconocido').sort((a,b) => a.time.localeCompare(b.time));
    const finished = events.filter((e) => e.status.toLowerCase() === 'finalizado').sort((a,b) => b.time.localeCompare(a.time));
    
    const allSorted = [...live, ...unknown, ...upcoming, ...finished];

    let searchResults: (Event | Channel)[] = [];
    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const filteredEvents = events.filter(e => e.title.toLowerCase().includes(lowercasedFilter));
        const sChannels = channels.filter(c => c.name.toLowerCase().includes(lowercasedFilter));
        
        const combinedResults = [...filteredEvents, ...sChannels];

        combinedResults.sort((a, b) => {
            const statusA = 'status' in a ? (a as Event).status : 'Channel';
            const statusB = 'status' in b ? (b as Event).status : 'Channel';

            const orderA = statusA === 'Channel' ? 5 : (statusOrder[statusA] ?? 6);
            const orderB = statusB === 'Channel' ? 5 : (statusOrder[statusB] ?? 6);

            return orderA - orderB;
        });
        
        searchResults = combinedResults;
    }

    return { 
        liveEvents: live, 
        upcomingEvents: upcoming, 
        unknownEvents: unknown, 
        finishedEvents: finished, 
        filteredChannels: channels,
        searchResults,
        allSortedEvents: allSorted
    };
  }, [events, searchTerm]);


  const categories = useMemo(() => {
      const categorySet = new Set<string>();
      events.forEach((event) => {
        if (event.category) {
            const category = event.category.toLowerCase() === 'other' ? 'Otros' : event.category;
            categorySet.add(category);
        }
      });
      const filteredCategories = Array.from(categorySet).filter(category => 
        events.some(event => (event.category.toLowerCase() === 'other' ? 'Otros' : event.category) === category)
      );
      return filteredCategories;
  }, [events]);

  const handleEventSelect = (event: Event, optionUrl: string) => {
    const newSelectedEvents = [...selectedEvents];
    const eventWithSelection = { ...event, selectedOption: optionUrl };
    
    let targetIndex = -1;
    if (isModification && modificationIndex !== null) {
        targetIndex = modificationIndex;
    } else {
        targetIndex = newSelectedEvents.findIndex(e => e === null);
    }
    
    if (targetIndex !== -1) {
        newSelectedEvents[targetIndex] = eventWithSelection;
        setSelectedEvents(newSelectedEvents);
    } else {
        console.log("All selection slots are full.");
    }
    
    setDialogOpen(false);
    setIsModification(false);
    setModificationIndex(null);
  };
  
  const handleEventRemove = (windowIndex: number) => {
    const newSelectedEvents = [...selectedEvents];
    newSelectedEvents[windowIndex] = null;
    setSelectedEvents(newSelectedEvents);
    setDialogOpen(false);
    setIsModification(false);
    setModificationIndex(null);
  };
  
  const getEventSelection = (event: Event) => {
    const selection = selectedEvents.map((se, i) => se && se.title === event.title ? i : null).filter(i => i !== null);
    if (selection.length > 0) {
      return { isSelected: true, window: selection[0]! + 1 };
    }
    return { isSelected: false, window: null };
  };

  const handleStartView = () => {
    const urls = selectedEvents.map(e => e ? (e as any).selectedOption : '');
    localStorage.setItem('cameraUrls', JSON.stringify(urls));
    localStorage.setItem('numCameras', selectedEvents.filter(Boolean).length.toString());
    router.push('/view');
  };
  
  const openDialogForEvent = (event: Event) => {
    setDialogEvent(event);
    const selection = getEventSelection(event);
    if(selection.isSelected) {
      setIsModification(true);
      setModificationIndex(selection.window! - 1);
    } else {
      setIsModification(false);
      setModificationIndex(selectedEvents.findIndex(e => e === null)); // Target first empty slot
    }
    setDialogOpen(true);
  };

   const handleChannelClick = (channel: Channel) => {
    const channelAsEvent: Event = {
      title: channel.name,
      options: [channel.url],
      buttons: ['Ver canal'],
      time: '',
      category: 'Canal',
      language: '',
      date: '',
      source: '',
      status: 'En Vivo',
      image: channel.logo,
    };
    openDialogForEvent(channelAsEvent);
  };
  
  const openDialogForModification = (event: Event, index: number) => {
    setSheetOpen(false); // Close sheet before opening dialog
    setDialogEvent(event);
    setIsModification(true);
    setModificationIndex(index);
    setDialogOpen(true);
  }

  if (isLoading && events.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
        <header className="sticky top-0 z-30 flex h-[75px] w-full items-center justify-between border-b border-border bg-background/80 px-4 backdrop-blur-sm md:px-8">
            <div className="flex items-center gap-2">
                <Sheet open={sideMenuOpen} onOpenChange={setSideMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Menu />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left">
                        <SheetHeader>
                            <SheetTitle>Menú</SheetTitle>
                        </SheetHeader>
                        <div className="py-4">
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start">Aviso Legal</Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                    <DialogHeader>
                                        <DialogTitle>Descargo de Responsabilidad – Derechos de Autor</DialogTitle>
                                    </DialogHeader>
                                    <ScrollArea className="h-96 pr-6">
                                        <div className="text-sm text-muted-foreground space-y-4">
                                            <p>Deportes para Todos es una plataforma que actúa únicamente como agregador de enlaces embebidos provenientes de terceros. No alojamos, retransmitimos ni manipulamos directamente ninguna señal de audio o video. Todos los contenidos audiovisuales visibles en este sitio están incrustados mediante iframes públicos desde plataformas externas como streamtp3.com, la12hd.com, YouTube, Twitch, OK.ru, entre otras.</p>
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
                                            <p>Nos reservamos el derecho de incluir o remover campañas publicitarias en cualquier momento, y recomendamos a los usuarios consultar la política de privacidad de cada plataforma externa a la que accedan desde este sitio.</p>
                                            <h3 className="font-bold text-foreground">Relación con los dueños del contenido:</h3>
                                            <p>Deportes para Todos no tiene relación alguna con los titulares de los derechos de las transmisiones embebidas, ni con las plataformas que los alojan. Todo el contenido audiovisual visualizado mediante iframes es responsabilidad exclusiva del sitio externo que lo provee.</p>
                                            <h3 className="font-bold text-foreground">Mecanismos de seguridad:</h3>
                                            <p>No se utilizan mecanismos técnicos para eludir bloqueos, restricciones regionales (geobloqueos) ni sistemas de autenticación de las plataformas externas.</p>
                                            <h3 className="font-bold text-foreground">Cookies y datos del usuario:</h3>
                                            <p>Este sitio puede utilizar cookies de terceros para ofrecer una mejor experiencia de usuario, realizar estadísticas anónimas de uso o mostrar anuncios relevantes. Al navegar por Deportes para Todos usted acepta este uso de cookies. Recomendamos consultar las políticas de privacidad de los servicios externos vinculados a este sitio.</p>
                                            <p>El contenido patrocinado relacionado con plataformas de iGaming está destinado únicamente a usuarios mayores de 18 años. Deportes para Todos no se responsabiliza por el acceso a dichas plataformas por parte de menores de edad.</p>
                                            <p>This Site is affiliated with Monumetric (dba for The Blogger Network, LLC) for the purposes of placing advertising on the Site, and Monumetric will collect and use certain data for advertising purposes. To learn more about Monumetric’s data usage, click here: <a href="https://www.monumetric.com/publisher-advertising-privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-primary underline">Publisher Advertising Privacy</a></p>
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
                                        <DialogClose asChild>
                                            <Button>Cerrar</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </SheetContent>
                </Sheet>

                <Link href="/" className="shrink-0">
                    <Image
                        src="https://i.ibb.co/gZKpR4fc/deportes-para-todos.png"
                        alt="Deportes Para Todos Logo"
                        width={150}
                        height={37.5}
                        priority
                        data-ai-hint="logo"
                        className="my-[18.75px]"
                    />
                </Link>
            </div>

            <div className="flex items-center gap-2">
                <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                    <SheetTrigger asChild>
                         <Button
                            variant="outline"
                            disabled={selectedEvents.filter(Boolean).length === 0}
                        >
                            <Menu className="mr-2 h-4 w-4" />
                            Eventos Seleccionados
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>Tus Eventos Seleccionados</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="h-[calc(100%-4rem)] mt-4">
                            <div className="space-y-4 pr-4">
                                {selectedEvents.map((event, index) => event && (
                                     <div key={index} className="flex items-center gap-4 cursor-pointer" onClick={() => openDialogForModification(event, index)}>
                                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                                            {index + 1}
                                        </div>
                                        <div className="relative w-28 h-auto aspect-video rounded-md overflow-hidden">
                                             <Image
                                                src={event.image || 'https://i.ibb.co/dHPWxr8/depete.jpg'}
                                                alt={event.title}
                                                width={160}
                                                height={90}
                                                className="object-cover"
                                                onError={(e) => {
                                                  const target = e.target as HTMLImageElement;
                                                  target.onerror = null; 
                                                  target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                                                }}
                                            />
                                        </div>
                                        <p className="text-sm font-semibold flex-grow truncate">{event.title}</p>
                                    </div>
                                ))}
                                {selectedEvents.filter(Boolean).length === 0 && (
                                    <p className="text-muted-foreground text-center pt-8">No has seleccionado ningún evento.</p>
                                )}
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
                 <Button
                    onClick={handleStartView}
                    disabled={selectedEvents.filter(Boolean).length === 0}
                    className="bg-green-600 hover:bg-green-700 text-white my-[10px]"
                >
                    <Tv className="mr-2 h-4 w-4" />
                    Iniciar Vista ({selectedEvents.filter(Boolean).length})
                </Button>
            </div>
        </header>

        <main className="flex-grow overflow-y-auto p-4 md:p-8">
            <div className="space-y-2">
                <div className="w-full">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                            type="text"
                            placeholder="Buscar evento o canal..."
                            className="w-full pl-10 pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={fetchEvents}>
                             <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                {searchTerm ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 pt-4">
                        {searchResults.map((item, index) => {
                            if ('url' in item) { // It's a Channel
                                return (
                                    <Card 
                                        key={`search-channel-${index}`}
                                        className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border h-[150px] flex flex-col"
                                        onClick={() => handleChannelClick(item as Channel)}
                                    >
                                        <div className="relative w-full flex-grow flex items-center justify-center p-4 bg-white/10">
                                            <Image
                                                src={(item as Channel).logo}
                                                alt={`${(item as Channel).name} logo`}
                                                width={120}
                                                height={67.5}
                                                className="object-contain max-h-full max-w-full"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.onerror = null; 
                                                    target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                                                }}
                                            />
                                        </div>
                                        <div className="p-3 bg-card">
                                            <h3 className="font-bold truncate text-sm text-center">{(item as Channel).name}</h3>
                                        </div>
                                    </Card>
                                );
                            } else { // It's an Event
                                return (
                                    <EventCard
                                      key={`search-event-${index}`}
                                      event={item as Event}
                                      selection={getEventSelection(item as Event)}
                                      onClick={() => openDialogForEvent(item as Event)}
                                    />
                                );
                            }
                        })}
                    </div>
                ) : (
                    <>
                        <div className="w-full pt-1 pb-1">
                             <Carousel
                                opts={{
                                align: "start",
                                dragFree: true,
                                }}
                                className="w-full relative px-12"
                            >
                                <CarouselContent className="-ml-4 my-[5px]">
                                    <CarouselItem className="basis-auto pl-4">
                                        <Link href={`/events/live`}>
                                            <Button variant="secondary" className="h-12 px-6 text-lg">
                                                En Vivo
                                            </Button>
                                        </Link>
                                    </CarouselItem>
                                     <CarouselItem className="basis-auto pl-4">
                                        <Link href={`/events/channels`}>
                                            <Button variant="secondary" className="h-12 px-6 text-lg">
                                                Canales
                                            </Button>
                                        </Link>
                                    </CarouselItem>
                                {categories.map((category) => (
                                    <CarouselItem key={category} className="basis-auto pl-4">
                                        <Link href={`/category/${encodeURIComponent(category.toLowerCase().replace(/ /g, '-'))}`}>
                                            <Button variant="secondary" className="h-12 px-6 text-lg">
                                                {category}
                                            </Button>
                                        </Link>
                                    </CarouselItem>
                                ))}
                                </CarouselContent>
                                <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
                                <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
                            </Carousel>
                        </div>
                        
                        {isMobile ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 pt-4">
                                {allSortedEvents.map((event, index) => (
                                    <EventCard
                                        key={`mobile-event-${index}`}
                                        event={event}
                                        selection={getEventSelection(event)}
                                        onClick={() => openDialogForEvent(event)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <>
                                <EventCarousel title="En Vivo" events={liveEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                                <EventCarousel title="Canales" channels={filteredChannels} onChannelClick={handleChannelClick} />
                                <EventCarousel title="Próximos" events={upcomingEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                                <EventCarousel title="Estado Desconocido" events={unknownEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                                <EventCarousel title="Finalizados" events={finishedEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                            </>
                        )}
                    </>
                )}
            </div>
        </main>
        
        {dialogEvent && (
            <EventSelectionDialog
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                event={dialogEvent}
                onSelect={handleEventSelect}
                isModification={isModification}
                onRemove={() => handleEventRemove(modificationIndex!)}
                windowNumber={(modificationIndex ?? selectedEvents.findIndex(e => e === null))! + 1}
            />
        )}
    </div>
  );
}
