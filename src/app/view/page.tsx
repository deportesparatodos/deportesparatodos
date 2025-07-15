"use client";

import Link from 'next/link';
import Image from 'next/image';
import { X, Loader2, MessageSquare, BookOpen, AlertCircle, Plus, Mail, FileText, Search, Tv, Pencil, Menu, RotateCw, Maximize, Minimize, AlertTriangle, Settings, Trash2, Play } from "lucide-react";
import { Suspense, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import type { Event, StreamOption } from '@/components/event-carousel';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardHeader as UiCardHeader, CardContent as UiCardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EventCard } from '@/components/event-card';
import { channels as allChannelsList } from '@/components/channel-list';
import type { Channel } from '@/components/channel-list';
import { EventSelectionDialog } from '@/components/event-selection-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toZonedTime, format } from 'date-fns-tz';
import { addHours, isBefore, isAfter, parse, isPast } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScheduleManager, type Schedule } from '@/components/schedule-manager';


export function AddEventsDialog({ open, onOpenChange, onSelect, selectedEvents, allEvents, allChannels, isLoading }: { open: boolean, onOpenChange: (open: boolean) => void, onSelect: (event: Event, option: string) => void, selectedEvents: (Event|null)[], allEvents: Event[], allChannels: Channel[], isLoading: boolean }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);

    const [subDialogOpen, setSubDialogOpen] = useState(false);
    const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
    const [isModification, setIsModification] = useState(false);
    const [modificationIndex, setModificationIndex] = useState<number | null>(null);

    const getEventSelection = useCallback((eventTitle: string, eventTime: string) => {
        const selectionIndex = selectedEvents.findIndex(se => se?.title === eventTitle && se?.time === eventTime);
        if (selectionIndex !== -1 && selectedEvents[selectionIndex]) {
            return { isSelected: true, window: selectionIndex + 1, selectedOption: selectedEvents[selectionIndex]!.selectedOption };
        }
        return { isSelected: false, window: null, selectedOption: null };
    }, [selectedEvents]);


    const handleSubDialogSelect = (event: Event, option: string) => {
        onSelect(event, option);
        setSubDialogOpen(false);
    };
    
    const openSubDialogForEvent = (event: Event) => {
        const selection = getEventSelection(event.title, event.time);
        let eventForDialog = {...event};
        if(selection.isSelected && selection.selectedOption){
            eventForDialog.selectedOption = selection.selectedOption;
        }

        setDialogEvent(eventForDialog);
        setSubDialogOpen(true);

        setIsModification(selection.isSelected);
        setModificationIndex(selection.isSelected ? selection.window! - 1 : selectedEvents.findIndex(e => e === null));
    };

    const handleChannelClick = (channel: Channel) => {
        const event: Event = {
            title: channel.name,
            options: [{url: channel.url, label: 'Ver canal', hd: false, language: ''}],
            sources: [],
            buttons: [],
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
        const lowercasedFilter = searchTerm.toLowerCase();

        return allEvents
            .filter(e => e.title.toLowerCase().includes(lowercasedFilter))
            .sort((a, b) => {
                const orderA = statusOrder[a.status] ?? 99;
                const orderB = statusOrder[b.status] ?? 99;
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                if (a.time && b.time) {
                    return a.time.localeCompare(b.time);
                }
                return 0;
            });
    }, [searchTerm, allEvents]);

    const filteredChannels = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return allChannels.filter(c => c.name.toLowerCase().includes(lowercasedFilter));
    }, [searchTerm, allChannels]);

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
                 {isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <Loader2 className="h-10 w-10 animate-spin" />
                    </div>
                ) : (
                <Tabs defaultValue="eventos" className="flex-grow flex flex-col mt-2">
                    <div className="flex flex-col gap-2">
                        <div className="relative flex-grow mt-[5px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input
                                type="text"
                                placeholder="Buscar..."
                                className="w-full pl-10 pr-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                             {searchTerm && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                                    onClick={() => setSearchTerm('')}
                                >
                                    <X className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="eventos">Eventos</TabsTrigger>
                            <TabsTrigger value="canales">Canales</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="eventos" className="flex-grow mt-4 h-0">
                        <ScrollArea className="h-full pr-4 -mr-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {sortedAndFilteredEvents.map((event, index) => (
                                    <EventCard
                                        key={`event-${index}`}
                                        event={event}
                                        selection={getEventSelection(event.title, event.time)}
                                        onClick={() => openSubDialogForEvent(event)}
                                    />
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="canales" className="flex-grow mt-4 h-0">
                         <ScrollArea className="h-full pr-4 -mr-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                {filteredChannels.map((channel, index) => {
                                    const channelAsEvent: Event = { title: channel.name, options: [{url: channel.url, label: "Ver Canal", hd: false, language: ''}], sources: [], buttons: [], time: '', category: 'Canal', language: '', date: '', source: '', status: 'En Vivo', image: channel.logo };
                                    const selection = getEventSelection(channelAsEvent.title, channelAsEvent.time);
                                     return (
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
                                     )
                                })}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
                )}
            </DialogContent>
            {dialogEvent && (
                <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
                    <EventSelectionDialog
                        isOpen={subDialogOpen}
                        onOpenChange={setSubDialogOpen}
                        event={dialogEvent}
                        onSelect={handleSubDialogSelect}
                        isModification={isModification}
                        onRemove={() => { /* Remove logic can be added here if needed */ setSubDialogOpen(false); }}
                        windowNumber={(modificationIndex ?? 0) + 1}
                    />
                </Dialog>
            )}
        </Dialog>
    );
}


function ViewPageContent() {
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [schedules, setSchedules] = useState<Schedule[]>([]);
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
  const [allEventsData, setAllEventsData] = useState<Event[]>([]);
  const [isAddEventsLoading, setIsAddEventsLoading] = useState(false);

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
    setIsAddEventsLoading(true);
    try {
      const [liveResponse, todayResponse, sportsResponse, ppvResponse] = await Promise.all([
        fetch('/api/streams?type=live'),
        fetch('/api/streams?type=all-today'),
        fetch('/api/streams?type=sports'),
        fetch('/api/streams?type=ppv'),
      ]);

      if (!liveResponse.ok || !todayResponse.ok || !ppvResponse.ok || !sportsResponse.ok) {
        throw new Error('Failed to fetch one or more event sources');
      }

      const liveData: any[] = await liveResponse.json();
      const todayData: any[] = await todayResponse.json();
      const ppvData = await ppvResponse.json();
      const sportsData: {id: string; name: string}[] = await sportsResponse.json();
      
      const allMatchesMap = new Map<string, any>();
      
      todayData.forEach((match: any) => allMatchesMap.set(match.id, match));
      liveData.forEach((match: any) => allMatchesMap.set(match.id, match));

      const combinedStreamedData = Array.from(allMatchesMap.values());
        
      const timeZone = 'America/Argentina/Buenos_Aires';
      const placeholderImage = 'https://i.ibb.co/dHPWxr8/depete.jpg';
      
      const categoryMap = sportsData.reduce((acc: any, sport: any) => {
          acc[sport.id] = sport.name;
          return acc;
      }, {} as Record<string, string>);

      const initialEvents: Event[] = combinedStreamedData.map((match: any) => {
        let imageUrl = placeholderImage;
        if (match.teams?.home?.badge && match.teams?.away?.badge) {
            imageUrl = `https://streamed.su/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
        } else if (match.poster) {
            imageUrl = `https://streamed.su${match.poster}`;
        }
        
        return {
        title: match.title,
        time: format(toZonedTime(new Date(match.date), timeZone), 'HH:mm'),
        options: [], 
        sources: match.sources,
        buttons: [],
        category: categoryMap[match.category] || match.category.charAt(0).toUpperCase() + match.category.slice(1),
        language: '',
        date: format(toZonedTime(new Date(match.date), timeZone), 'yyyy-MM-dd'),
        source: 'streamed.su',
        image: imageUrl,
        status: 'Desconocido', // Will be updated later
      }});

      // Fetch all stream options concurrently
      const eventsWithStreams = await Promise.all(
        initialEvents.map(async (event) => {
          if (event.sources && event.sources.length > 0) {
            try {
              const streamOptions: StreamOption[] = [];
              const sourcePromises = event.sources.map(async (source) => {
                const response = await fetch(`/api/streams?type=stream&source=${source.source}&id=${source.id}`);
                if (response.ok) {
                  const streams: any[] = await response.json();
                  return streams.map(stream => ({
                    url: stream.embedUrl,
                    label: `${stream.language}${stream.hd ? ' HD' : ''} (${stream.source})`,
                    hd: stream.hd,
                    language: stream.language,
                  }));
                }
                return [];
              });
              
              const results = await Promise.all(sourcePromises);
              results.forEach(options => streamOptions.push(...options));
              return { ...event, options: streamOptions };
            } catch (error) {
              return { ...event, options: [] };
            }
          }
          return event;
        })
      );
      
      const finalStreamedEvents = eventsWithStreams.filter(e => e.options.length > 0);

      // Process PPV events
      const transformedPpvEvents: Event[] = [];
      if (ppvData.success && ppvData.streams) {
          ppvData.streams.forEach((category: any) => {
              if (category.streams) {
                  category.streams.forEach((stream: any) => {
                      transformedPpvEvents.push({
                          title: stream.name,
                          time: stream.starts_at > 0 ? format(new Date(stream.starts_at * 1000), 'HH:mm') : '--:--',
                          options: [{ url: stream.iframe, label: 'Ver Stream', hd: false, language: '' }],
                          sources: [],
                          buttons: [],
                          category: stream.category_name,
                          language: '', 
                          date: stream.starts_at > 0 ? new Date(stream.starts_at * 1000).toLocaleDateString() : '',
                          source: 'ppvs.su',
                          image: stream.poster,
                          status: stream.always_live === 1 ? 'En Vivo' : 'Desconocido', // Initial status
                      });
                  });
              }
          });
      }
      
      const allEvents = [...finalStreamedEvents, ...transformedPpvEvents];
      
      // Update statuses for all events
      const nowInBA = toZonedTime(new Date(), timeZone);
      const updatedEvents = allEvents.map(e => {
        let newEvent = {...e};
        
        if (newEvent.source === 'ppvs.su') {
            let status: Event['status'] = 'Desconocido';
            let startTime: Date | null = null;
            if (newEvent.date && newEvent.time !== '--:--') {
              try {
                startTime = toZonedTime(parse(`${newEvent.date} ${newEvent.time}`, 'M/d/yyyy HH:mm', new Date()), timeZone);
              } catch (error) {
                 startTime = toZonedTime(new Date(newEvent.date), timeZone);
              }
            } else if (newEvent.date) {
               startTime = toZonedTime(new Date(newEvent.date), timeZone);
            }
             
            if (startTime) {
              const eventEndTime = addHours(startTime, 3);
              if (isBefore(nowInBA, startTime)) status = 'Próximo';
              else if (isAfter(nowInBA, startTime) && isBefore(nowInBA, eventEndTime)) status = 'En Vivo';
              else if (isAfter(nowInBA, eventEndTime)) status = 'Finalizado';
            }
            if(newEvent.status === 'En Vivo') status = 'En Vivo'; // always_live override
            newEvent.status = status;
        } else {
             const eventDate = new Date(e.date);
             const zonedEventTime = toZonedTime(eventDate, timeZone);
             const eventEndTime = addHours(zonedEventTime, 3);

             if (liveData.some((liveMatch:any) => liveMatch.id === e.sources[0]?.id)) {
                 newEvent.status = 'En Vivo';
             } else if (isBefore(nowInBA, zonedEventTime)) {
                 newEvent.status = 'Próximo';
             } else if (isAfter(nowInBA, zonedEventTime) && isBefore(nowInBA, eventEndTime)) {
                 newEvent.status = 'En Vivo';
             } else if (isAfter(nowInBA, eventEndTime)) {
                 newEvent.status = 'Finalizado';
             }
        }
        return newEvent;
      });

      setAllEventsData(updatedEvents);

    } catch (error) {
      console.error(error);
      setAllEventsData([]);
    } finally {
        setIsAddEventsLoading(false);
    }
  }, []);

  // Handle schedules
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let changed = false;
      const activeSchedules = schedules.filter(s => {
        const scheduleTime = new Date(s.dateTime);
        if (now >= scheduleTime) {
          setSelectedEvents(s.events);
          localStorage.setItem('selectedEvents', JSON.stringify(s.events));
          setViewOrder(s.order);
          localStorage.setItem('viewOrder', JSON.stringify(s.order));
          changed = true;
          return false; // Remove from list
        }
        return true;
      });

      if (changed) {
        setSchedules(activeSchedules);
        localStorage.setItem('schedules', JSON.stringify(activeSchedules));
      }
    }, 1000); // Check every second

    return () => clearInterval(interval);
  }, [schedules]);

  
  useEffect(() => {
    setIsMounted(true);
    
    fetchAllEvents();
    
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
    
    const storedSchedules = localStorage.getItem('schedules');
    if (storedSchedules) {
      try {
        const parsedSchedules: Schedule[] = JSON.parse(storedSchedules).map((s: Schedule) => ({
          ...s,
          dateTime: new Date(s.dateTime),
        })).filter((s: Schedule) => !isPast(s.dateTime));
        setSchedules(parsedSchedules);
      } catch (e) { console.error("Could not parse schedules from local storage", e); }
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
  }, [fetchAllEvents]);

    useEffect(() => {
        if (addEventsDialogOpen) {
            if (allEventsData.length === 0) {
                setIsAddEventsLoading(true);
                fetchAllEvents();
            } else {
                setIsAddEventsLoading(false);
            }
        }
    }, [addEventsDialogOpen, allEventsData, fetchAllEvents]);

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
  
  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
        {modifyEvent && (
             <Dialog open={!!modifyEvent} onOpenChange={(open) => { if (!open) setModifyEvent(null); }}>
                <EventSelectionDialog
                    isOpen={!!modifyEvent}
                    onOpenChange={(open) => { if (!open) setModifyEvent(null); }}
                    event={modifyEvent.event}
                    onSelect={handleModifyEventSelect}
                    isModification={true}
                    onRemove={() => {}}
                    windowNumber={modifyEvent.index + 1}
                />
            </Dialog>
        )}
        <AddEventsDialog 
            open={addEventsDialogOpen}
            onOpenChange={setAddEventsDialogOpen}
            onSelect={handleAddEventSelect}
            selectedEvents={selectedEvents}
            allEvents={allEventsData}
            allChannels={allChannelsList}
            isLoading={isAddEventsLoading}
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
              <div className="px-6 pb-6 pt-0 text-sm text-muted-foreground text-left space-y-4">
                  <p>Si encuentras algún problema o no estás seguro de cómo funciona algo, consulta nuestras guías rápidas.</p>
                  <Alert variant="destructive" className='bg-yellow-500/10 border-yellow-500/50 text-yellow-500'>
                      <AlertTriangle className="h-4 w-4 !text-yellow-500" />
                      <AlertTitle className="font-bold">¡Atención!</AlertTitle>
                      <AlertDescription className="text-yellow-500/80">
                         Algunos canales pueden tardar mas en cargar que otros, hasta no ver un mensaje de error, NO CAMBIAR DE CANAL.
                      </AlertDescription>
                  </Alert>
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
                                    <p><span className="font-semibold text-foreground">La Solución:</span> Instalar una extensión como "<a href="https://chromewebstore.google.com/detail/reproductor-mpdm3u8m3uepg/opmeopcambhfimffbomjgemehjkbbmji?hl=es" target="_blank" rel="noopener noreferrer" className="text-primary underline">Reproductor MPD/M3U8/M3U/EPG</a>" (para Chrome/Edge) le da a tu navegador las herramientas necesarias para decodificar y reproducir estos formatos.</p>
                                    <h3 className="font-bold text-foreground">3. Cambiar de Navegador</h3>
                                    <p><span className="font-semibold text-foreground">El Problema:</span> A veces, las configuraciones específicas de un navegador, una actualización reciente o una extensión conflictiva pueden impedir la reproducción.</p>
                                    <p><span className="font-semibold text-foreground">La Solución:</span> Probar con un navegador diferente es una forma rápida de descartar problemas locales. Recomendamos usar las versiones más recientes de Google Chrome, Mozilla Firefox o Microsoft Edge, ya que suelen tener la mejor compatibilidad con tecnologías de video web.</p>
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
             onModify={(event, index) => {
                 const currentEventState = selectedEvents[index];
                 if (!currentEventState) return;
                 const eventForModification = { ...event, selectedOption: currentEventState.selectedOption };
                 setModifyEvent({ event: eventForModification, index });
             }}
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
             schedules={schedules}
             onSchedulesChange={(newSchedules) => {
                 setSchedules(newSchedules);
                 localStorage.setItem('schedules', JSON.stringify(newSchedules));
             }}
             allEvents={allEventsData}
             allChannels={allChannelsList}
             currentOrder={viewOrder}
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
          {selectedEvents.map((event, originalIndex) => {
              if (!event) return null;
              
              const windowClasses = cn(
                  "overflow-hidden",
                  "relative",
                  "bg-black",
                  "order-[var(--order)]",
                  getItemClasses(viewOrder.filter(i => selectedEvents[i] !== null).indexOf(originalIndex), numCameras)
              );

              let iframeSrc = event.selectedOption
                  ? `${event.selectedOption}${event.selectedOption.includes('?') ? '&' : '?'}reload=${reloadCounters[originalIndex] || 0}`
                  : '';
              
              if (iframeSrc.includes("youtube-nocookie.com")) {
                  iframeSrc += `&autoplay=1`;
              }

              return (
                  <div key={`window-stable-${originalIndex}`} className={windowClasses} style={{'--order': viewOrder.indexOf(originalIndex)} as React.CSSProperties}>
                      <iframe
                          src={iframeSrc}
                          title={`Stream ${originalIndex + 1}`}
                          className="w-full h-full border-0"
                          loading="eager"
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
