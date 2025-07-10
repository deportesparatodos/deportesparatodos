
"use client";

import Link from 'next/link';
import { X, Loader2, Menu, MessageSquare, HelpCircle, AlertCircle, FileText, Mail, Settings } from "lucide-react";
import { Suspense, useState, useEffect } from 'react';
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { cn } from '@/lib/utils';
import { channels as allChannels } from '@/components/channel-list';
import type { Event } from '@/components/event-list';
import { addHours, isAfter } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { useIsMobile } from '@/hooks/use-mobile';
import type { ScheduledLayoutChange } from '@/components/schedule-manager';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';


const defaultEventGrouping = {
  all: false,
  enVivo: false,
  otros: false,
  f1: false,
  mlb: false,
  nba: false,
  mundialDeClubes: false,
  deportesDeCombate: false,
  liga1: false,
  ligaPro: false,
  mls: false,
};

function normalizeEventTitleForKey(title: string): string {
    let normalized = title.toLowerCase();
    
    // 1. Remove prefixes like "Liga: ", "Copa: ", etc.
    normalized = normalized.replace(/.*: /,'').trim();

    // 2. Remove accents and diacritics
    normalized = normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // 3. Specific replacements for abbreviations and common names
    const replacements: { [key: string]: string } = {
        'ee. uu.': 'estados unidos',
        'u.s.a.': 'estados unidos',
        'usa': 'estados unidos',
        "newell's old boys": 'newells',
        "newell’s old boys": 'newells', // Different apostrophe
        "newell's": 'newells',
        "newell’s": 'newells',
        // NBA Teams - Full name to short name
        'atlanta hawks': 'hawks',
        'boston celtics': 'celtics',
        'brooklyn nets': 'nets',
        'charlotte hornets': 'hornets',
        'chicago bulls': 'bulls',
        'cleveland cavaliers': 'cavaliers',
        'dallas mavericks': 'mavericks',
        'denver nuggets': 'nuggets',
        'detroit pistons': 'pistons',
        'golden state warriors': 'warriors',
        'houston rockets': 'rockets',
        'indiana pacers': 'pacers',
        'los angeles clippers': 'clippers',
        'la clippers': 'clippers',
        'los angeles lakers': 'lakers',
        'la lakers': 'lakers',
        'memphis grizzlies': 'grizzlies',
        'miami heat': 'heat',
        'milwaukee bucks': 'bucks',
        'minnesota timberwolves': 'timberwolves',
        'new orleans pelicans': 'pelicans',
        'new york knicks': 'knicks',
        'oklahoma city thunder': 'thunder',
        'orlando magic': 'magic',
        'philadelphia 76ers': '76ers',
        'phoenix suns': 'suns',
        'portland trail blazers': 'trail blazers',
        'sacramento kings': 'kings',
        'san antonio spurs': 'spurs',
        'toronto raptors': 'raptors',
        'utah jazz': 'jazz',
        'washington wizards': 'wizards',
    };

    for (const [key, value] of Object.entries(replacements)) {
        // Escape special regex characters in the key
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        normalized = normalized.replace(new RegExp(escapedKey, 'g'), value);
    }

    // 4. Split by 'vs', normalize each team, sort, and join
    const teams = normalized
        .split(/\s+vs\.?\s+/) // Handles ' vs ' and ' vs. ' with surrounding spaces
        .map(team => team.replace(/[^a-z0-9]/g, '')) // Remove all non-alphanumeric
        .filter(Boolean);

    if (teams.length < 2) {
        // Fallback for titles that don't contain 'vs'
        return normalized.replace(/[^a-z0-9]/g, '');
    }

    // 5. Sort teams alphabetically to handle "A vs B" and "B vs A"
    teams.sort();
    
    return teams.join('-');
}

function finalizeMerge(groupToMerge: Omit<Event, 'status'>[]): Omit<Event, 'status'> {
    if (groupToMerge.length === 1) return groupToMerge[0];

    const allOptions = new Map<string, string>(); // url -> button text
    let earliestTime = '23:59';
    let longestTitle = '';
    
    const preferredEvent = groupToMerge.find(e => e.source.includes('alangulotv')) || groupToMerge[0];

    groupToMerge.forEach(event => {
        if (event.time < earliestTime) {
            earliestTime = event.time;
        }
        if (event.title.length > longestTitle.length) {
            longestTitle = event.title;
        }
        event.options.forEach((opt, index) => {
            if (!allOptions.has(opt)) {
                allOptions.set(opt, event.buttons[index]);
            }
        });
    });

    return {
        ...preferredEvent,
        time: earliestTime,
        title: longestTitle,
        image: preferredEvent.image,
        source: preferredEvent.source,
        options: Array.from(allOptions.keys()),
        buttons: Array.from(allOptions.values()),
    };
}

function mergeDuplicateEvents(events: Omit<Event, 'status'>[]): Omit<Event, 'status'>[] {
  if (!events || events.length === 0) return [];

  const eventGroups = new Map<string, Omit<Event, 'status'>[]>();

  events.forEach(event => {
    const cleanTitleKey = normalizeEventTitleForKey(event.title);
    const key = `${event.date}-${cleanTitleKey}`;
    if (!eventGroups.has(key)) {
      eventGroups.set(key, []);
    }
    eventGroups.get(key)!.push(event);
  });
  
  const mergedEvents: Omit<Event, 'status'>[] = [];

  for (const group of eventGroups.values()) {
    if (group.length === 1) {
      mergedEvents.push(group[0]);
      continue;
    }

    group.sort((a, b) => a.time.localeCompare(b.time));
    
    let currentMergeGroup: Omit<Event, 'status'>[] = [group[0]];
    
    for (let i = 1; i < group.length; i++) {
        const lastEventInMergeGroup = currentMergeGroup[currentMergeGroup.length - 1];
        const nextEvent = group[i];
        
        const time1 = new Date(`${lastEventInMergeGroup.date}T${lastEventInMergeGroup.time}`);
        const time2 = new Date(`${nextEvent.date}T${nextEvent.time}`);
        const timeDiff = Math.abs(time1.getTime() - time2.getTime()) / (1000 * 60);

        if (timeDiff <= 30) {
            currentMergeGroup.push(nextEvent);
        } else {
            mergedEvents.push(finalizeMerge(currentMergeGroup));
            currentMergeGroup = [nextEvent];
        }
    }
    if (currentMergeGroup.length > 0) {
        mergedEvents.push(finalizeMerge(currentMergeGroup));
    }
  }

  mergedEvents.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return a.time.localeCompare(b.time);
  });

  return mergedEvents;
}

function ViewPageContent() {
  // State is now driven by localStorage to sync with home page
  const [urls, setUrls] = useState<string[]>(Array(9).fill(''));
  const [numCameras, setNumCameras] = useState<number>(1);
  const [isMounted, setIsMounted] = useState(false);
  const [gridGap, setGridGap] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#18181b');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const isMobile = useIsMobile();
  const [eventGrouping, setEventGrouping] = useState(defaultEventGrouping);
  const [reloadCounters, setReloadCounters] = useState<number[]>(Array(9).fill(0));
  const [scheduledChanges, setScheduledChanges] = useState<ScheduledLayoutChange[]>([]);

  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [progress, setProgress] = useState(100);

  const [sheetOpen, setSheetOpen] = useState(false);
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState(true);
  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const handleReloadCamera = (index: number) => {
    setReloadCounters(prevCounters => {
      const newCounters = [...prevCounters];
      newCounters[index] = (newCounters[index] || 0) + 1;
      return newCounters;
    });
  };

  // Welcome Popup Timer
  useEffect(() => {
    if (welcomePopupOpen) {
      setProgress(100); // Reset progress on open
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(interval);
            setWelcomePopupOpen(false);
            return 0;
          }
          return prev - 1;
        });
      }, 100); // Update every 100ms for 10s total

      return () => clearInterval(interval);
    }
  }, [welcomePopupOpen]);

  // Load from localStorage on mount
  useEffect(() => {
    setIsMounted(true);
    setWelcomePopupOpen(true);

    const storedUrls = localStorage.getItem('cameraUrls');
    if (storedUrls) {
      const parsedUrls = JSON.parse(storedUrls);
      const newUrls = Array(9).fill('');
      parsedUrls.slice(0, 9).forEach((url: string, i: number) => {
        newUrls[i] = url;
      });
      setUrls(newUrls);
    }
    const storedNumCameras = localStorage.getItem('numCameras');
    if (storedNumCameras) {
      setNumCameras(parseInt(storedNumCameras, 10));
    }
    const storedGap = localStorage.getItem('gridGap');
    if (storedGap) {
      setGridGap(parseInt(storedGap, 10));
    }
    const storedBorderColor = localStorage.getItem('borderColor');
    if (storedBorderColor) {
      setBorderColor(storedBorderColor);
    }
    const storedChatEnabled = localStorage.getItem('isChatEnabled');
    if (storedChatEnabled) {
      setIsChatEnabled(JSON.parse(storedChatEnabled));
    }
    const storedEventGrouping = localStorage.getItem('eventGrouping');
    if (storedEventGrouping) {
      try {
        const parsed = JSON.parse(storedEventGrouping);
        if (typeof parsed === 'object' && parsed !== null && 'all' in parsed) {
          setEventGrouping({ ...defaultEventGrouping, ...parsed });
        }
      } catch (e) {
        console.error("Failed to parse eventGrouping from localStorage", e);
      }
    }
    const storedScheduledChanges = localStorage.getItem('scheduledChanges');
    if (storedScheduledChanges) {
        try {
            const parsedChanges: ScheduledLayoutChange[] = JSON.parse(storedScheduledChanges);
            const now = new Date();

            const upcomingChanges = parsedChanges.filter(change => {
                if (!change.date || !change.time) return false; // Discard invalid/old entries
                const scheduledDateTime = new Date(`${change.date}T${change.time}`);
                return scheduledDateTime >= now;
            });

            setScheduledChanges(upcomingChanges);
            
            if (upcomingChanges.length !== parsedChanges.length) {
                localStorage.setItem('scheduledChanges', JSON.stringify(upcomingChanges));
            }
        } catch (e) {
            console.error("Failed to parse or filter scheduledChanges from localStorage", e);
        }
    }
  }, []);

  // Save to localStorage on change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cameraUrls', JSON.stringify(urls));
      localStorage.setItem('numCameras', numCameras.toString());
      localStorage.setItem('gridGap', gridGap.toString());
      localStorage.setItem('borderColor', borderColor);
      localStorage.setItem('isChatEnabled', JSON.stringify(isChatEnabled));
      localStorage.setItem('eventGrouping', JSON.stringify(eventGrouping));
      localStorage.setItem('scheduledChanges', JSON.stringify(scheduledChanges));
    }
  }, [urls, numCameras, gridGap, borderColor, isChatEnabled, eventGrouping, scheduledChanges, isMounted]);

  // Scheduler Execution Logic
  useEffect(() => {
    if (!isMounted) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      
      const dueChanges = scheduledChanges.filter(change => {
        if (!change.date || !change.time) return false;
        const scheduledDateTime = new Date(`${change.date}T${change.time}`);
        return now >= scheduledDateTime;
      });

      if (dueChanges.length > 0) {
        dueChanges.sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
        const changeToApply = dueChanges[dueChanges.length - 1];

        setNumCameras(changeToApply.numCameras);
        
        const newUrls = Array(9).fill('');
        changeToApply.urls.forEach((url, i) => {
            if (i < newUrls.length) {
                newUrls[i] = url;
            }
        });
        setUrls(newUrls);

        const upcomingChanges = scheduledChanges.filter(change => {
          if (!change.date || !change.time) return false;
          const scheduledDateTime = new Date(`${change.date}T${change.time}`);
          return now < scheduledDateTime;
        });
        setScheduledChanges(upcomingChanges);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(intervalId);
  }, [isMounted, scheduledChanges]);

  const handleGridGapChange = (value: number[]) => {
    const newGap = value[0];
    setGridGap(newGap);
  };

  const handleBorderColorChange = (color: string) => {
    setBorderColor(color);
  };
  
  const handleRestoreDefaults = () => {
    const defaultGap = 0;
    const defaultColor = '#18181b'; 
    setGridGap(defaultGap);
    setBorderColor(defaultColor);
  };

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    try {
      const response = await fetch('https://agenda-dpt.vercel.app/api/events');
      if (!response.ok) {
        throw new Error('No se pudieron cargar los eventos.');
      }
      const data = await response.json();
      const processedData = data.map((event: any) => {
        const newButtons = [...(event.buttons || [])];
        const newOptions = (event.options || []).map((option: string, index: number) => {
          let currentOption = option;
          
          if (currentOption === 'https://p.alangulotv.space/?channel=disneysiestsenpcwindowsusaestaextensinsoloarg') {
            currentOption = 'https://p.alangulotv.space/?channel=transmi1';
          }

          if (currentOption && typeof currentOption === 'string' && currentOption.includes('streamtpglobal.com')) {
              try {
                  const url = new URL(currentOption);
                  const streamParam = url.searchParams.get('stream');
                  if (streamParam) {
                      newButtons[index] = streamParam.toUpperCase();
                  }
              } catch (e) {
                  // Not a valid URL, ignore
              }
          }
          return currentOption;
        });

        const newEvent = {
            ...event,
            options: newOptions,
            buttons: newButtons,
        };
        
        const ecdfImage = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/22/Football_of_Ecuador_-_Liga_Pro_logo_%28mini%29.svg/1200px-Football_of_Ecuador_-_Liga_Pro_logo_%28mini%29.svg.png';
        if (newEvent.buttons?.some((b: string) => b?.toLowerCase() === 'ecdf')) {
          newEvent.image = ecdfImage;
        }

        if (!newEvent.image) {
          newEvent.image = 'https://cdn-icons-png.flaticon.com/512/9192/9192710.png';
        }

        return newEvent;
      });
      const merged = mergeDuplicateEvents(processedData);
      setEvents(merged);
    } catch (err) {
      if (err instanceof Error) {
          setEventsError(err.message);
      } else {
          setEventsError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoadingEvents(false);
    }
  };

  useEffect(() => {
    const fetchStatuses = async () => {
      setIsLoadingStatuses(true);
      try {
        const response = await fetch('https://corsproxy.io/?https%3A%2F%2Fstreamtpglobal.com%2Fstatus.json');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        const statuses = data.reduce((acc: Record<string, 'online' | 'offline'>, item: any) => {
          if (item.Canal) {
            acc[item.Canal] = item.Estado === 'Activo' ? 'online' : 'offline';
          }
          return acc;
        }, {});
        setChannelStatuses(statuses);
      } catch (error) {
        console.error("Failed to fetch channel statuses:", error);
      } finally {
        setIsLoadingStatuses(false);
      }
    };
    
    fetchStatuses();
    fetchEvents();
  }, []);

  useEffect(() => {
    const processAndSetEvents = () => {
      if (!events.length) {
        setProcessedEvents([]);
        return;
      }
      
      const timeZone = 'America/Argentina/Buenos_Aires';
      const now = toZonedTime(new Date(), timeZone);
      const currentHour = now.getHours();

      const eventsWithStatus = events
        .map(e => {
            // Force 'En Vivo' for embedrun.store links
            if (e.options.some(opt => opt.includes('embedrun.store'))) {
                return { ...e, status: 'En Vivo' as const };
            }

            // Handle 24/7 events first, they are always 'En Vivo'
            if (e.title.includes('24/7')) {
              return { ...e, status: 'En Vivo' as const };
            }
            
            // Calculate start and end times for all other events
            const eventStart = toZonedTime(`${e.date}T${e.time}:00`, timeZone);
            if (isNaN(eventStart.getTime())) {
              return { ...e, status: 'Finalizado' as const };
            }
            
            let durationInHours = 3; // Default duration
            const durationMatch = e.title.match(/(\d+)\s*(?:hs|horas)/i);
            if (durationMatch && durationMatch[1]) {
                durationInHours = parseInt(durationMatch[1], 10) + 1;
            }
            const eventEnd = addHours(eventStart, durationInHours);
            
            let theoreticalStatus: Event['status'];
            if (isAfter(now, eventEnd)) {
                theoreticalStatus = 'Finalizado';
            } else if (isAfter(now, eventStart)) {
                theoreticalStatus = 'En Vivo';
            } else {
                theoreticalStatus = 'Próximo';
            }

            // Apply the "Desconocido" override only if the event is not already 'En Vivo' or 'Finalizado'
            if (theoreticalStatus === 'Próximo' && (currentHour >= 21 || currentHour < 6)) {
                return { ...e, status: 'Desconocido' as const };
            }

            return { ...e, status: theoreticalStatus };
        });

      setProcessedEvents(eventsWithStatus);
    };

    processAndSetEvents();
    const timerId = setInterval(processAndSetEvents, 60000);

    return () => clearInterval(timerId);
  }, [events]);

  if (!isMounted) {
    return <Loading />;
  }
  
  const urlsToDisplay = urls.slice(0, numCameras);

  if (urlsToDisplay.filter(url => url && url.trim() !== "").length === 0) {
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

  const numIframes = numCameras;
  let gridContainerClasses = "grid flex-grow w-full h-full";

  switch (numIframes) {
    case 1:
      gridContainerClasses += " grid-cols-1 grid-rows-1";
      break;
    case 2:
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1";
      break;
    case 3:
      // Special responsive layout for 3 windows
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 md:grid-rows-2";
      break;
    case 4:
      gridContainerClasses += " grid-cols-1 md:grid-cols-2 grid-rows-4 md:grid-rows-2";
      break;
    case 6:
      gridContainerClasses += " grid-cols-1 md:grid-cols-3 grid-rows-6 md:grid-rows-2";
      break;
    case 9:
      gridContainerClasses += " grid-cols-1 md:grid-cols-3 grid-rows-9 md:grid-rows-3";
      break;
    default:
      gridContainerClasses += " grid-cols-1 grid-rows-1";
  }


  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
       <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
          <DialogContent className="sm:max-w-md p-0">
              <div className="relative">
                  <Progress value={progress} indicatorClassName="bg-primary" className="absolute top-0 left-0 right-0 h-1 rounded-none" />
              </div>
              <DialogHeader className="p-6 pt-8 text-center">
                  <DialogTitle>¡Bienvenido a Deportes para Todos!</DialogTitle>
              </DialogHeader>
              <div className="px-6 pb-6 text-sm text-muted-foreground">
                  <p>Si encuentras algún problema o no estás seguro de cómo funciona algo, consulta nuestras guías rápidas.</p>
              </div>
              <DialogFooter className="flex-row items-center justify-center gap-2 p-6 pt-0">
                  <Dialog>
                      <DialogTrigger asChild>
                          <Button variant="outline"><HelpCircle className="mr-2 h-4 w-4" />Tutorial</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                          <DialogHeader>
                              <DialogTitle>Tutorial de Uso</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                              <p>¡Bienvenido a Deportes para Todos! Esta guía te ayudará a sacar el máximo provecho de la plataforma.</p>
                              <h4 className="font-semibold text-foreground pt-2">Paso 1: Selecciona la cantidad de ventanas</h4>
                              <p>Usa el menú desplegable en el centro de la pantalla para elegir cuántas transmisiones quieres ver simultáneamente. Puedes seleccionar entre 1, 2, 3, 4, 6 o 9 ventanas.</p>
                              <h4 className="font-semibold text-foreground pt-2">Paso 2: Elige tus canales o eventos</h4>
                              <p>Para cada una de las ventanas que seleccionaste, verás un botón que dice "Elegir Canal…". Haz clic en él para abrir un diálogo con dos pestañas:</p>
                              <ul className="list-disc pl-6 space-y-1">
                                  <li><strong>Canales:</strong> Una lista de canales de televisión disponibles 24/7. Puedes usar la barra de búsqueda para encontrar uno rápidamente.</li>
                                  <li><strong>Eventos:</strong> Una lista de eventos deportivos en vivo o próximos a comenzar. Los eventos están agrupados por competición (puedes desactivar esto en la configuración).</li>
                              </ul>
                              <p>Simplemente haz clic en "Seleccionar" en el canal o evento que desees, y se asignará a esa ventana. También puedes pegar un enlace de video directamente desde el portapapeles.</p>
                              <h4 className="font-semibold text-foreground pt-2">Paso 3: Inicia la vista</h4>
                              <p>Una vez que hayas configurado todas tus ventanas, presiona el botón "Iniciar Vista". Esto te llevará a una nueva página donde verás todas tus transmisiones seleccionadas en la disposición que elegiste.</p>
                              <h4 className="font-semibold text-foreground pt-2">Configuraciones Adicionales</h4>
                              <p>En el menú principal (arriba a la izquierda) encontrarás la sección de "Configuración", donde puedes personalizar tu experiencia:</p>
                              <ul className="list-disc pl-6 space-y-1">
                                  <li><strong>Bordes:</strong> Ajusta el tamaño y el color de los bordes entre las ventanas de video.</li>
                                  <li><strong>Chat:</strong> Activa o desactiva el chat en vivo en la página de visualización.</li>
                                  <li><strong>Eventos:</strong> Activa o desactiva la agrupación de eventos por competición.</li>
                              </ul>
                              <h4 className="font-semibold text-foreground pt-2">Consejos Útiles</h4>
                              <ul className="list-disc pl-6 space-y-1">
                                  <li>Puedes mover las ventanas hacia arriba o hacia abajo usando las flechas junto a cada selección.</li>
                                  <li>Si un canal aparece como "Inactivo", es posible que no funcione.</li>
                                  <li>Para cualquier problema, consulta las secciones de "Errores" o "Contacto" en el menú.</li>
                              </ul>
                          </div>
                      </DialogContent>
                  </Dialog>
                  <Dialog>
                      <DialogTrigger asChild>
                          <Button variant="outline"><AlertCircle className="mr-2 h-4 w-4" />Errores</Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                          <DialogHeader>
                              <DialogTitle>Solución de Errores Comunes</DialogTitle>
                          </DialogHeader>
                          <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                              <p>En ocasiones, para reproducir los videos en esta página, es posible que necesites realizar una de las siguientes acciones. A continuación, te explicamos cuáles son y para qué sirven.</p>
                              <h4 className="font-semibold text-foreground">Solución 1: Configurar el DNS de Cloudflare (1.1.1.1)</h4>
                              <p>Si los videos no cargan o no se pueden reproducir, el primer paso que puedes intentar es cambiar el DNS de tu dispositivo.</p>
                              <h5 className="font-semibold text-foreground pt-2">¿Qué es y para qué sirve?</h5>
                              <p>El DNS (Sistema de Nombres de Dominio) es como una agenda de contactos de internet que traduce los nombres de las páginas web (como www.ejemplo.com) a una dirección IP numérica que las computadoras pueden entender. A veces, el DNS que te asigna tu proveedor de internet puede ser lento o bloquear el acceso a ciertos contenidos.</p>
                              <p>Al cambiar tu DNS a <strong>1.1.1.1</strong>, que es el servicio de DNS gratuito de Cloudflare, estás utilizando un servicio que a menudo es más rápido y privado. Esto puede resolver problemas de conexión y permitir que tu dispositivo acceda a los videos que antes no podía cargar.</p>
                              <Separator className="my-4" />
                              <h4 className="font-semibold text-foreground">Solución 2: Instalar la extensión "Reproductor MPD/M3U8/M3U/EPG"</h4>
                              <p>Si cambiar el DNS no soluciona el problema, la otra alternativa es instalar una extensión en tu navegador Google Chrome.</p>
                              <p><strong>Extensión:</strong> Reproductor MPD/M3U8/M3U/EPG</p>
                              <h5 className="font-semibold text-foreground pt-2">¿Qué es y para qué sirve?</h5>
                              <p>Algunos videos en internet se transmiten en formatos especiales como M3U8 o MPD. No todos los navegadores web pueden reproducir estos formatos de forma nativa sin ayuda.</p>
                              <p>Esta extensión de Chrome funciona como un reproductor de video especializado que le añade a tu navegador la capacidad de entender y decodificar estos formatos de transmisión. Al instalarla, le das a Chrome las herramientas necesarias para que pueda reproducir correctamente los videos de la página.</p>
                              <Separator className="my-4" />
                              <h4 className="font-semibold text-foreground">Otras Soluciones Rápidas</h4>
                              <p>Si las soluciones anteriores no funcionan, aquí tienes otras acciones que puedes intentar y que resuelven problemas comunes:</p>
                              <ul className="list-disc pl-6 space-y-2">
                                  <li><strong>Cambiar de navegador:</strong> A veces, ciertos navegadores (o sus configuraciones) pueden causar conflictos. Prueba usar uno diferente como Google Chrome, Mozilla Firefox o Microsoft Edge para ver si el problema persiste.</li>
                                  <li><strong>Desactivar Adblocker:</strong> Los bloqueadores de anuncios a veces pueden interferir con la carga de los reproductores de video. Intenta desactivar tu Adblocker temporalmente para este sitio y vuelve a cargar la página.</li>
                                  <li><strong>Uso en dispositivos móviles:</strong> Esta plataforma está optimizada para su uso en computadoras de escritorio. Si bien puede funcionar en celulares o tabletas, la experiencia puede no ser la ideal y es más propensa a errores. Recomendamos usar una PC para una mejor estabilidad.</li>
                                  <li><strong>Reiniciar el dispositivo:</strong> Un reinicio rápido de tu computadora o dispositivo puede solucionar problemas temporales de red, memoria o software que podrían estar afectando la reproducción.</li>
                              </ul>
                          </div>
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
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                  <Button size="icon" variant="ghost" className="bg-transparent hover:bg-accent/80 text-white h-10 w-10">
                      <Menu className="h-5 w-5" />
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-full sm:w-96 flex flex-col p-0">
                 <SheetHeader className="p-4 py-3 border-b">
                   <SheetTitle>Configuración:</SheetTitle>
                 </SheetHeader>
                 <div className="overflow-y-auto p-4 flex-grow">
                    {isLoadingEvents || isLoadingStatuses ? (
                      <div className="flex items-center justify-center h-full">
                          <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : (
                      <CameraConfigurationComponent
                            numCameras={numCameras}
                            setNumCameras={setNumCameras}
                            cameraUrls={urls}
                            setCameraUrls={setUrls}
                            messages={[]}
                            setMessages={() => {}}
                            handleStartView={() => {}}
                            channels={allChannels}
                            channelStatuses={channelStatuses}
                            setCameraStatuses={() => {}}
                            setAcknowledged={() => {}}
                            isLoadingChannelStatuses={isLoadingStatuses}
                            events={processedEvents}
                            isLoadingEvents={isLoadingEvents}
                            eventsError={eventsError}
                            hideStartButton={true}
                            onRefreshEvents={fetchEvents}
                            onReloadCamera={handleReloadCamera}
                            gridGap={gridGap}
                            borderColor={borderColor}
                            handleGridGapChange={handleGridGapChange}
                            handleBorderColorChange={handleRestoreDefaults}
                            isChatEnabled={isChatEnabled}
                            setIsChatEnabled={setIsChatEnabled}
                            eventGrouping={eventGrouping}
                            setEventGrouping={setEventGrouping}
                            scheduledChanges={scheduledChanges}
                            setScheduledChanges={setScheduledChanges}
                      />
                    )}
                 </div>
                 <div className="p-4 border-t space-y-2 shrink-0">
                     <Dialog>
                          <DialogTrigger asChild>
                              <Button variant="outline" className="justify-start w-full">
                                  <HelpCircle className="mr-2 h-4 w-4" />
                                  Tutorial
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                  <DialogTitle>Tutorial de Uso</DialogTitle>
                              </DialogHeader>
                              <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                                  <p>¡Bienvenido a Deportes para Todos! Esta guía te ayudará a sacar el máximo provecho de la plataforma.</p>
                                  <h4 className="font-semibold text-foreground pt-2">Paso 1: Selecciona la cantidad de ventanas</h4>
                                  <p>Usa el menú desplegable en el centro de la pantalla para elegir cuántas transmisiones quieres ver simultáneamente. Puedes seleccionar entre 1, 2, 3, 4, 6 o 9 ventanas.</p>
                                  <h4 className="font-semibold text-foreground pt-2">Paso 2: Elige tus canales o eventos</h4>
                                  <p>Para cada una de las ventanas que seleccionaste, verás un botón que dice "Elegir Canal…". Haz clic en él para abrir un diálogo con dos pestañas:</p>
                                  <ul className="list-disc pl-6 space-y-1">
                                      <li><strong>Canales:</strong> Una lista de canales de televisión disponibles 24/7. Puedes usar la barra de búsqueda para encontrar uno rápidamente.</li>
                                      <li><strong>Eventos:</strong> Una lista de eventos deportivos en vivo o próximos a comenzar. Los eventos están agrupados por competición (puedes desactivar esto en la configuración).</li>
                                  </ul>
                                  <p>Simplemente haz clic en "Seleccionar" en el canal o evento que desees, y se asignará a esa ventana. También puedes pegar un enlace de video directamente desde el portapapeles.</p>
                                  <h4 className="font-semibold text-foreground pt-2">Paso 3: Inicia la vista</h4>
                                  <p>Una vez que hayas configurado todas tus ventanas, presiona el botón "Iniciar Vista". Esto te llevará a una nueva página donde verás todas tus transmisiones seleccionadas en la disposición que elegiste.</p>
                                  <h4 className="font-semibold text-foreground pt-2">Configuraciones Adicionales</h4>
                                  <p>En el menú principal (arriba a la izquierda) encontrarás la sección de "Configuración", donde puedes personalizar tu experiencia:</p>
                                  <ul className="list-disc pl-6 space-y-1">
                                      <li><strong>Bordes:</strong> Ajusta el tamaño y el color de los bordes entre las ventanas de video.</li>
                                      <li><strong>Chat:</strong> Activa o desactiva el chat en vivo en la página de visualización.</li>
                                      <li><strong>Eventos:</strong> Activa o desactiva la agrupación de eventos por competición.</li>
                                  </ul>
                                  <h4 className="font-semibold text-foreground pt-2">Consejos Útiles</h4>
                                  <ul className="list-disc pl-6 space-y-1">
                                      <li>Puedes mover las ventanas hacia arriba o hacia abajo usando las flechas junto a cada selección.</li>
                                      <li>Si un canal aparece como "Inactivo", es posible que no funcione.</li>
                                      <li>Para cualquier problema, consulta las secciones de "Errores" o "Contacto" en el menú.</li>
                                  </ul>
                              </div>
                          </DialogContent>
                      </Dialog>
                     <Dialog>
                          <DialogTrigger asChild>
                              <Button variant="outline" className="justify-start w-full">
                                  <AlertCircle className="mr-2 h-4 w-4" />
                                  Errores
                              </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                  <DialogTitle>Solución de Errores Comunes</DialogTitle>
                              </DialogHeader>
                              <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                                  <p>En ocasiones, para reproducir los videos en esta página, es posible que necesites realizar una de las siguientes acciones. A continuación, te explicamos cuáles son y para qué sirven.</p>
                                  <h4 className="font-semibold text-foreground">Solución 1: Configurar el DNS de Cloudflare (1.1.1.1)</h4>
                                  <p>Si los videos no cargan o no se pueden reproducir, el primer paso que puedes intentar es cambiar el DNS de tu dispositivo.</p>
                                  <h5 className="font-semibold text-foreground pt-2">¿Qué es y para qué sirve?</h5>
                                  <p>El DNS (Sistema de Nombres de Dominio) es como una agenda de contactos de internet que traduce los nombres de las páginas web (como www.ejemplo.com) a una dirección IP numérica que las computadoras pueden entender. A veces, el DNS que te asigna tu proveedor de internet puede ser lento o bloquear el acceso a ciertos contenidos.</p>
                                  <p>Al cambiar tu DNS a <strong>1.1.1.1</strong>, que es el servicio de DNS gratuito de Cloudflare, estás utilizando un servicio que a menudo es más rápido y privado. Esto puede resolver problemas de conexión y permitir que tu dispositivo acceda a los videos que antes no podía cargar.</p>
                                  <Separator className="my-4" />
                                  <h4 className="font-semibold text-foreground">Solución 2: Instalar la extensión "Reproductor MPD/M3U8/M3U/EPG"</h4>
                                  <p>Si cambiar el DNS no soluciona el problema, la otra alternativa es instalar una extensión en tu navegador Google Chrome.</p>
                                  <p><strong>Extensión:</strong> Reproductor MPD/M3U8/M3U/EPG</p>
                                  <h5 className="font-semibold text-foreground pt-2">¿Qué es y para qué sirve?</h5>
                                  <p>Algunos videos en internet se transmiten en formatos especiales como M3U8 o MPD. No todos los navegadores web pueden reproducir estos formatos de forma nativa sin ayuda.</p>
                                  <p>Esta extensión de Chrome funciona como un reproductor de video especializado que le añade a tu navegador la capacidad de entender y decodificar estos formatos de transmisión. Al instalarla, le das a Chrome las herramientas necesarias para que pueda reproducir correctamente los videos de la página.</p>
                                  <Separator className="my-4" />
                                  <h4 className="font-semibold text-foreground">Otras Soluciones Rápidas</h4>
                                  <p>Si las soluciones anteriores no funcionan, aquí tienes otras acciones que puedes intentar y que resuelven problemas comunes:</p>
                                  <ul className="list-disc pl-6 space-y-2">
                                      <li><strong>Cambiar de navegador:</strong> A veces, ciertos navegadores (o sus configuraciones) pueden causar conflictos. Prueba usar uno diferente como Google Chrome, Mozilla Firefox o Microsoft Edge para ver si el problema persiste.</li>
                                      <li><strong>Desactivar Adblocker:</strong> Los bloqueadores de anuncios a veces pueden interferir con la carga de los reproductores de video. Intenta desactivar tu Adblocker temporalmente para este sitio y vuelve a cargar la página.</li>
                                      <li><strong>Uso en dispositivos móviles:</strong> Esta plataforma está optimizada para su uso en computadoras de escritorio. Si bien puede funcionar en celulares o tabletas, la experiencia puede no ser la ideal y es más propensa a errores. Recomendamos usar una PC para una mejor estabilidad.</li>
                                      <li><strong>Reiniciar el dispositivo:</strong> Un reinicio rápido de tu computadora o dispositivo puede solucionar problemas temporales de red, memoria o software que podrían estar afectando la reproducción.</li>
                                  </ul>
                              </div>
                          </DialogContent>
                      </Dialog>
                 </div>
              </SheetContent>
          </Sheet>
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
          {urlsToDisplay.map((url: string, index: number) => {
            
            const windowClasses: string[] = ["overflow-hidden", "relative", "bg-background"];
            if (!url) {
                windowClasses.push("bg-red-500", "flex", "items-center", "justify-center", "text-destructive-foreground", "font-bold");
            }
             if (numIframes === 3) {
              // Special layout for 3 windows on desktop
              windowClasses.push(
                'md:col-span-1 md:row-span-1', // Default for all three on desktop
                index === 0 ? 'md:col-span-2' : '' // First item spans two columns on desktop
              );
            }
            
            return (
              <div
                key={`${url}-${reloadCounters[index]}`}
                className={cn(windowClasses)}
              >
                {url ? (
                  <iframe
                    src={url}
                    title={`Stream ${index + 1}`}
                    className="w-full h-full border-0"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  "ELEGIR CANAL/EVENTO..."
                )}
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
