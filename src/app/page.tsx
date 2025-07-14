
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Tv, X, Search, RotateCw, FileText, AlertCircle, Mail, BookOpen, Play, Settings, Menu, ArrowLeft } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { EventSelectionDialog } from '@/components/event-selection-dialog';
import { channels } from '@/components/channel-list';
import type { Channel } from '@/components/channel-list';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/event-card';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Badge } from '@/components/ui/badge';
import { LayoutConfigurator } from '@/components/layout-configurator';
import { toZonedTime, format } from 'date-fns-tz';
import { addHours, isBefore, isAfter, parse } from 'date-fns';


export default function HomePage() {
  const router = useRouter();

  const [events, setEvents] = useState<Event[]>([]);
  const [ppvEvents, setPpvEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const isMobile = useIsMobile(650);
  
  const [gridGap, setGridGap] = useState<number>(2);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  
  const [currentView, setCurrentView] = useState<string>('home'); // home, live, channels, or category name

  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);

  const fetchPpvEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/ppv', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch PPV events');
      }
      const data = await response.json();
      
      const transformedEvents: Event[] = [];
      if (data.success && data.streams) {
        data.streams.forEach((category: any) => {
          if (category.streams) {
            category.streams.forEach((stream: any) => {
               const startTime = new Date(stream.starts_at * 1000);
               const now = new Date();
               
               let status: Event['status'] = 'Próximo';
               if (stream.always_live === 1) {
                   status = 'En Vivo';
               } else if (stream.starts_at > 0) {
                   const endTime = new Date(stream.ends_at * 1000);
                   if (now >= startTime && now <= endTime) {
                       status = 'En Vivo';
                   } else if (now > endTime) {
                       status = 'Finalizado';
                   }
               } else {
                   status = 'Desconocido';
               }
               
               if (status === 'Próximo') {
                  status = 'Desconocido';
               }


              transformedEvents.push({
                title: stream.name,
                time: stream.starts_at > 0 ? format(toZonedTime(startTime, 'America/Argentina/Buenos_Aires'), 'HH:mm') : '24/7',
                options: [stream.iframe],
                buttons: [stream.tag || 'Ver Stream'],
                category: stream.category_name,
                language: '', 
                date: stream.starts_at > 0 ? startTime.toLocaleDateString() : '',
                source: 'ppvs.su',
                image: stream.poster,
                status: status,
              });
            });
          }
        });
      }
      setPpvEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching PPV events:', error);
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/events', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      const data: Event[] = await response.json();
      
      const timeZone = 'America/Argentina/Buenos_Aires';
      const nowInBA = toZonedTime(new Date(), timeZone);

      const processedEvents = data.map(e => {
        let currentStatus: Event['status'] = e.status 
            ? (e.status.charAt(0).toUpperCase() + e.status.slice(1)) as Event['status']
            : 'Desconocido';
        
        // New logic to determine status if a valid time is present
        if (/^\d{2}:\d{2}$/.test(e.time)) {
             try {
                const eventTimeToday = parse(e.time, 'HH:mm', nowInBA);
                const eventEndTime = addHours(eventTimeToday, 3);
                
                if (isBefore(nowInBA, eventTimeToday)) {
                    currentStatus = 'Próximo';
                } else if (isAfter(nowInBA, eventTimeToday) && isBefore(nowInBA, eventEndTime)) {
                    currentStatus = 'En Vivo';
                } else if (isAfter(nowInBA, eventEndTime)) {
                    currentStatus = 'Finalizado';
                }
             } catch (error) {
                console.error("Error parsing date for event:", e.title, error);
                // If parsing fails, leave status as is or default to Desconocido
                currentStatus = 'Desconocido';
             }
        } else {
            // If no valid time, status from API is used, or defaults to Desconocido
            if (!['en vivo', 'próximo', 'finalizado'].includes(e.status.toLowerCase())) {
              currentStatus = 'Desconocido';
            }
        }

        return {
          ...e,
          category: e.category.toLowerCase() === 'other' ? 'Otros' : e.category,
          status: currentStatus
        };
      });

      setEvents(processedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load state from localStorage once on initial mount
  useEffect(() => {
    const storedSelectedEvents = localStorage.getItem('selectedEvents');
    if (storedSelectedEvents) {
      try {
          const parsedEvents = JSON.parse(storedSelectedEvents);
          if(Array.isArray(parsedEvents)) {
              const validEvents = parsedEvents.filter(Boolean);
              const newSelectedEvents = Array(9).fill(null);
              validEvents.slice(0, 9).forEach((event, i) => {
                  newSelectedEvents[i] = event;
              });
              setSelectedEvents(newSelectedEvents);
          }
      } catch (e) { console.error("Failed to parse selectedEvents from localStorage", e); }
    }
     const storedViewOrder = localStorage.getItem('viewOrder');
    if (storedViewOrder) {
      try {
          const parsedOrder = JSON.parse(storedViewOrder);
          if(Array.isArray(parsedOrder) && parsedOrder.length === 9) {
              setViewOrder(parsedOrder);
          }
      } catch(e) { console.error("Failed to parse viewOrder from localStorage", e); }
    }
    const storedGap = localStorage.getItem('gridGap');
    if (storedGap) setGridGap(parseInt(storedGap, 10));

    const storedBorderColor = localStorage.getItem('borderColor');
    if (storedBorderColor) setBorderColor(storedBorderColor);

    const storedChatEnabled = localStorage.getItem('isChatEnabled');
    if (storedChatEnabled) setIsChatEnabled(JSON.parse(storedChatEnabled));
    
    setIsInitialLoadDone(true);
  }, []);

  // Fetch event data
  useEffect(() => {
    fetchEvents();
    fetchPpvEvents();
  }, [fetchEvents, fetchPpvEvents]);

  // Persist selectedEvents to localStorage
  useEffect(() => {
    if (isInitialLoadDone) {
        localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
    }
  }, [selectedEvents, isInitialLoadDone]); 
  
  // Persist viewOrder to localStorage
  useEffect(() => {
    if (isInitialLoadDone) {
      const activeEventIndexes = selectedEvents.map((e, i) => e ? i : -1).filter(i => i !== -1);
      const currentOrderActive = viewOrder.filter(i => activeEventIndexes.includes(i));
      
      const activeOrderChanged = JSON.stringify(currentOrderActive) !== JSON.stringify(viewOrder.filter(i => selectedEvents[i] !== null));

      if (activeOrderChanged) {
          const newOrder = [...currentOrderActive];
          for (let i = 0; i < 9; i++) {
              if (!newOrder.includes(i)) {
                  newOrder.push(i);
              }
          }
          
          const stringifiedNewOrder = JSON.stringify(newOrder);
          if (stringifiedNewOrder !== localStorage.getItem('viewOrder')) {
              setViewOrder(newOrder);
              localStorage.setItem('viewOrder', stringifiedNewOrder);
          }
      } else {
        localStorage.setItem('viewOrder', JSON.stringify(viewOrder));
      }
    }
  }, [selectedEvents, viewOrder, isInitialLoadDone]);

  const handleOrderChange = (newOrder: number[]) => {
    const fullNewOrder = [...newOrder];
    const presentIndexes = new Set(newOrder);
    for(let i=0; i<9; i++) {
        if(!presentIndexes.has(i)) {
            fullNewOrder.push(i);
        }
    }
    setViewOrder(fullNewOrder);
    localStorage.setItem('viewOrder', JSON.stringify(fullNewOrder));
  };


  const { liveEvents, upcomingEvents, unknownEvents, finishedEvents, channels247, allChannels, searchResults, allSortedEvents, categoryFilteredEvents } = useMemo(() => {
    const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2, 'Desconocido': 3, 'Finalizado': 4 };
    
    const combinedEvents = [...events, ...ppvEvents];
    
    const isKoreanCentralTv = (e: Event) => e.title.toLowerCase().includes('korean central television');
    
    const channels247 = combinedEvents.filter(e => e.title.toLowerCase().includes('24/7') || isKoreanCentralTv(e));
    const otherEvents = combinedEvents.filter(e => !e.title.toLowerCase().includes('24/7') && !isKoreanCentralTv(e));

    const placeholderImage = 'https://i.ibb.co/dHPWxr8/depete.jpg';
    
    const sortLogic = (a: Event, b: Event) => {
      const orderA = statusOrder[a.status] ?? 99;
      const orderB = statusOrder[b.status] ?? 99;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.time.localeCompare(b.time);
    };

    const liveSortLogic = (a: Event, b: Event) => {
      const aHasImage = a.image && a.image !== placeholderImage;
      const bHasImage = b.image && b.image !== placeholderImage;

      if (aHasImage && !bHasImage) return -1;
      if (!aHasImage && bHasImage) return 1;
      
      return a.time.localeCompare(b.time);
    };

    const live = otherEvents.filter((e) => e.status.toLowerCase() === 'en vivo').sort(liveSortLogic);
    const upcoming = otherEvents.filter((e) => e.status.toLowerCase() === 'próximo').sort(sortLogic);
    const unknown = otherEvents.filter((e) => e.status.toLowerCase() === 'desconocido').sort(sortLogic);
    const finishedEvents = otherEvents.filter((e) => e.status.toLowerCase() === 'finalizado').sort((a,b) => b.time.localeCompare(a.time));
    
    const allSorted = [...live, ...upcoming, ...channels247, ...unknown, ...finishedEvents];

    let searchResults: (Event | Channel)[] = [];
    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const eventsSource = currentView === 'home' || currentView === 'channels' || currentView === 'live'
            ? combinedEvents
            : combinedEvents.filter(e => e.category.toLowerCase() === currentView.toLowerCase());
            
        const filteredEvents = eventsSource.filter(e => e.title.toLowerCase().includes(lowercasedFilter));
        const sChannels = (currentView === 'home' || currentView === 'channels') ? channels.filter(c => c.name.toLowerCase().includes(lowercasedFilter)) : [];
        
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

    let categoryFilteredEvents: Event[] = [];
    if (currentView !== 'home' && currentView !== 'channels' && currentView !== 'live') {
        const categoryEvents = combinedEvents
            .filter(event => event.category.toLowerCase() === currentView.toLowerCase());
        
        const live = categoryEvents.filter(e => e.status === 'En Vivo').sort(sortLogic);
        const upcoming = categoryEvents.filter(e => e.status === 'Próximo').sort(sortLogic);
        const unknown = categoryEvents.filter(e => e.status === 'Desconocido').sort(sortLogic);
        const finished = categoryEvents.filter(e => e.status === 'Finalizado').sort(sortLogic);

        categoryFilteredEvents = [...live, ...upcoming, ...unknown, ...finished];
    }

    return { 
        liveEvents: live, 
        upcomingEvents: upcoming, 
        unknownEvents: unknown, 
        finishedEvents,
        channels247,
        allChannels: channels,
        searchResults,
        allSortedEvents: allSorted,
        categoryFilteredEvents
    };
  }, [events, ppvEvents, searchTerm, currentView]);


  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    [...events, ...ppvEvents].forEach((event) => {
        if (event.category) {
            const category = event.category.toLowerCase() === 'other' ? 'Otros' : event.category;
            categorySet.add(category);
        }
    });

    const allCategories = Array.from(categorySet);
    const otrosCategory = allCategories.find(c => c.toLowerCase() === 'otros');
    const otherCategories = allCategories.filter(c => c.toLowerCase() !== 'otros').sort((a, b) => a.localeCompare(b));

    const sortedCategories = [...otherCategories];
    if (otrosCategory) {
        sortedCategories.push(otrosCategory);
    }

    return sortedCategories;
  }, [events, ppvEvents]);


  const handleEventSelect = (event: Event, optionUrl: string) => {
    const eventWithSelection = { ...event, selectedOption: optionUrl };

    const newSelectedEvents = [...selectedEvents];
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
  };
  
  const getEventSelection = (event: Event) => {
    const selection = selectedEvents.map((se, i) => se && se.title === event.title ? i : null).filter(i => i !== null);
    if (selection.length > 0) {
      return { isSelected: true, window: selection[0]! + 1 };
    }
    return { isSelected: false, window: null };
  };

  const handleStartView = () => {
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
      setModificationIndex(selectedEvents.findIndex(e => e === null));
    }
    setDialogOpen(true);
  };

   const handleChannelClick = (channel: Channel) => {
    const channelAsEvent: Event = {
      title: channel.name,
      options: [channel.url],
      buttons: ['Ver canal'],
      time: channel.name.includes('24/7') ? '24/7' : '',
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
    setConfigDialogOpen(false);
    setDialogEvent(event);
    setIsModification(true);
    setModificationIndex(index);
    setDialogOpen(true);
  }

  const handleViewChange = (view: string) => {
    setSearchTerm('');
    setCurrentView(view);
  };
  
  const handleBackToHome = () => {
    setSearchTerm('');
    setCurrentView('home');
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  const selectedEventsCount = selectedEvents.filter(Boolean).length;
  
  const pageTitle = (
    <div className='flex items-center min-h-[75px] px-4'>
        {currentView === 'home' ? (
            <div className="flex items-center gap-0">
                <Sheet open={sideMenuOpen} onOpenChange={setSideMenuOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-none">
                            <Menu className="h-6 w-6" />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0">
                        <SheetHeader className="items-center border-b border-border p-4 text-center">
                           <DialogTitle className="sr-only">Menú Principal</DialogTitle>
                            <Image
                                src="https://i.ibb.co/gZKpR4fc/deportes-para-todos.png"
                                alt="Deportes Para Todos Logo"
                                width={200}
                                height={50}
                                priority
                            />
                        </SheetHeader>
                        <div className="p-4 space-y-2">
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
                                            <p>¡Bienvenido a Deportes para Todos! Esta guía te ayudará a sacar el máximo provecho de la plataforma.</p>
                                            
                                            <h3 className="font-bold text-foreground">1. Navegación Principal</h3>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li><span className="font-semibold">Barra de Búsqueda:</span> Ubicada en la parte superior, te permite buscar eventos o canales por nombre. Los resultados aparecerán al instante.</li>
                                                <li><span className="font-semibold">Carrusel de Categorías:</span> Desplázate horizontalmente para ver todas las categorías disponibles como "En Vivo", "Fútbol", "Canales", etc. Haz clic en una para ver todos sus eventos.</li>
                                                <li><span className="font-semibold">Carruseles de Eventos:</span> En la vista de escritorio, los eventos están organizados por estado ("En Vivo", "Próximos", etc.) en carruseles que puedes deslizar.</li>
                                            </ul>

                                            <h3 className="font-bold text-foreground">2. Seleccionar Eventos para Ver</h3>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li><span className="font-semibold">Haz clic en una Tarjeta:</span> Cuando encuentres un evento o canal que te interese, haz clic en su tarjeta.</li>
                                                <li><span className="font-semibold">Elige una Opción:</span> Se abrirá un diálogo con uno o más botones. Cada botón representa una fuente de transmisión diferente. Elige la que prefieras.</li>
                                                <li><span className="font-semibold">Asignación a Ventana:</span> Al seleccionar una opción, el evento se asigna automáticamente a la primera "ventana" de visualización disponible (tienes hasta 9).</li>
                                            </ul>

                                            <h3 className="font-bold text-foreground">3. Gestionar tus Eventos Seleccionados</h3>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li><span className="font-semibold">Botón "Configuración" (rueda dentada):</span> En la esquina superior derecha, este botón abre un panel donde puedes ver y gestionar tus eventos elegidos.</li>
                                                <li><span className="font-semibold">Modificar o Eliminar:</span> Desde este panel, puedes hacer clic en un evento para cambiar la fuente de transmisión o para eliminarlo de tu selección. También puedes reordenar los eventos.</li>
                                            </ul>

                                            <h3 className="font-bold text-foreground">4. Iniciar la Vista Múltiple</h3>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li><span className="font-semibold">Botón "Play":</span> Una vez que hayas seleccionado al menos un evento, este botón se activará. Haz clic en él para ir a la pantalla de visualización.</li>
                                                <li><span className="font-semibold">Cuadrícula Dinámica:</span> La pantalla se dividirá automáticamente para mostrar todos los eventos que seleccionaste. La cuadrícula se adapta de 1 a 9 ventanas.</li>
                                            </ul>

                                            <h3 className="font-bold text-foreground">5. Menú Lateral de Ayuda</h3>
                                            <p>El icono de menú en la esquina superior izquierda abre un panel con información útil:</p>
                                            <ul className="list-disc pl-5 space-y-1">
                                                <li><span className="font-semibold">Aviso Legal:</span> Términos y condiciones del servicio.</li>
                                                <li><span className="font-semibold">Errores y Soluciones:</span> Guía para resolver problemas comunes de reproducción. ¡Muy recomendado si un video no carga!</li>
                                                <li><span className="font-semibold">Contacto:</span> Para enviarnos sugerencias o reportar errores.</li>
                                            </ul>
                                            <p className="font-bold mt-2">¡Explora, combina y disfruta de todos tus deportes favoritos en un solo lugar!</p>
                                        </div>
                                    </ScrollArea>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button>Entendido</Button>
                                        </DialogClose>
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
                                            <p><span className="font-semibold text-foreground">El Problema:</span> Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios o servidores de video a través de su DNS. Esto provoca que el video nunca cargue y veas una pantalla negra o un error de conexión.</p>
                                            <p><span className="font-semibold text-foreground">La Solución:</span> Cambiar el DNS de tu dispositivo o router a uno público como el de Cloudflare (<a href="https://one.one.one.one" target="_blank" rel="noopener noreferrer" className="text-primary underline">1.1.1.1</a>) o Google (8.8.8.8) puede saltarse estas restricciones. Estos servicios son gratuitos, rápidos y respetan tu privacidad. Este es el método más efectivo y soluciona la mayoría de los casos.</p>
                                            <h3 className="font-bold text-foreground">2. Instalar una Extensión de Reproductor de Video</h3>
                                            <p><span className="font-semibold text-foreground">El Problema:</span> Algunos streams de video utilizan formatos modernos como M3U8 o MPD que no todos los navegadores soportan de forma nativa. Si el navegador no sabe cómo "leer" el formato, el video no se reproducirá.</p>
                                            <p><span className="font-semibold text-foreground">La Solución:</span> Instalar una extensión como "<a href="https://chromewebstore.google.com/detail/reproductor-mpdm3u8m3uepg/opmeopcambhfimffbomjgemehjkbbmji?hl=es" target="_blank" rel="noopener noreferrer" className="text-primary underline">Reproductor MPD/M3U8/M3U/EPG</a>" (para Chrome/Edge) le da a tu navegador las herramientas necesarias para decodificar y reproducir estos formatos. Actúa como un "traductor" que le enseña a tu navegador a manejar estos videos.</p>
                                            <h3 className="font-bold text-foreground">3. Cambiar de Navegador</h3>
                                            <p><span className="font-semibold text-foreground">El Problema:</span> A veces, las configuraciones específicas de un navegador, una actualización reciente o una extensión conflictiva pueden impedir la reproducción.</p>
                                            <p><span className="font-semibold text-foreground">La Solución:</span> Probar con un navegador diferente es una forma rápida de descartar problemas locales. Recomendamos usar las versiones más recientes de Google Chrome, Mozilla Firefox o Microsoft Edge, ya que suelen tener la mejor compatibilidad con tecnologías de video web.</p>
                                            <h3 className="font-bold text-foreground">4. Desactivar Bloqueadores de Anuncios (Adblockers)</h3>
                                            <p><span className="font-semibold text-foreground">El Problema:</span> Los bloqueadores de anuncios son muy útiles, pero a veces pueden ser demasiado agresivos. Pueden bloquear no solo los anuncios, sino también los scripts o reproductores de video necesarios para que la transmisión funcione.</p>
                                            <p><span className="font-semibold text-foreground">La Solución:</span> Intenta desactivar tu Adblocker (como AdBlock, uBlock Origin, etc.) temporalmente para este sitio web. La mayoría de estas extensiones te permiten añadir sitios a una "lista blanca" para que no actúen sobre ellos. Recarga la página después de desactivarlo.</p>
                                            <h3 className="font-bold text-foreground">5. Optimizar para Escritorio</h3>
                                            <p><span className="font-semibold text-foreground">El Problema:</span> La aplicación está diseñada y optimizada para la experiencia en una computadora de escritorio o portátil. Los dispositivos móviles (celulares, tabletas) tienen limitaciones de hardware y software que pueden causar errores de reproducción o problemas de rendimiento.</p>
                                            <p><span className="font-semibold text-foreground">La Solución:</span> Para una experiencia más estable y fluida, recomendamos encarecidamente usar la plataforma en una computadora. Esto asegura que haya suficientes recursos para manejar múltiples transmisiones de video simultáneamente.</p>
                                            <h3 className="font-bold text-foreground">6. Reiniciar el Dispositivo y la Red</h3>
                                            <p><span className="font-semibold text-foreground">El Problema:</span> Problemas temporales de software, caché acumulada o fallos en la conexión de red pueden impedir que el contenido cargue correctamente.</p>
                                            <p><span className="font-semibold text-foreground">La Solución:</span> El clásico "apagar y volver a encender". Un reinicio rápido de tu computadora y de tu router puede solucionar problemas transitorios de red, memoria o software que podrían estar afectando la reproducción de video.</p>
                                        </div>
                                    </ScrollArea>
                                    <DialogFooter>
                                        <DialogClose asChild>
                                            <Button>Cerrar</Button>
                                        </DialogClose>
                                    </DialogFooter>
                                </DialogContent>
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
                                        <p>¿Tienes alguna sugerencia o encontraste un error? ¡Tu opinión nos ayuda a mejorar! Comunícate con nosotros para reportar fallos, enlaces incorrectos o proponer nuevos canales.</p>
                                    </div>
                                    <DialogFooter>
                                         <a href="mailto:deportesparatodosvercel@gmail.com" className={cn(buttonVariants({ variant: 'default' }), 'w-full')}>
                                            Contactar
                                        </a>
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
                <Link href="/" className="shrink-0 ml-2" onClick={handleBackToHome}>
                    <Image
                        src="https://i.ibb.co/gZKpR4fc/deportes-para-todos.png"
                        alt="Deportes Para Todos Logo"
                        width={150}
                        height={37.5}
                        priority
                        data-ai-hint="logo"
                    />
                </Link>
            </div>
        ) : (
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleBackToHome}>
                <ArrowLeft />
            </Button>
            <h1 className="text-2xl font-bold capitalize">{currentView}</h1>
          </div>
        )}
    </div>
  );

  const renderContent = () => {
    let itemsToDisplay: (Event|Channel)[] = [];
    if (searchTerm) {
      itemsToDisplay = searchResults;
    } else if (currentView === 'home') {
       return (
        <>
            <div className="w-full space-y-4 pt-4 pb-1">
                 <Carousel
                    opts={{
                        align: "start",
                        dragFree: true,
                    }}
                    className="w-full"
                >
                    <div className="flex items-center justify-between mb-2">
                        <h2 className="text-2xl font-bold">Categorías</h2>
                        <div className="flex items-center gap-2">
                            <CarouselPrevious variant="outline" className="static -translate-x-0 -translate-y-0 rounded-md" />
                            <CarouselNext variant="outline" className="static -translate-x-0 -translate-y-0 rounded-md" />
                        </div>
                    </div>
                    <CarouselContent className="-ml-4">
                        <CarouselItem className="basis-auto pl-4">
                            <Button variant="secondary" className="h-12 px-6 text-lg" onClick={() => handleViewChange('live')}>
                                En Vivo
                            </Button>
                        </CarouselItem>
                         <CarouselItem className="basis-auto pl-4">
                            <Button variant="secondary" className="h-12 px-6 text-lg" onClick={() => handleViewChange('channels')}>
                                Canales
                            </Button>
                        </CarouselItem>
                    {categories.map((category) => (
                        <CarouselItem key={category} className="basis-auto pl-4">
                            <Button variant="secondary" className="h-12 px-6 text-lg" onClick={() => handleViewChange(category)}>
                                {category}
                            </Button>
                        </CarouselItem>
                    ))}
                    </CarouselContent>
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
                    <div className="mb-8">
                        <EventCarousel title="Canales" channels={allChannels} onChannelClick={handleChannelClick} getEventSelection={getEventSelection} />
                    </div>
                    <div className="mb-8">
                        <EventCarousel title="En Vivo" events={liveEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                    </div>
                    <div className="mb-8">
                        <EventCarousel title="Próximos" events={upcomingEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                    </div>
                    <div className="mb-8">
                        <EventCarousel title="Canales 24/7" events={channels247} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                    </div>
                    <div className="mb-8">
                        <EventCarousel title="Estado Desconocido" events={unknownEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                    </div>
                    <div className="mb-8">
                        <EventCarousel title="Finalizados" events={finishedEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                    </div>
                </>
            )}
        </>
       )
    } else if (currentView === 'live') {
      itemsToDisplay = liveEvents;
    } else if (currentView === 'channels') {
      itemsToDisplay = allChannels;
    } else {
      itemsToDisplay = categoryFilteredEvents;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 pt-4">
          {itemsToDisplay.map((item, index) => {
              if ('url' in item) { // It's a Channel
                  const channel = item as Channel;
                  const channelAsEvent: Event = { title: channel.name, options: [channel.url], buttons: [], time: '', category: 'Canal', language: '', date: '', source: '', status: 'En Vivo', image: channel.logo };
                  const selection = getEventSelection(channelAsEvent);
                  return (
                      <Card 
                          key={`search-channel-${index}`}
                          className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border flex flex-col"
                          onClick={() => handleChannelClick(channel)}
                      >
                          <div className="relative w-full flex-grow flex items-center justify-center p-4 bg-white/10 aspect-video">
                              <Image
                                  src={channel.logo}
                                  alt={`${channel.name} logo`}
                                  width={120}
                                  height={67.5}
                                  className="object-contain max-h-full max-w-full"
                                  onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.onerror = null; 
                                      target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                                  }}
                              />
                              {selection.isSelected && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                      <span className="text-5xl font-extrabold text-white drop-shadow-lg">{selection.window}</span>
                                  </div>
                              )}
                          </div>
                          <div className="p-3 bg-card min-h-[52px] flex items-center justify-center">
                              <h3 className="font-bold text-sm text-center line-clamp-2">{item.name}</h3>
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
    )
  }

  return (
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
         <header className="sticky top-0 z-30 flex h-[75px] w-full items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm">
            {pageTitle}
            <div className="flex flex-1 items-center justify-end gap-2 px-2 md:px-8">
                <div className={cn("flex-1 justify-end", isSearchOpen ? 'flex' : 'hidden')}>
                    <div className="relative w-full max-w-sm">
                        <Input
                            type="text"
                            placeholder="Buscar evento o canal..."
                            className="w-full pr-10"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                         <Button variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8" onClick={() => { fetchEvents(); fetchPpvEvents(); }}>
                            <RotateCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <Button variant="ghost" size="icon" onClick={() => {
                    if (isSearchOpen && searchTerm) {
                        setSearchTerm('');
                    } else {
                       setIsSearchOpen(!isSearchOpen);
                    }
                }}>
                    {isSearchOpen ? <X /> : <Search />}
                </Button>

                <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <Settings />
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] flex flex-col">
                        <DialogHeader className="text-center">
                        <DialogTitle>Configuración y Eventos</DialogTitle>
                        <DialogDescription>
                            Personaliza la vista y gestiona tus eventos seleccionados.
                        </DialogDescription>
                        </DialogHeader>
                        <ScrollArea className="pr-4 -mr-4">
                           <LayoutConfigurator
                                gridGap={gridGap}
                                onGridGapChange={(value) => {
                                    setGridGap(value);
                                    localStorage.setItem('gridGap', value.toString());
                                }}
                                borderColor={borderColor}
                                onBorderColorChange={(value) => {
                                    setBorderColor(value);
                                    localStorage.setItem('borderColor', value);
                                }}
                                isChatEnabled={isChatEnabled}
                                onIsChatEnabledChange={(value) => {
                                    setIsChatEnabled(value);
                                    localStorage.setItem('isChatEnabled', JSON.stringify(value));
                                }}
                                
                                order={viewOrder.filter(i => selectedEvents[i] !== null)}
                                onOrderChange={handleOrderChange}
                                eventDetails={selectedEvents}
                                onRemove={handleEventRemove} 
                                onModify={openDialogForModification}
                                isViewPage={false}
                                onAddEvent={() => {}}
                            />
                        </ScrollArea>
                    </DialogContent>
                </Dialog>

                <Button
                    size="icon"
                    onClick={handleStartView}
                    disabled={selectedEventsCount === 0}
                    className="bg-green-600 hover:bg-green-700 text-white relative"
                >
                    <Play />
                     {selectedEventsCount > 0 && (
                        <Badge variant="destructive" className="absolute -top-2 -right-2 px-2 h-6 flex items-center justify-center rounded-full">
                            {selectedEventsCount}
                        </Badge>
                    )}
                </Button>
            </div>
        </header>

        <main className="flex-grow overflow-y-auto px-4 md:px-8 pb-8">
            <div className="space-y-2">
                {renderContent()}
            </div>
        </main>
        
        {dialogEvent && (
            <EventSelectionDialog
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                event={dialogEvent}
                selectedEvents={selectedEvents}
                onSelect={handleEventSelect}
                isModification={isModification}
                onRemove={() => handleEventRemove(modificationIndex!)}
                windowNumber={(modificationIndex ?? selectedEvents.findIndex(e => e === null))! + 1}
            />
        )}
    </div>
  );
}
