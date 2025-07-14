
"use client";

import Link from 'next/link';
import Image from 'next/image';
import { X, Loader2, MessageSquare, BookOpen, AlertCircle, Plus, Mail, FileText, Search, Tv, Pencil, Menu, RotateCw, Maximize, Minimize } from "lucide-react";
import { Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import type { Event } from '@/components/event-carousel';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader as UiCardHeader, CardContent as UiCardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/event-card';
import { channels as allChannels } from '@/components/channel-list';
import type { Channel } from '@/components/channel-list';
import { EventSelectionDialog } from '@/components/event-selection-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toZonedTime, format } from 'date-fns-tz';


function AddEventsDialog({ open, onOpenChange, onSelect, selectedEvents, allEvents, allChannels, ppvEvents }: { open: boolean, onOpenChange: (open: boolean) => void, onSelect: (event: Event, option: string) => void, selectedEvents: (Event|null)[], allEvents: Event[], allChannels: Channel[], ppvEvents: Event[] }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);

    const [subDialogOpen, setSubDialogOpen] = useState(false);
    const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
    const [isModification, setIsModification] = useState(false);
    const [modificationIndex, setModificationIndex] = useState<number | null>(null);

    const getEventSelection = useCallback((eventTitle: string) => {
        const selection = selectedEvents.map((se, i) => se && se.title === eventTitle ? i : null).filter(i => i !== null);
        if (selection.length > 0) {
            return { isSelected: true, window: selection[0]! + 1 };
        }
        return { isSelected: false, window: null };
    }, [selectedEvents]);

    const handleSubDialogSelect = (event: Event, option: string) => {
        onSelect(event, option);
        setSubDialogOpen(false);
    };
    
    const openSubDialogForEvent = (event: Event) => {
        const selection = getEventSelection(event.title);
        setDialogEvent(event);
        setIsModification(selection.isSelected);
        setModificationIndex(selection.isSelected ? selection.window! - 1 : selectedEvents.findIndex(e => e === null));
        setSubDialogOpen(true);
    };

    const handleChannelClick = (channel: Channel) => {
        const event: Event = {
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
        openSubDialogForEvent(event);
    };

    const sortedAndFilteredEvents = useMemo(() => {
        const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2, 'Desconocido': 3, 'Finalizado': 4 };
        const combinedEvents = [...allEvents, ...ppvEvents];
        const lowercasedFilter = searchTerm.toLowerCase();

        return combinedEvents
            .filter(e => e.title.toLowerCase().includes(lowercasedFilter))
            .sort((a, b) => {
                const orderA = statusOrder[a.status] ?? 99;
                const orderB = statusOrder[b.status] ?? 99;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                return a.time.localeCompare(b.time);
            });
    }, [searchTerm, allEvents, ppvEvents]);

    const filteredChannels = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return allChannels.filter(c => c.name.toLowerCase().includes(lowercasedFilter));
    }, [searchTerm]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                hideClose={true}
                className={cn(
                    "max-w-4xl w-[90vw] h-[90vh] flex flex-col p-4 transition-all duration-300",
                    isFullScreen && "w-screen h-screen max-w-none rounded-none"
                )}
            >
                <DialogHeader className='flex-row items-center justify-between pb-0'>
                    <DialogTitle>Añadir Evento/Canal</DialogTitle>
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)}>
                            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                        <DialogClose asChild>
                           <Button variant="ghost" size="icon">
                               <X className="h-5 w-5" />
                           </Button>
                        </DialogClose>
                    </div>
                </DialogHeader>
                <Tabs defaultValue="eventos" className="flex-grow flex flex-col">
                    <div className="flex flex-col gap-2 mt-[5px]">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="eventos">Eventos</TabsTrigger>
                            <TabsTrigger value="canales">Canales</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="eventos" className="flex-grow mt-4 overflow-hidden">
                        <ScrollArea className="h-full pr-4 -mr-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {sortedAndFilteredEvents.map((event, index) => (
                                    <EventCard
                                        key={`event-${index}`}
                                        event={event}
                                        selection={getEventSelection(event.title)}
                                        onClick={() => openSubDialogForEvent(event)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="canales" className="flex-grow mt-4 overflow-hidden">
                         <ScrollArea className="h-full pr-4 -mr-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredChannels.map((channel, index) => (
                                     <Card 
                                        key={`search-channel-${index}`}
                                        className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border h-full w-full flex flex-col"
                                        onClick={() => handleChannelClick(channel)}
                                    >
                                        <div className="relative w-full aspect-video flex items-center justify-center p-4 bg-white/10 h-[100px] flex-shrink-0">
                                            <Image
                                                src={channel.logo}
                                                alt={`${channel.name} logo`}
                                                width={120}
                                                height={67.5}
                                                className="object-contain max-h-full max-w-full"
                                                onError={(e) => { e.currentTarget.src = 'https://i.ibb.co/dHPWxr8/depete.jpg'; }}
                                            />
                                        </div>
                                        <div className="p-3 bg-card flex-grow flex flex-col justify-center">
                                            <h3 className="font-bold text-sm text-center line-clamp-2">{channel.name}</h3>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            </DialogContent>
            {dialogEvent && (
                <EventSelectionDialog
                    isOpen={subDialogOpen}
                    onOpenChange={setSubDialogOpen}
                    event={dialogEvent}
                    selectedEvents={selectedEvents}
                    onSelect={handleSubDialogSelect}
                    isModification={isModification}
                    onRemove={() => { /* Remove logic can be added here if needed */ setSubDialogOpen(false); }}
                    windowNumber={(modificationIndex ?? 0) + 1}
                />
            )}
        </Dialog>
    );
}


function ViewPageContent() {
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [isMounted, setIsMounted] = useState(false);
  const [gridGap, setGridGap] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useIsMobile();
  const [reloadCounters, setReloadCounters] = useState<number[]>(Array(9).fill(0));
  
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const [errorsDialogOpen, setErrorsDialogOpen] = useState(false);
  
  const [addEventsDialogOpen, setAddEventsDialogOpen] = useState(false);
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [ppvEvents, setPpvEvents] = useState<Event[]>([]);

  const [modifyEvent, setModifyEvent] = useState<{ event: Event, index: number } | null>(null);


  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timerRef.current!);
          setWelcomePopupOpen(false);
          return 0;
        }
        return prev - 1;
      });
    }, 100); 
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  useEffect(() => {
    if (welcomePopupOpen && !tutorialDialogOpen && !errorsDialogOpen) {
      startTimer();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [welcomePopupOpen, tutorialDialogOpen, errorsDialogOpen, startTimer, stopTimer]);


  const handleReloadCamera = (index: number) => {
    setReloadCounters(prevCounters => {
      const newCounters = [...prevCounters];
      newCounters[index] = (newCounters[index] || 0) + 1;
      return newCounters;
    });
  };

  const handleRemoveCamera = (indexToRemove: number) => {
    const newEvents = [...selectedEvents];
    newEvents[indexToRemove] = null;
    
    setSelectedEvents(newEvents);
    localStorage.setItem('selectedEvents', JSON.stringify(newEvents));
  };
  
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
  
  const numCameras = useMemo(() => selectedEvents.filter(Boolean).length, [selectedEvents]);

   const fetchAllEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/events', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch events');
      const data = await response.json();
      setAllEvents(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchPpvEvents = useCallback(async () => {
    try {
      const response = await fetch('/api/ppv', { cache: 'no-store' });
      if (!response.ok) throw new Error('Failed to fetch PPV events');
      const data = await response.json();
      const transformedEvents: Event[] = [];
      if (data.success && data.streams) {
        data.streams.forEach((category: any) => {
          if (category.streams) {
            category.streams.forEach((stream: any) => {
              const startTime = new Date(stream.starts_at * 1000);
              let status: Event['status'] = stream.always_live === 1 ? 'En Vivo' : (stream.starts_at > 0 ? 'Próximo' : 'Desconocido');
              if (status === 'Próximo') status = 'Desconocido';
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

  
  useEffect(() => {
    setIsMounted(true);
    fetchAllEvents();
    fetchPpvEvents();
    
    const hasVisited = sessionStorage.getItem('hasVisitedViewPage');
    if (!hasVisited) {
        setWelcomePopupOpen(true);
        sessionStorage.setItem('hasVisitedViewPage', 'true');
        setProgress(100);
    }

    const storedEvents = localStorage.getItem('selectedEvents');
    if (storedEvents) {
      try {
        const parsedEvents: (Event | null)[] = JSON.parse(storedEvents);
        const newSelectedEvents = Array(9).fill(null);
        parsedEvents.slice(0, 9).forEach((event, i) => {
          newSelectedEvents[i] = event;
        });
        setSelectedEvents(newSelectedEvents);
      } catch (e) { console.error("Could not parse selected events from local storage", e)}
    }

    const storedGap = localStorage.getItem('gridGap');
    if (storedGap) setGridGap(parseInt(storedGap, 10));
    
    const storedBorderColor = localStorage.getItem('borderColor');
    if (storedBorderColor) setBorderColor(storedBorderColor);
    
    const storedChatEnabled = localStorage.getItem('isChatEnabled');
    if (storedChatEnabled) setIsChatEnabled(JSON.parse(storedChatEnabled));
    
    const storedViewOrder = localStorage.getItem('viewOrder');
    if (storedViewOrder) {
        try {
            const parsedOrder = JSON.parse(storedViewOrder);
            if(Array.isArray(parsedOrder) && parsedOrder.length === 9) {
                setViewOrder(parsedOrder);
            }
        } catch(e) {
            console.error("Failed to parse viewOrder from localStorage", e);
        }
    }
  }, [fetchAllEvents, fetchPpvEvents]);

    const handleAddEventSelect = (event: Event, option: string) => {
        const newSelectedEvents = [...selectedEvents];
        const eventWithSelection = { ...event, selectedOption: option };

        const existingIndex = newSelectedEvents.findIndex(se => se?.title === event.title);

        if (existingIndex !== -1) {
            // Modify existing event
            newSelectedEvents[existingIndex] = eventWithSelection;
        } else {
            // Add to first empty slot
            const emptyIndex = newSelectedEvents.findIndex(e => e === null);
            if (emptyIndex !== -1) {
                newSelectedEvents[emptyIndex] = eventWithSelection;
            } else {
                alert("No empty slots available.");
                return;
            }
        }
        
        setSelectedEvents(newSelectedEvents);
        localStorage.setItem('selectedEvents', JSON.stringify(newSelectedEvents));
        setAddEventsDialogOpen(false); // Close the add dialog
    };

    const handleModifyEventSelect = (event: Event, option: string) => {
      if (modifyEvent) {
          const newSelectedEvents = [...selectedEvents];
          const eventWithSelection = { ...event, selectedOption: option };
          newSelectedEvents[modifyEvent.index] = eventWithSelection;
          setSelectedEvents(newSelectedEvents);
          localStorage.setItem('selectedEvents', JSON.stringify(newSelectedEvents));
          setModifyEvent(null);
      }
    };


 const getGridClasses = useCallback((count: number) => {
    if (isMobile) {
        return `grid-cols-1 grid-rows-${count > 0 ? count : 1}`;
    }
    switch (count) {
        case 1: return 'grid-cols-1 grid-rows-1';
        case 2: return 'grid-cols-2 grid-rows-1';
        case 3: return 'grid-cols-2 grid-rows-2'; 
        case 4: return 'grid-cols-2 grid-rows-2';
        case 5: return 'grid-cols-3 grid-rows-2';
        case 6: return 'grid-cols-3 grid-rows-2';
        case 7: return 'grid-cols-3 grid-rows-3';
        case 8: return 'grid-cols-3 grid-rows-3';
        case 9: return 'grid-cols-3 grid-rows-3';
        default: return 'grid-cols-1 grid-rows-1';
    }
  }, [isMobile]);
  
 const getItemClasses = (orderedIndex: number, count: number) => {
    if (isMobile) return '';
    if (count === 3) {
      return orderedIndex === 0 ? 'col-span-2' : 'col-span-1';
    }
    if (count === 5) {
      return orderedIndex < 2 ? 'col-span-1' : 'col-span-1';
    }
    if (count === 7) {
       return orderedIndex === 6 ? 'col-start-2' : '';
    }
    if (count === 8) {
       return orderedIndex === 6 ? 'col-start-1' : orderedIndex === 7 ? 'col-start-2' : '';
    }
    return '';
 };

  if (!isMounted) {
    return <Loading />;
  }
  
  if (numCameras === 0) {
    return (
      <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
        <p className="mb-4">No hay URLs seleccionadas para mostrar.</p>
        <Button asChild>
          <Link href="/">
            <X className="mr-2 h-4 w-4" /> Volver Atrás
          </Link>
        </Button>
      </div>
    );
  }
  
  const gridContainerClasses = `grid flex-grow w-full h-full ${getGridClasses(numCameras)}`;
  
  const activeWindows = viewOrder.map(originalIndex => {
      const event = selectedEvents[originalIndex];
      if (!event) return null;
      return {
          event,
          reload: reloadCounters[originalIndex],
          originalIndex,
      };
  }).filter(Boolean) as { event: Event; reload: number; originalIndex: number }[];


  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
        {modifyEvent && (
            <EventSelectionDialog
                isOpen={!!modifyEvent}
                onOpenChange={(open) => !open && setModifyEvent(null)}
                event={{...modifyEvent.event, source: 'view-page'}}
                selectedEvents={selectedEvents}
                onSelect={handleModifyEventSelect}
                isModification={true}
                onRemove={() => {}}
                windowNumber={modifyEvent.index + 1}
            />
        )}
        <AddEventsDialog 
            open={addEventsDialogOpen}
            onOpenChange={setAddEventsDialogOpen}
            onSelect={handleAddEventSelect}
            selectedEvents={selectedEvents}
            allEvents={allEvents}
            allChannels={allChannels}
            ppvEvents={ppvEvents}
        />

       <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
           <DialogContent className="sm:max-w-md p-0" hideClose={true}>
              <DialogHeader className="sr-only">
                  <DialogTitle>Bienvenida</DialogTitle>
              </DialogHeader>
               <DialogClose className="absolute right-2 top-2 rounded-full p-1 bg-black/50 text-white/70 transition-colors hover:bg-black/75 hover:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10">
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </DialogClose>
              <div className="relative">
                  <Progress value={progress} indicatorClassName="bg-primary" className="absolute top-0 left-0 right-0 h-1 rounded-none" />
              </div>
              <div className="px-6 pt-8 pb-2 text-center">
                  <h2 className="text-lg font-bold">¡Bienvenido a Deportes para Todos!</h2>
              </div>
              <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground text-left">
                  <p>Si encuentras algún problema o no estás seguro de cómo funciona algo, consulta nuestras guías rápidas.</p>
              </div>
               <DialogFooter className="flex-row items-center justify-center gap-2 p-4 border-t bg-background">
                  <Dialog open={tutorialDialogOpen} onOpenChange={setTutorialDialogOpen}>
                    <DialogTrigger asChild>
                       <Button variant="outline" className="gap-2">
                          <BookOpen /> Tutorial
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
                  <Dialog open={errorsDialogOpen} onOpenChange={setErrorsDialogOpen}>
                      <DialogTrigger asChild>
                          <Button variant="outline" className="gap-2">
                             <AlertCircle /> Solución de Errores
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
               </DialogFooter>
          </DialogContent>
      </Dialog>

      <div className="relative flex flex-col h-screen flex-grow">
        <div
          className={cn(
            "absolute z-20 flex items-center gap-2",
            isChatOpen && !isMobile ? "flex-row-reverse left-0" : "right-0"
          )}
          style={
             isChatOpen && !isMobile 
              ? { top: `${gridGap}px`, left: `${gridGap}px` } 
              : { top: `${gridGap}px`, right: `${gridGap}px` }
          }
        >
          
          <CameraConfigurationComponent
             order={viewOrder.filter(i => selectedEvents[i] !== null)}
             onOrderChange={handleOrderChange}
             eventDetails={selectedEvents}
             onReload={handleReloadCamera}
             onRemove={handleRemoveCamera}
             onModify={(event, index) => setModifyEvent({ event, index })}
             isViewPage={true}
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
             onAddEvent={() => setAddEventsDialogOpen(true)}
          />

          {isChatEnabled && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="bg-transparent hover:bg-accent/80 text-white h-10 w-10" 
              onClick={() => setIsChatOpen(!isChatOpen)}
              aria-label="Abrir o cerrar chat"
            >
              <MessageSquare className="h-5 w-5" />
            </Button>
          )}
          
          <Link
            href="/"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "bg-transparent hover:bg-accent/80 text-white h-10 w-10")}
            aria-label="Cerrar Vista"
          >
            <X className="h-7 w-7 text-white" />
          </Link>
        </div>
        
        <main 
          className={gridContainerClasses} 
          style={{ 
            gap: `${gridGap}px`,
            padding: `${gridGap}px`,
            backgroundColor: borderColor
          }}
        >
          {activeWindows.map(({ event, reload, originalIndex }, orderedIndex) => {
            const windowClasses = cn(
              "overflow-hidden",
              "relative",
              "bg-black",
              getItemClasses(orderedIndex, numCameras)
            );

            let iframeSrc = event.selectedOption
                ? `${event.selectedOption}${event.selectedOption.includes('?') ? '&' : '?'}reload=${reload || 0}`
                : '';
            
            if (iframeSrc.includes("youtube-nocookie.com")) {
                iframeSrc += `&autoplay=1`;
            }
            
            return (
                <div key={`window-${originalIndex}`} className={windowClasses}>
                    <iframe
                        src={iframeSrc}
                        title={`Stream ${originalIndex + 1}`}
                        className="w-full h-full border-0"
                        allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                        allowFullScreen
                    />
                </div>
            );
          })}
        </main>
      </div>
      
       {/* Chat Sidebar for Desktop */}
       <div
        className={cn(
          'w-80 flex-shrink-0 bg-background flex-col border-l border-border',
          isChatOpen && !isMobile ? 'flex' : 'hidden'
        )}
      >
        <div className="p-2 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold">Chat en Vivo</h2>
          <Button variant="ghost" size="icon" onClick={() => setIsChatOpen(false)} className="h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
        <iframe
          src="https://organizations.minnit.chat/626811533994618/c/Main?embed"
          title="Chat en Vivo"
          className="w-full flex-grow border-0"
        />
      </div>

      {/* Chat Dialog for Mobile */}
      {isMobile && (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
           <DialogContent className="p-0 border-0 w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader className="p-4 border-b">
                <DialogTitle>Chat en Vivo</DialogTitle>
                 <DialogDescription className="sr-only">Contenedor del chat en vivo de Minnit.</DialogDescription>
            </DialogHeader>
            <iframe
              src="https://organizations.minnit.chat/626811533994618/c/Main?embed"
              title="Chat en Vivo"
              className="w-full flex-grow border-0"
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="mt-2">Cargando vistas...</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <ViewPageContent />
    </Suspense>
  );
}
