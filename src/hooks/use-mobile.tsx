'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Tv, X, Search, RotateCw, FileText, AlertCircle, Mail, BookOpen, Play, Settings, Menu, ArrowLeft, Pencil, Trash2, MessageSquare, Maximize, Minimize, AlertTriangle, Plus, BellRing, Airplay, CalendarDays, Copy, Check, LayoutGrid, ArrowUp, ArrowDown, Star } from 'lucide-react';
import type { Event, StreamOption } from '@/components/event-carousel'; 
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
  SheetFooter,
  SheetClose,
} from "@/components/ui/sheet";
import { 
    Dialog,
    DialogPortal,
    DialogContent,
    DialogHeader,
    DialogTitle as DialogModalTitle,
    DialogDescription,
    DialogFooter,
    DialogClose as DialogModalClose,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { channels } from '@/components/channel-list';
import type { Channel } from '@/components/channel-list';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EventCard } from '@/components/event-card';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Badge } from '@/components/ui/badge';
import { LayoutConfigurator } from '@/components/layout-configurator';
import { toZonedTime, format } from 'date-fns-tz';
import { addHours, isBefore, isAfter, parse, differenceInMinutes, isValid, isPast, isFuture, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoadingScreen } from '@/components/loading-screen';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScheduleManager } from '@/components/schedule-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationManager } from '@/components/notification-manager';
import type { Subscription, Schedule } from '@/components/schedule-manager';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Realtime } from 'ably';
import { AddEventsDialog } from '@/components/add-events-dialog';
import { EventSelectionDialog } from '@/components/event-selection-dialog';
import { PresetsDialog } from '@/components/presets-dialog';
import type { Preset } from '@/components/presets-dialog';
import type { APIMatch } from '@/components/featured-match-card';
import { FeaturedMatchCard } from '@/components/featured-match-card';


interface StreamedMatch {
  id: string;
  title: string;
  category: string;
  date: number; // Timestamp in milliseconds
  poster?: string;
  teams?: {
      home: { name: string; badge: string };
      away: { name: string; badge: string };
  };
  sources: { source: string; id: string }[];
}

interface StreamTpEvent {
    title: string;
    time: string;
    category: string;
    status: string; // "en vivo", "pronto"
    link: string;
}

interface AgendaEvent {
  time: string;
  title: string;
  options: string[];
  buttons: string[];
  category: string;
  language: string;
  date: string;
  source: string;
  image: string;
  status: string;
}

const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);

const normalizeCategory = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'football' || lowerCategory === 'fútbol' || lowerCategory === 'fútbol_cup') {
        return 'Fútbol';
    }
    return category;
};

export type AppState = {
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  gridGap: number;
  borderColor: string;
  isChatEnabled: boolean;
  schedules: Schedule[];
  fullscreenIndex: number | null;
};

type AblyMessage = {
    name: string;
    data: any;
};

export function HomePageContent() {
  const isMobile = useIsMobile();
  const remoteControlContainerRef = useRef<HTMLDivElement>(null);
  
  const [appState, setAppState] = useState<AppState>({
    selectedEvents: Array(9).fill(null),
    viewOrder: Array.from({ length: 9 }, (_, i) => i),
    gridGap: 0,
    borderColor: '#000000',
    isChatEnabled: true,
    schedules: [],
    fullscreenIndex: null,
  });
  
  const { selectedEvents, viewOrder, gridGap, borderColor, isChatEnabled, schedules, fullscreenIndex } = appState;
  
  // Ably and Remote Control state
  const ablyClientRef = useRef<Realtime | null>(null);
  const channelRef = useRef<any>(null);
  const [remoteControlMode, setRemoteControlMode] = useState<'inactive' | 'controlled' | 'controlling'>('inactive');
  const [controlledSessionCode, setControlledSessionCode] = useState('');
  
  // State for the controlling view specifically
  const [isControlling, setIsControlling] = useState(false);
  
  // This state will hold a COPY of the main app state for the controller UI.
  // It gets updated from Ably messages.
  const [controllerAppState, setControllerAppState] = useState<AppState | null>(null);


  // Presets State
  const [customPresets, setCustomPresets] = useState<Preset[]>([]);


  // This function is for the controller to SEND updates.
  const setLiveAppState = useCallback((newState: Partial<AppState>) => {
    if (isControlling && controllerAppState) {
        // Optimistically update the controller's local state
        const updatedState: AppState = { ...controllerAppState, ...newState };
        setControllerAppState(updatedState);
        
        // Publish the new state to the controlled device
        if (channelRef.current) {
            channelRef.current.publish('action', {
                type: 'SET_APP_STATE',
                payload: updatedState,
            });
        }
    } else {
        // This is the normal state update for the main view
        setAppState(prevState => {
            const updatedState: AppState = { ...prevState, ...newState };
            // Ensure selectedEvents is always an array
            if (!Array.isArray(updatedState.selectedEvents) || updatedState.selectedEvents === null) {
                updatedState.selectedEvents = Array(9).fill(null);
            }
             // Re-hydrate Date objects when setting schedules
            if (updatedState.schedules) {
                updatedState.schedules = updatedState.schedules.map((s: any) => ({
                    ...s,
                    dateTime: s.dateTime ? new Date(s.dateTime) : new Date() 
                }));
            }
            // If this instance is being controlled, it should send its new state back to the controller.
            if (remoteControlMode === 'controlled' && channelRef.current) {
                channelRef.current.publish('state-update', { appState: updatedState });
            }
            return updatedState;
        });
    }
}, [isControlling, controllerAppState, remoteControlMode]);


  const setSelectedEvents = (events: (Event | null)[]) => setLiveAppState({ selectedEvents: events });
  const setViewOrder = (order: number[]) => setLiveAppState({ viewOrder: order });
  const setSchedules = (newSchedules: Schedule[]) => setLiveAppState({ schedules: newSchedules });


  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  // View mode state
  const [isViewMode, setIsViewMode] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [reloadCounters, setReloadCounters] = useState<number[]>(Array(9).fill(0));
  const [welcomePopupOpen, setWelcomePopupOpen] = useState(false);
  const [progress, setProgress] = useState(100);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [areControlsVisible, setAreControlsVisible] = useState(true);

  // Home mode state
  const [events, setEvents] = useState<Event[]>([]);
  const [channelsData, setChannelsData] = useState<Channel[]>(channels);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number | null>(null);
  const [featuredMatches, setFeaturedMatches] = useState<APIMatch[]>([]);

  
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('home');
  const [dialogContext, setDialogContext] = useState<'main' | 'schedule'>('main');

  
  // Dialog/Popup states
  const [addEventsDialogOpen, setAddEventsDialogOpen] = useState(false);
  const [eventSelectionDialogOpen, setEventSelectionDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [scheduleManagerOpen, setScheduleManagerOpen] = useState(false);
  const [notificationManagerOpen, setNotificationManagerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isAddEventsLoading, setIsAddEventsLoading] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isErrorsOpen, setIsErrorsOpen] = useState(false);
  const [remoteControlOptionsOpen, setRemoteControlOptionsOpen] = useState(false);
  const [presetsDialogOpen, setPresetsDialogOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [legalNoticeOpen, setLegalNoticeOpen] = useState(false);
  
  const [isControllerPromptOpen, setIsControllerPromptOpen] = useState(false);
  const [controllerCode, setControllerCode] = useState('');
  const [isControlledSessionDialog, setIsControlledSessionDialog] = useState(false);
  const [copied, setCopied] = useState(false);

  // Sheet state
  const [isSettingsSheetOpen, setIsSettingsSheetOpen] = useState(false);

  const { toast } = useToast();

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
  
  const fetchEvents = useCallback(async (manualTrigger = false, fromDialog = false) => {
    const now = Date.now();
    const thirtyMinutes = 30 * 60 * 1000;

    if (!manualTrigger && isInitialLoadDone && lastFetchTimestamp && (now - lastFetchTimestamp < thirtyMinutes)) {
        console.log("Skipping fetch, data is fresh.");
        return;
    }
    
    if (manualTrigger && !fromDialog) {
        setIsDataLoading(true);
    } else if (fromDialog) {
        setIsAddEventsLoading(true);
    } else {
        setIsDataLoading(true);
    }
    
    try {
      const endpointsToScrape = [
        { name: 'live', url: 'https://streamed.pk/api/matches/live' },
        { name: 'all-today', url: 'https://streamed.pk/api/matches/all-today' },
        { name: 'sports', url: 'https://streamed.pk/api/sports' },
      ];
      
      const otherEndpoints = [
        { name: 'streamtp', url: '/api/streams?type=streamtp' },
        { name: 'agenda', url: '/api/streams?type=agenda' },
      ];

      const mainSportCategories = ['football', 'basketball', 'tennis', 'mma', 'motorsports'];
      const featuredMatchesPromises = mainSportCategories.map(sport =>
        fetch(`https://streamed.pk/api/matches/${sport}/popular`).then(res => res.ok ? res.json() : [])
      );


      // Fetch scraped endpoints with error handling
      const scrapedResults: Record<string, any> = {};
      try {
        const scrapePromises = endpointsToScrape.map(endpoint => 
          fetch(`/api/streams?type=${endpoint.name}`).then(async res => {
            if (!res.ok) {
              const errorText = await res.text();
              console.error(`Error fetching ${endpoint.name}: ${res.status} ${res.statusText}`, errorText);
              return { name: endpoint.name, data: [] }; // Return empty on error
            }
            return { name: endpoint.name, data: await res.json() };
          })
        );
        const results = await Promise.all(scrapePromises);
        results.forEach(result => {
          scrapedResults[result.name] = result.data;
        });

      } catch (scrapeError) {
          console.error("Critical error during scraping, continuing with empty data:", scrapeError);
          endpointsToScrape.forEach(ep => scrapedResults[ep.name] = []);
      }


      // Fetch other endpoints in parallel
      const otherResults = await Promise.allSettled(
        otherEndpoints.map(ep => fetch(ep.url).then(res => {
          if (res.ok) return res.json();
          return Promise.reject(new Error(`Failed to fetch ${ep.url} with status ${res.status}`));
        }))
      );

       // Fetch and process featured matches
      const featuredMatchesResults = await Promise.allSettled(featuredMatchesPromises);
      let tempFeaturedMatches: APIMatch[] = [];
      const seenMatchIds = new Set<string>();

      featuredMatchesResults.forEach(result => {
          if (result.status === 'fulfilled' && Array.isArray(result.value) && result.value.length > 0) {
              result.value.forEach((match: APIMatch) => {
                  if (match.popular && new Date(match.date).getTime() > Date.now() && !seenMatchIds.has(match.id)) {
                      tempFeaturedMatches.push(match);
                      seenMatchIds.add(match.id);
                  }
              });
          }
      });
      // Sort all featured matches chronologically
      tempFeaturedMatches.sort((a, b) => a.date - b.date);
      setFeaturedMatches(tempFeaturedMatches);
      
      const getOtherData = <T,>(name: string): T[] => {
        const result = otherResults.find((r, i) => otherEndpoints[i].name === name);
        if (result?.status === 'fulfilled' && Array.isArray(result.value)) {
          return result.value as T[];
        }
        if (result?.status === 'rejected') {
            console.error(`Error fetching ${name}:`, result.reason);
        }
        return [];
      };

      setLastFetchTimestamp(Date.now()); 

      const liveData: StreamedMatch[] = Array.isArray(scrapedResults.live) ? scrapedResults.live : [];
      const todayData: StreamedMatch[] = Array.isArray(scrapedResults['all-today']) ? scrapedResults['all-today'] : [];
      const sportsData: {id: string; name: string}[] = Array.isArray(scrapedResults.sports) ? scrapedResults.sports : [];
      const streamTpData: StreamTpEvent[] = getOtherData<StreamTpEvent>('streamtp');
      const agendaData: AgendaEvent[] = getOtherData<AgendaEvent>('agenda');


      const allMatchesMap = new Map<string, StreamedMatch>();
      
      if (Array.isArray(todayData)) {
        todayData.forEach(match => allMatchesMap.set(match.id, match));
      }
      if (Array.isArray(liveData)) {
        liveData.forEach(match => allMatchesMap.set(match.id, match));
      }

      const combinedData = Array.from(allMatchesMap.values());

      const timeZone = 'America/Argentina/Buenos_Aires';
      
      const categoryMap = sportsData.reduce<Record<string, string>>((acc, sport) => {
          acc[sport.id] = sport.name;
          return acc;
      }, {});

      const initialEvents: Event[] = combinedData.map((match: StreamedMatch, index: number) => {
        const eventDate = new Date(match.date);
        const zonedEventTime = toZonedTime(eventDate, timeZone);
        const time = format(zonedEventTime, 'HH:mm');
        const date = format(zonedEventTime, 'yyyy-MM-dd');
        
        let status: Event['status'] = 'Desconocido';
        if (liveData.some(liveMatch => liveMatch.id === match.id)) {
            status = 'En Vivo';
        }

        let imageUrl = 'https://i.ibb.co/dHPWxr8/depete.jpg'; // Default image
        if (match.teams?.home?.badge && match.teams?.away?.badge) {
            imageUrl = `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`;
        } else if (match.poster) {
            imageUrl = `https://streamed.pk/api/images/proxy/${match.poster}.webp`;
        }


        return {
          id: `${match.title}-${date}-${time}-${index}-streamed.pk`,
          title: match.title,
          time,
          options: [], // Options will be fetched on demand
          sources: match.sources, 
          buttons: [],
          category: normalizeCategory(categoryMap[match.category] || match.category.charAt(0).toUpperCase() + match.category.slice(1)),
          language: '',
          date,
          source: 'streamed.pk',
          image: imageUrl,
          status: status,
        };
      });

      const streamTpEvents: Event[] = streamTpData.map((event, index) => {
          let status: Event['status'] = 'Desconocido';
          if (event.status.toLowerCase() === 'en vivo') {
              status = 'En Vivo';
          } else if (event.status.toLowerCase() === 'pronto') {
              status = 'Próximo';
          }
          
          let optionLabel = 'Ver';
          try {
              const url = new URL(event.link);
              optionLabel = url.searchParams.get('stream') || 'Ver';
          } catch (e) { /* ignore invalid URLs */ }

          let eventTime = event.time;
          try {
            const originalTime = parse(event.time, 'HH:mm', new Date());
            if (isValid(originalTime)) {
              const adjustedTime = addHours(originalTime, 2);
              eventTime = format(adjustedTime, 'HH:mm');
            }
          } catch(e) {
            console.error("Could not parse time for streamtpglobal event", e);
          }
          const date = format(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd');
          
          return {
              id: `${event.title}-${date}-${eventTime}-${index}-streamtpglobal`,
              title: event.title,
              time: eventTime,
              options: [{ url: event.link, label: optionLabel.toUpperCase(), hd: false, language: '' }],
              sources: [],
              buttons: [],
              category: normalizeCategory(event.category === 'Other' ? 'Otros' : event.category),
              language: '',
              date,
              source: 'streamtpglobal',
              image: 'https://i.ibb.co/dHPWxr8/depete.jpg',
              status: status,
          };
      });

      const agendaEvents: Event[] = agendaData.map((event: AgendaEvent, index: number): Event => {
          const streamOptions: StreamOption[] = event.options.map((optionUrl, index) => ({
            url: optionUrl,
            label: event.buttons[index] || `STREAM ${index + 1}`,
            hd: false, 
            language: event.language || '',
          }));

          return {
            id: `${event.title}-${event.date}-${index}-agenda`,
            title: event.title,
            time: '--:--',
            options: streamOptions,
            sources: [],
            buttons: event.buttons,
            category: normalizeCategory('Motor Sports'),
            language: event.language,
            date: event.date,
            source: event.source,
            image: event.image.replace(/\\/g, '/'), 
            status: 'Desconocido',
          };
      });

      const combinedInitialEvents = [...initialEvents, ...streamTpEvents, ...agendaEvents];
      
      setEvents(combinedInitialEvents);

    } catch (error) {
      console.error('Error in fetchEvents:', error);
      setEvents([]); 
    } finally {
        if (fromDialog) {
            setIsAddEventsLoading(false);
        } else {
            setIsDataLoading(false);
            if (!isInitialLoadDone) {
                setIsInitialLoadDone(true);
            }
        }
    }
  }, [isInitialLoadDone, lastFetchTimestamp]);

  const cleanupAbly = useCallback(() => {
    if (channelRef.current) {
        try { channelRef.current.detach(); } catch (e) { console.error("Error detaching from Ably channel:", e); }
    }
    if (ablyClientRef.current) {
        try {
            const state = ablyClientRef.current.connection.state;
            if (state === 'connecting' || state === 'connected' || state === 'suspended') {
                ablyClientRef.current.close();
            }
        } catch (e) { console.error("Error closing Ably connection:", e); }
    }
    channelRef.current = null;
    ablyClientRef.current = null;
  }, []);

  const handleStopView = useCallback(() => {
    setIsViewMode(false);
    setLiveAppState({ fullscreenIndex: null });
    // Fully reset remote control state when exiting view
    cleanupAbly();
    setRemoteControlMode('inactive');
    setControlledSessionCode('');
    sessionStorage.removeItem('isControlledSession');
    sessionStorage.removeItem('isControlledStart');
  }, [setLiveAppState, cleanupAbly]);


  // Load state from localStorage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
        const storedStateJSON = localStorage.getItem('appState');
        if (storedStateJSON) {
            const storedState: AppState = JSON.parse(storedStateJSON);
            const selectedEventsArray = (Array.isArray(storedState.selectedEvents) && storedState.selectedEvents.length > 0) ? storedState.selectedEvents : Array(9).fill(null);
            
            // Re-hydrate dates
            const schedulesArray = Array.isArray(storedState.schedules) ? storedState.schedules.map(s => ({
                ...s,
                dateTime: new Date(s.dateTime),
            })) : [];

            setAppState(prevState => ({
                ...prevState,
                ...storedState,
                selectedEvents: selectedEventsArray,
                schedules: schedulesArray,
            }));
        }

        const storedPresets = localStorage.getItem('customPresets');
        if (storedPresets) {
            setCustomPresets(JSON.parse(storedPresets));
        }

    } catch (e) {
        console.error("Failed to parse appState from localStorage", e);
        // If parsing fails, ensure we have a clean state
        setAppState({
            selectedEvents: Array(9).fill(null),
            viewOrder: Array.from({ length: 9 }, (_, i) => i),
            gridGap: 0,
            borderColor: '#000000',
            isChatEnabled: true,
            schedules: [],
            fullscreenIndex: null,
        });
    }
    
  }, []);

  // Popup logic
  useEffect(() => {
    if (isViewMode && !sessionStorage.getItem('isControlledStart')) {
      const hasVisited = sessionStorage.getItem('hasVisitedViewPage');
      if (!hasVisited) {
        setWelcomePopupOpen(true);
        sessionStorage.setItem('hasVisitedViewPage', 'true');
        setProgress(100);
      }
    }
  }, [isViewMode]);

  // Schedule activation checker
  useEffect(() => {
    if (!isViewMode || !schedules || schedules.length === 0) return;
  
    const interval = setInterval(() => {
        const now = new Date();
        const dueSchedules = schedules.filter(s => isBefore(s.dateTime, now));

        if (dueSchedules.length > 0) {
            const scheduleToApply = dueSchedules.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
            
            const newAppState: Partial<AppState> = {
                selectedEvents: scheduleToApply.events,
                viewOrder: scheduleToApply.order,
                schedules: schedules.filter(s => s.id !== scheduleToApply.id)
            };

            setLiveAppState(newAppState);

            if (remoteControlMode === 'controlled' && channelRef.current) {
                // This message now notifies the controller that an auto-update happened.
                channelRef.current.publish('state-update', { appState: { ...appState, ...newAppState } });
            }
        }
    }, 30000); 
  
    return () => clearInterval(interval);
  }, [isViewMode, schedules, appState, remoteControlMode, setLiveAppState]);


  useEffect(() => {
    if (!isInitialLoadDone) {
      fetchEvents();
    }
  }, [isInitialLoadDone, fetchEvents]);

  // Centralized state persistence
  useEffect(() => {
      // Only persist state if not in a controlled session
      if (isInitialLoadDone && !sessionStorage.getItem('isControlledSession')) {
          try {
             if (appState && Array.isArray(appState.selectedEvents)) {
                localStorage.setItem('appState', JSON.stringify(appState));
             }
          } catch (e) {
            console.error("Error saving appState to localStorage", e);
          }
      }
  }, [appState, isInitialLoadDone]);
  
  // URL reload effect
  useEffect(() => {
    if (isViewMode) {
      selectedEvents.forEach((event, i) => {
        const windowSlotIndex = viewOrder[i];
        if (typeof windowSlotIndex !== 'number') return;
        
        const iframe = iframeRefs.current[windowSlotIndex];
        const currentEvent = selectedEvents[windowSlotIndex];
        
        if (iframe && currentEvent?.selectedOption) {
            const newSrc = `${currentEvent.selectedOption}${currentEvent.selectedOption.includes('?') ? '&' : '?'}reload=${reloadCounters[windowSlotIndex] || 0}`;

            let currentSrc = 'about:blank';
            try {
                if (iframe.src && iframe.src !== 'about:blank') {
                    const url = new URL(iframe.src);
                    const targetUrl = new URL(currentEvent.selectedOption);
                    url.searchParams.delete('reload');
                    const cleanCurrentSrc = `${url.origin}${url.pathname}`;
                    const cleanTargetSrc = `${targetUrl.origin}${targetUrl.pathname}`;

                    if (cleanCurrentSrc === cleanTargetSrc) {
                        return; // Don't reload if base URL is the same
                    }
                }
            } catch(e) {
                // Handle cases where iframe.src is not a full URL, e.g., 'about:blank'
                currentSrc = iframe.src.split('?')[0];
                const targetSrc = currentEvent.selectedOption.split('?')[0];
                if(currentSrc === targetSrc) return;
            }

            // If we reach here, it means a reload is necessary
            iframe.src = newSrc;
        }
      });
    }
  }, [selectedEvents, isViewMode, reloadCounters, viewOrder]);


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
    if (welcomePopupOpen && !isTutorialOpen && !isErrorsOpen) {
      startTimer();
    } else {
      stopTimer();
    }
    return stopTimer;
  }, [welcomePopupOpen, startTimer, stopTimer, isTutorialOpen, isErrorsOpen]);

 useEffect(() => {
    if (!isViewMode || isMobile) {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      setAreControlsVisible(true);
      return;
    }

    const showAndResetTimer = () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      setAreControlsVisible(true);
      inactivityTimerRef.current = setTimeout(() => {
        setAreControlsVisible(false);
      }, 2500);
    };
    
    showAndResetTimer();
    window.addEventListener('mousemove', showAndResetTimer);

    return () => {
      window.removeEventListener('mousemove', showAndResetTimer);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [isViewMode, isMobile]);

  const handleOrderChange = (newOrder: number[]) => {
    if(newOrder) {
      const fullNewOrder = [...newOrder];
      const presentIndexes = new Set(newOrder);
      for(let i=0; i<9; i++) {
        if(!presentIndexes.has(i)) {
          fullNewOrder.push(i);
        }
      }
      setViewOrder(fullNewOrder);
    }
  };
  
  const handleRestoreGridSettings = () => {
    setLiveAppState({ gridGap: 0, borderColor: '#000000' });
  };
  
  const handleClearSelections = () => {
    setLiveAppState({ selectedEvents: Array(9).fill(null) });
  };

  const { searchResults, allSortedEvents, liveEvents, upcomingEvents, unknownEvents, finishedEvents, categoryFilteredEvents } = useMemo(() => {
    const statusOrder: Record<string, number> = { 'En Vivo': 1, 'Próximo': 2, 'Desconocido': 3, 'Finalizado': 4 };
    const placeholderImage = 'https://i.ibb.co/dHPWxr8/depete.jpg';
    const excludedFromFinished = new Set([
        "NBA TV", "MLB Network", "NHL Network", "Sky Sports News | SSN Breaking Sports News", 
        "ESPN First Take", "Sky Sports F1 | Sky F1", "DAZN Formula 1 | DAZN F1", "WWE Network", 
        "Tennis Channel", "Sky Sports Darts", "Darts TV: All Darts Championship", "NFL Network", 
        "ESPN", "Sky Sports Golf", "PGA Tour 2025", "NBC Golf Channel", "Fox NRL TV", "Wimbledon Open"
    ]);

    const normalizeTitle = (title: string): string => {
        const prefixes = /^(f[oó]rmula 1:|liga profesional:|amistoso:|primera nacional:|copa libertadores:|copa sudamericana:|f[uú]tbol:|wwe:|ufc:)/i;
        return title.replace(prefixes, '').trim().toLowerCase();
    };
    
    const combinedEvents = [...events];
    
    const eventMap = new Map<string, Event>();

    combinedEvents.forEach(event => {
        const key = normalizeTitle(event.title);
        const existingEvent = eventMap.get(key);

        if (existingEvent) {
            const newOptions = [...existingEvent.options, ...event.options];
            const uniqueOptions = Array.from(new Map(newOptions.map(item => [item.url, item])).values());

            const newSources = [...(existingEvent.sources || []), ...(event.sources || [])];
            const uniqueSources = Array.from(new Map(newSources.map(item => [`${item.source}|${item.id}`, item])).values());
            
            const newImage = (existingEvent.image && existingEvent.image !== placeholderImage) 
                             ? existingEvent.image 
                             : (event.image && event.image !== placeholderImage) 
                               ? event.image 
                               : placeholderImage;
                               
            const newTitle = event.title.includes(':') ? event.title : existingEvent.title;


            eventMap.set(key, {
                ...existingEvent,
                id: existingEvent.id, // Keep the ID of the first event encountered
                title: newTitle,
                image: newImage,
                options: uniqueOptions,
                sources: uniqueSources,
                status: existingEvent.status === 'En Vivo' || event.status === 'En Vivo' ? 'En Vivo' : existingEvent.status,
            });
        } else {
            eventMap.set(key, { ...event, image: event.image || placeholderImage, buttons: [] });
        }
    });

    const mergedEvents = Array.from(eventMap.values());
    
    const timeZone = 'America/Argentina/Buenos_Aires';
    const nowInBA = toZonedTime(new Date(), timeZone);
    const currentHour = nowInBA.getHours();
    const isNight = currentHour >= 20 || currentHour < 6;

    const processedEvents = mergedEvents.map(e => {
        let currentStatus = e.status;

        if (e.status === 'Desconocido' && e.time !== '--:--' && isValidTimeFormat(e.time)) {
             try {
                const eventDateTimeStr = `${e.date}T${e.time}:00`;
                const eventDate = new Date(eventDateTimeStr);
                
                if(isValid(eventDate)) {
                    const zonedEventTime = toZonedTime(eventDate, timeZone);
                    const eventEndTime = addHours(zonedEventTime, 3);
                    
                    if (isAfter(nowInBA, eventEndTime)) {
                        currentStatus = 'Finalizado';
                    } else if (isAfter(nowInBA, zonedEventTime) && isBefore(nowInBA, eventEndTime)) {
                        currentStatus = 'En Vivo';
                    } else if (isBefore(nowInBA, zonedEventTime)) {
                        currentStatus = 'Próximo';
                    }
                }
            } catch (error) {
                console.error("Error parsing date/time for status logic:", error);
            }
        }
        
        if (isNight && currentStatus === 'Próximo') {
            currentStatus = 'Desconocido';
        }

        return { ...e, status: currentStatus };
    });
    
    const liveSortLogic = (a: Event, b: Event): number => {
      return a.title.localeCompare(b.title);
    };
    
    const upcomingSortLogic = (a: Event, b: Event): number => {
        const now = new Date();
        const parseTime = (timeStr: string) => {
            if (!/^\d{2}:\d{2}$/.test(timeStr)) return null;
            const parsed = parse(timeStr, 'HH:mm', now);
            return isValid(parsed) ? parsed : null;
        };

        const timeA = parseTime(a.time);
        const timeB = parseTime(b.time);
        
        if (timeA && !timeB) return -1;
        if (!timeA && timeB) return 1;
        if (!timeA && !timeB) return a.title.localeCompare(b.title); // Fallback for invalid times
        
        const isPastA = isBefore(timeA!, now);
        const isPastB = isBefore(timeB!, now);
        
        if (isPastA && !isPastB) return 1;
        if (!isPastA && isPastB) return -1;
        
        return timeA!.getTime() - timeB!.getTime();
    };
    
    const unknownSortLogic = (a: Event, b: Event): number => {
        return upcomingSortLogic(a, b);
    };

    const allLiveEvents = processedEvents.filter(e => e.status === 'En Vivo').sort(liveSortLogic);
    const upcoming = processedEvents.filter(e => e.status === 'Próximo').sort(upcomingSortLogic);
    const unknown = processedEvents.filter(e => e.status === 'Desconocido').sort(unknownSortLogic);
    const finished = processedEvents.filter(e => e.status === 'Finalizado' && !excludedFromFinished.has(e.title)).sort((a,b) => b.time.localeCompare(a.time));
    
    const allSorted = [...allLiveEvents, ...upcoming, ...unknown, ...finished];
    

    let searchResults: (Event | Channel)[] = [];
    if (searchTerm) {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const eventsSource = currentView === 'home' || currentView === 'channels' || currentView === 'live'
            ? [...processedEvents]
            : [...processedEvents].filter(e => e.category.toLowerCase() === currentView.toLowerCase());
            
        const filteredEvents = eventsSource.filter(e => e.title.toLowerCase().includes(lowercasedFilter));
        const sChannels = (currentView === 'home' || currentView === 'channels') ? channelsData.filter(c => c.name.toLowerCase().includes(lowercasedFilter)) : [];
        
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
        const allCategoryEvents = [...processedEvents];
        const categoryEvents = allCategoryEvents
            .filter(event => event.category.toLowerCase() === currentView.toLowerCase());
        
        const liveCat = categoryEvents.filter(e => e.status === 'En Vivo').sort(liveSortLogic);
        const upcomingCat = categoryEvents.filter(e => e.status === 'Próximo').sort(upcomingSortLogic);
        const unknownCat = categoryEvents.filter(e => e.status === 'Desconocido').sort(unknownSortLogic);
        const finishedCat = categoryEvents.filter(e => e.status === 'Finalizado').sort((a,b) => b.time.localeCompare(a.time));

        categoryFilteredEvents = [...liveCat, ...upcomingCat, ...unknownCat, ...finishedCat];
    }

    return { 
        searchResults,
        allSortedEvents: allSorted,
        liveEvents: allLiveEvents,
        upcomingEvents: upcoming,
        unknownEvents: unknown,
        finishedEvents: finished,
        categoryFilteredEvents,
    };
  }, [events, searchTerm, currentView, channelsData]);


  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    [...events].forEach(event => {
        if (event.category) {
            const category = event.category.toLowerCase() === 'other' ? 'Otros' : event.category;
            categorySet.add(category);
        }
    });

    const allCategories = Array.from(categorySet);
    const otrosCategory = allCategories.find(c => c.toLowerCase() === 'otros');
    const motorSportsCategory = allCategories.find(c => c.toLowerCase() === 'motor sports');
    const otherCategories = allCategories.filter(c => c.toLowerCase() !== 'otros' && c.toLowerCase() !== 'motor sports').sort((a, b) => a.localeCompare(b));

    const sortedCategories = [...otherCategories];
    if (motorSportsCategory) {
        sortedCategories.unshift(motorSportsCategory);
    }
    if (otrosCategory) {
        sortedCategories.push(otrosCategory);
    }

    return sortedCategories;
  }, [events]);

  const getEventSelection = useCallback((event: Event): { isSelected: boolean; selectedOption: string | null; index: number } => {
    const selectionIndex = selectedEvents.findIndex(se => se?.id === event.id);

    if (selectionIndex !== -1) {
      const selectedEvent = selectedEvents[selectionIndex];
      return { 
        isSelected: true, 
        selectedOption: selectedEvent?.selectedOption || null, 
        index: selectionIndex 
      };
    }
    return { isSelected: false, selectedOption: null, index: -1 };
  }, [selectedEvents]);
  
  const findTargetIndex = useCallback((event: Event | null, sourceEvents: (Event|null)[]): number => {
    if (event === null) {
      return -1;
    }
    const existingSelection = getEventSelection(event);
    if (existingSelection.isSelected) {
      return existingSelection.index;
    }
    return sourceEvents.findIndex(e => e === null);
  }, [getEventSelection]);

  const handleEventSelect = (event: Event, optionUrl: string) => {
    const eventWithSelection = { ...event, selectedOption: optionUrl };
    
    navigator.clipboard.writeText(optionUrl).then(() => {
        toast({ title: '¡Enlace copiado!', description: 'El enlace de la transmisión se ha copiado al portapapeles.' });
    }).catch(err => {
        console.error('Failed to copy: ', err);
    });

    const newSelectedEvents = [...selectedEvents];
    const targetIndex = modificationIndex !== null ? modificationIndex : newSelectedEvents.findIndex(e => e === null);
    
    if (targetIndex !== -1) {
        newSelectedEvents[targetIndex] = eventWithSelection;
        setSelectedEvents(newSelectedEvents);
    } else {
         toast({ variant: 'destructive', title: 'Selección Completa', description: 'No puedes añadir más de 9 eventos. Elimina uno para añadir otro.' });
    }
    
    setEventSelectionDialogOpen(false);
    setAddEventsDialogOpen(false);
    setModificationIndex(null); // Reset after use
  };
  
  const handleEventRemove = useCallback((indexToRemove: number) => {
    const newSelectedEvents = [...selectedEvents];
    newSelectedEvents[indexToRemove] = null;
    setSelectedEvents(newSelectedEvents);
  }, [selectedEvents, setSelectedEvents]);
  
  const openDialogForEvent = async (event: Event) => {
    setDialogContext('main');
    
    let targetIndex: number;
    let eventForDialog = { ...event };
    
    if (modificationIndex !== null) {
      targetIndex = modificationIndex;
    } else {
      const existingSelection = getEventSelection(event);
      if (existingSelection.isSelected) {
          targetIndex = existingSelection.index;
          const selectedEventFromState = selectedEvents[targetIndex];
          if (selectedEventFromState?.selectedOption) {
              eventForDialog.selectedOption = selectedEventFromState.selectedOption;
          }
      } else {
          targetIndex = selectedEvents.findIndex(e => e === null);
          if (targetIndex === -1) {
              toast({ variant: 'destructive', title: 'Selección Completa', description: 'No puedes añadir más de 9 eventos. Elimina uno para añadir otro.' });
              return;
          }
      }
    }
    
    setModificationIndex(targetIndex);
    setDialogEvent(eventForDialog);
    setEventSelectionDialogOpen(true);

    // Fetch options if they aren't available
    const mainEventInState = events.find(e => e.id === event.id);
    const optionsAvailable = mainEventInState && mainEventInState.options.length > 0;

    if (event.source !== 'streamed.pk' || optionsAvailable) {
        if (optionsAvailable) {
            setDialogEvent({ ...eventForDialog, options: mainEventInState.options });
        }
        return;
    }

    setIsOptionsLoading(true);
    try {
        const sourcePromises = event.sources.map(async (source) => {
            try {
                const response = await fetch(`/api/streams?type=stream&source=${source.source}&id=${source.id}`);
                if (response.ok) {
                    const streams: any[] = await response.json();
                    if (Array.isArray(streams)) {
                        return streams.map(stream => ({
                            url: stream.embedUrl,
                            label: `${stream.language}${stream.hd ? ' HD' : ''} (${stream.source})`,
                            hd: stream.hd,
                            language: stream.language,
                        }));
                    }
                }
            } catch (e) {
                console.error(`Failed to fetch stream source: ${source.source}/${source.id}`, e);
            }
            return [];
        });

        const results = await Promise.all(sourcePromises);
        const streamOptions: StreamOption[] = results.flat().filter((o): o is StreamOption => !!o);
        
        const finalEventForDialog = { ...eventForDialog, options: streamOptions };

        setEvents(prevEvents => prevEvents.map(e => e.id === event.id ? finalEventForDialog : e));
        setDialogEvent(finalEventForDialog);

    } catch (error) {
        console.error(`Failed to fetch streams for ${event.title}`);
        setDialogEvent({ ...eventForDialog, options: [] });
    } finally {
        setIsOptionsLoading(false);
    }
};

    const handlePasteFromClipboard = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) {
                toast({ variant: 'destructive', title: 'Error', description: 'El portapapeles está vacío.' });
                return;
            }
            
            try {
                new URL(text);
            } catch (_) {
                toast({ variant: 'destructive', title: 'Enlace Inválido', description: 'El texto copiado no es un enlace válido.' });
                return;
            }

            const pastedCount = selectedEvents.filter(e => e?.source === 'custom').length;
            const newTitle = `Enlace propio (${pastedCount + 1})`;

            const newEvent: Event = {
                id: `custom-${Date.now()}`,
                title: newTitle,
                time: 'AHORA',
                status: 'En Vivo',
                category: 'Personalizado',
                options: [{ url: text, label: 'Enlace Propio', hd: false, language: '' }],
                selectedOption: text,
                image: 'https://cdn-icons-png.flaticon.com/512/1168/1168706.png',
                sources: [],
                buttons: [],
                date: '',
                source: 'custom'
            };

            const newSelectedEvents = [...selectedEvents];
            const targetIndex = newSelectedEvents.findIndex(e => e === null);

            if (targetIndex !== -1) {
                newSelectedEvents[targetIndex] = newEvent;
                setSelectedEvents(newSelectedEvents);
                toast({ title: '¡Enlace añadido!', description: 'El enlace de tu portapapeles se ha añadido a tu selección.' });
            } else {
                toast({ variant: 'destructive', title: 'Selección Completa', description: 'No puedes añadir más de 9 eventos.' });
            }

        } catch (err) {
            console.error('Failed to read clipboard contents: ', err);
            toast({ variant: 'destructive', title: 'Error de Portapapeles', description: 'No se pudo leer el portapapeles. Asegúrate de haber concedido los permisos.' });
        }
    };


  const handleChannelClick = (channel: Channel) => {
      if (channel.name === "Enlace Propio") {
          handlePasteFromClipboard();
          return;
      }
      const channelAsEvent: Event = {
          id: `${channel.name}-channel-static`,
          title: channel.name,
          options: channel.urls.map(u => ({...u, hd: false, language: ''})),
          sources: [], buttons: [], time: 'AHORA', category: 'Canal',
          language: '', date: '', source: '', status: 'En Vivo', image: channel.logo
      };
      openDialogForEvent(channelAsEvent);
  };
  
  const openDialogForModification = (index: number) => {
    setModificationIndex(index);
    const event = selectedEvents[index];
    if (event) {
        openDialogForEvent(event);
    }
  };

  const selectedEventsCount = Array.isArray(selectedEvents) ? selectedEvents.filter(Boolean).length : 0;
  
  // --- Remote Control Logic ---
  const handleStartView = (isControlledStart = false) => {
    if (selectedEventsCount === 0) return;
    if (isControlledStart) {
      sessionStorage.setItem('isControlledStart', 'true');
    } else {
      // If it's a normal view start, ensure any previous session is cleaned up.
      handleStopView();
    }
    setIsViewMode(true);
  };
  
  const handleViewChange = (view: string) => {
    setSearchTerm('');
    setCurrentView(view);
  };
  
  const handleBackToHome = () => {
    setSearchTerm('');
    setCurrentView('home');
  };

  // View Mode specific handlers
  const handleReloadCamera = (index: number) => {
    setReloadCounters(prevCounters => {
      const newCounters = [...prevCounters];
      newCounters[index] = (newCounters[index] || 0) + 1;
      return newCounters;
    });
  };

  const handleToggleFullscreen = (index: number) => {
    setLiveAppState({ fullscreenIndex: fullscreenIndex === index ? null : index });
  };

  const getItemClasses = (orderedIndex: number, count: number) => {
    if (isMobile) return '';
    if (count === 3) {
      if(orderedIndex === 0) return 'col-span-2';
      if(orderedIndex === 1) return 'col-span-1';
      if(orderedIndex === 2) return 'col-span-1';
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
 
  const handleCopyCode = () => {
    navigator.clipboard.writeText(controlledSessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  

  useEffect(() => {
    return () => { cleanupAbly(); };
  }, [cleanupAbly]);

  const initializeAbly = (clientId: string): Promise<Realtime> => {
    return new Promise(async (resolve, reject) => {
      try {
          const response = await fetch('/api/ably');
          if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.error || 'Failed to fetch Ably API key.');
          }
          const { apiKey } = await response.json();
          if (!apiKey) throw new Error("La clave de API de Ably no está configurada.");

          const client = new Realtime({ key: apiKey, clientId: clientId, echoMessages: false });
          ablyClientRef.current = client;
          
          // Wait for the connection to be established before resolving
          if (client.connection.state === 'connected') {
              resolve(client);
          } else {
              client.connection.once('connected', () => resolve(client));
              client.connection.once('failed', (err) => reject(new Error(err.reason?.message || "No se pudo conectar al servicio en tiempo real.")));
          }
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Error de Conexión', description: e.message || "No se pudo conectar al servicio en tiempo real." });
          reject(e);
      }
    });
  };

  const startControlledSession = async (): Promise<string> => {
    if (ablyClientRef.current?.connection.state === 'connected') cleanupAbly();
    try {
        const newSessionId = `dpt-${Math.random().toString(36).substring(2, 6)}`;
        const ably = await initializeAbly(`controlled-${newSessionId}`);
        
        // Connection is guaranteed to be ready here
        setControlledSessionCode(newSessionId);
        setRemoteControlMode('controlled');
        sessionStorage.setItem('isControlledSession', 'true');
        
        const channel = ably.channels.get(newSessionId);
        channelRef.current = channel;

        channel.subscribe('sync-request', () => {
            channel.publish('state-update', { appState });
        });
        
        // Listen for actions from the controller
        channel.subscribe('action', (message: AblyMessage) => {
            if (message.data.type === 'SET_APP_STATE') {
               setAppState(message.data.payload);
            }
            if (message.data.type === 'OPEN_CHAT') {
                setIsChatOpen(true);
            }
        });
        
        return newSessionId;
    } catch (e: any) {
        throw e;
    }
  };
  
  const startControllingSession = async (code: string) => {
    if (ablyClientRef.current?.connection.state === 'connected') cleanupAbly();
    if (!code) { toast({ variant: 'destructive', title: "Error", description: "Por favor, introduce un código de sesión." }); return; }
    
    try {
        const ably = await initializeAbly(`controller-${code}`);
        
        // Connection is guaranteed to be ready here
        const channel = ably.channels.get(code);
        channelRef.current = channel;

        // This client LISTENS for state updates
        channel.subscribe('state-update', (message: AblyMessage) => {
            if (message.data.appState) {
                setControllerAppState(message.data.appState);
            }
        });
        
        // This is a new listener for when a schedule is applied on the controlled device
        channel.subscribe('schedule-applied', () => {
            channel.publish('sync-request', {});
        });

        // Initial sync request
        channel.publish('sync-request', {});
        setIsControlling(true);
        setRemoteControlMode('controlling');
        setControlledSessionCode(code);
        toast({ title: "Control Remoto Conectado", description: `Controlando la sesión ${code}.` });
    } catch (e: any) {
        toast({ variant: 'destructive', title: "Error", description: e.message || "Ocurrió un error inesperado." });
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const remoteCode = params.get('remote');
    if (remoteCode) {
        setTimeout(() => startControllingSession(remoteCode), 500);
        window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);
  
  const handleStartAndControl = async () => {
    if (selectedEventsCount === 0) {
        toast({ variant: 'destructive', title: 'No hay eventos seleccionados', description: 'Selecciona al menos un evento.' });
        return;
    }
    handleStartView(true);
    try {
        const code = await startControlledSession();
        if (code) {
            setControlledSessionCode(code);
            setIsControlledSessionDialog(true);
        }
    } catch(e: any) {
        toast({ variant: 'destructive', title: 'Error de Control Remoto', description: e.message || 'No se pudo iniciar la sesión controlada.' });
    }
  };

  const handleActivateRemoteControl = async () => {
      try {
          await startControlledSession();
      } catch (e: any) {
          toast({ variant: 'destructive', title: 'Error de Control Remoto', description: e.message || 'No se pudo iniciar la sesión controlada.' });
      }
  };

  const handlePresetSelect = (preset: Preset) => {
    const newSelectedEvents: (Event | null)[] = Array(9).fill(null);
    let count = 0;

    for (const presetChannel of preset.channels) {
        if (count >= 9) break;

        let foundItem: Event | Channel | undefined;
        if (presetChannel.isEvent) {
            foundItem = allSortedEvents.find(e => e.id === presetChannel.id);
        } else {
            foundItem = channels.find(c => c.name === presetChannel.name);
        }
        
        if (foundItem) {
            let event: Event;
            if ('urls' in foundItem) { // It's a Channel
                 event = {
                    id: `${foundItem.name}-channel-static`,
                    title: foundItem.name,
                    options: foundItem.urls.map(u => ({ ...u, hd: false, language: '' })),
                    selectedOption: foundItem.urls[presetChannel.optionIndex ?? 0]?.url,
                    sources: [], buttons: [], time: 'AHORA', category: 'Canal',
                    language: '', date: '', source: '', status: 'En Vivo', image: foundItem.logo
                };
            } else { // It's an Event
                event = { ...foundItem, selectedOption: foundItem.options[presetChannel.optionIndex ?? 0]?.url };
            }
            newSelectedEvents[count] = event;
            count++;
        }
    }
    setLiveAppState({ selectedEvents: newSelectedEvents });
    setPresetsDialogOpen(false);
  };


  // --- Preset Management Functions ---
  const savePresets = (presets: Preset[]) => {
    setCustomPresets(presets);
    localStorage.setItem('customPresets', JSON.stringify(presets));
  };

  const addPreset = (newPreset: Omit<Preset, 'id'>) => {
    const presetWithId = { ...newPreset, id: crypto.randomUUID() };
    savePresets([...customPresets, presetWithId]);
  };

  const updatePreset = (updatedPreset: Preset) => {
    const newPresets = customPresets.map(p => p.id === updatedPreset.id ? updatedPreset : p);
    savePresets(newPresets);
  };

  const deletePreset = (presetId: string) => {
    const newPresets = customPresets.filter(p => p.id !== presetId);
    savePresets(newPresets);
  };


  if (!isInitialLoadDone) {
    return <LoadingScreen />;
  }
  
  if (isControlling && controllerAppState) {
    return (
        <ControllingView 
            appState={controllerAppState}
            setLiveAppState={setLiveAppState}
            onStopSession={() => {
                cleanupAbly();
                setIsControlling(false);
                setRemoteControlMode('inactive');
                setControllerAppState(null);
                toast({ title: "Control Remoto Desconectado" });
            }}
            allEvents={events}
            allChannels={channelsData}
            toast={toast}
            customPresets={customPresets}
            onClearSelections={handleClearSelections}
            onPresetSelect={handlePresetSelect}
            getEventSelection={(event) => {
              const selectionIndex = controllerAppState.selectedEvents.findIndex(se => se?.id === event.id);
              if (selectionIndex !== -1) {
                  return { isSelected: true, selectedOption: controllerAppState.selectedEvents[selectionIndex]?.selectedOption || null, index: selectionIndex };
              }
              return { isSelected: false, selectedOption: null, index: -1 };
            }}
        />
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
              <DialogModalTitle>Suscripción a Calendario</DialogModalTitle>
              <DialogDescription className="sr-only">
                  Elige una categoría para suscribirte. Tu calendario se actualizará automáticamente.
              </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-72">
              <div className="p-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <CalendarLink>
                      Todos los Eventos
                  </CalendarLink>
                  {categories.map(category => (
                      <CalendarLink key={category} category={category}>
                          {category}
                      </CalendarLink>
                  ))}
              </div>
          </ScrollArea>
      </DialogContent>
    );
  };

  const renderViewContent = () => {
    const numCameras = selectedEvents.filter(Boolean).length;
    const gridContainerClasses = `grid flex-grow w-full h-full ${getGridClasses(numCameras)}`;
     
    if (isViewMode && numCameras === 0) {
        return (
            <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
                <p className="mb-4">No hay URLs seleccionadas para mostrar.</p>
                <Button onClick={handleStopView}>
                    <X className="mr-2 h-4 w-4" /> Volver Atrás
                </Button>
            </div>
        );
    }
    
    return (
      <div className="flex h-screen w-screen bg-background text-foreground group">
        <div
          className={cn(
            "absolute z-30 flex items-center gap-2 transition-opacity duration-300",
            areControlsVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            isChatOpen && !isMobile ? "flex-row-reverse left-0" : "left-auto"
          )}
          style={
            isChatOpen && !isMobile
              ? { top: `${gridGap}px`, left: `${gridGap}px` }
              : { top: `${gridGap}px`, right: `${gridGap}px` }
          }
        >
          <CameraConfigurationComponent
            order={viewOrder.filter((i) => selectedEvents[i] !== null)}
            onOrderChange={handleOrderChange}
            eventDetails={selectedEvents}
            onReload={handleReloadCamera}
            onRemove={handleEventRemove}
            onModify={openDialogForModification}
            onToggleFullscreen={handleToggleFullscreen}
            fullscreenIndex={fullscreenIndex}
            isViewPage={true}
            onAddEvent={() => {
              setDialogContext('main');
              setAddEventsDialogOpen(true);
            }}
            onSchedule={() => {
              setDialogContext('schedule');
              setScheduleManagerOpen(true);
            }}
            gridGap={gridGap}
            onGridGapChange={(v) => setLiveAppState({ gridGap: v })}
            borderColor={borderColor}
            onBorderColorChange={(c) => setLiveAppState({ borderColor: c })}
            onRestoreGridSettings={handleRestoreGridSettings}
            isChatEnabled={isChatEnabled}
            onIsChatEnabledChange={(v) => setLiveAppState({ isChatEnabled: v })}
            onOpenTutorial={() => setIsTutorialOpen(true)}
            onOpenErrors={() => setIsErrorsOpen(true)}
            onOpenContact={() => setContactOpen(true)}
            onOpenLegalNotice={() => setLegalNoticeOpen(true)}
            onOpenCalendar={() => setCalendarOpen(true)}
            onOpenPresets={() => setPresetsDialogOpen(true)}
            onNotificationManager={() => setNotificationManagerOpen(true)}
            remoteControlMode={remoteControlMode}
            controlledSessionCode={controlledSessionCode}
            onActivateRemoteControl={handleActivateRemoteControl}
            onClearSelections={handleClearSelections}
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

          <Button
            onClick={handleStopView}
            variant="ghost"
            size="icon"
            className="bg-transparent hover:bg-accent/80 text-white h-10 w-10"
            aria-label="Cerrar Vista"
          >
            <X className="h-7 w-7 text-white" />
          </Button>
        </div>

        <main
          className={cn(
            "relative grid w-full h-full",
            fullscreenIndex === null && gridContainerClasses
          )}
          style={{
            ...(fullscreenIndex === null
              ? {
                  gap: `${gridGap}px`,
                  padding: `${gridGap}px`,
                  backgroundColor: borderColor,
                }
              : {}),
            display: 'grid',
          }}
        >
          {Array.from({ length: 9 }).map((_, windowSlotIndex) => {
            const event = selectedEvents[windowSlotIndex];
            const orderedIndex = viewOrder.indexOf(windowSlotIndex);

            return (
              <div
                key={`window-stable-${windowSlotIndex}`}
                className={cn(
                  "overflow-hidden bg-black relative",
                  fullscreenIndex !== null &&
                    fullscreenIndex !== windowSlotIndex &&
                    "hidden", // Hide if another is fullscreen
                  fullscreenIndex === windowSlotIndex &&
                    'absolute inset-0 z-20', // Style for fullscreen window
                  !event && "hidden", // Hide if no event is selected for this slot
                  fullscreenIndex === null &&
                    getItemClasses(orderedIndex, numCameras)
                )}
                style={{
                  order: orderedIndex,
                }}
              >
                {event && (
                  <iframe
                    ref={(el) => (iframeRefs.current[windowSlotIndex] = el)}
                    src={
                      event.selectedOption
                        ? `${event.selectedOption}${
                            event.selectedOption.includes('?') ? '&' : '?'
                          }reload=${reloadCounters[windowSlotIndex] || 0}`
                        : 'about:blank'
                    }
                    title={`Stream ${windowSlotIndex + 1}`}
                    className="w-full h-full border-0"
                    loading="eager"
                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                    allowFullScreen
                  />
                )}
              </div>
            );
          })}
        </main>
        
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

        {isMobile && (
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
            <DialogContent className="p-0 border-0 w-[90vw] h-[80vh] flex flex-col">
            <DialogHeader className="p-4 border-b">
                <DialogModalTitle>Chat en Vivo</DialogModalTitle>
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
    )
  };
  
  const rainbowColors = [
    '#ff0000', // red
    '#ff7f00', // orange
    '#ffff00', // yellow
    '#00ff00', // green
    '#0000ff', // blue
    '#8b00ff'  // violet
  ];


  const renderHomeContent = () => {
    if (searchTerm) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 pt-4">
                {searchResults.map((item, index) => {
                    const isChannel = 'urls' in item;
                    if (isChannel) {
                        const channel = item as Channel;
                         if (channel.name === 'Enlace Propio') {
                            return (
                                <Card 
                                    key={`custom-link-channel-${index}`}
                                    className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border flex flex-col h-full"
                                    onClick={handlePasteFromClipboard}
                                >
                                    <div className={cn("relative w-full flex-grow flex items-center justify-center p-4 bg-white aspect-video")}>
                                        <Image
                                            src={channel.logo}
                                            alt={`${channel.name} logo`}
                                            width={120}
                                            height={67.5}
                                            className="object-contain max-h-full max-w-full"
                                        />
                                    </div>
                                    <div className="p-3 bg-card min-h-[52px] flex items-center justify-center flex-col">
                                        <h3 className="font-bold text-sm text-center line-clamp-2">{channel.name}</h3>
                                        {channel.recommended && (
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                            <span className="text-xs font-bold uppercase text-yellow-400">Recomendado</span>
                                        </div>
                                        )}
                                    </div>
                                </Card>
                            );
                        }
                        const channelAsEvent: Event = { id: `${channel.name}-channel-static`, title: channel.name, time: 'AHORA', category: 'Canal', options: [], sources: [], buttons: [], language: '', date: '', source: '', status: 'En Vivo', image: channel.logo };
                        const selection = getEventSelection(channelAsEvent);
                        return (
                            <Card 
                                key={`search-channel-${index}`}
                                className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border flex flex-col h-full"
                                onClick={() => handleChannelClick(channel)}
                            >
                                <div className={cn("relative w-full flex-grow flex items-center justify-center p-4 bg-white aspect-video")}>
                                    <Image
                                        src={channel.logo}
                                        alt={`${channel.name} logo`}
                                        width={120}
                                        height={67.5}
                                        className="object-contain max-h-full max-w-full"
                                        onError={e => {
                                            const target = e.target as HTMLImageElement;
                                            target.onerror = null; 
                                            target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                                        }}
                                    />
                                    {selection.isSelected && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="hsl(142.1 76.2% 44.9%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check drop-shadow-lg"><path d="M20 6 9 17l-5-5"/></svg>
                                        </div>
                                    )}
                                </div>
                                <div className="p-3 bg-card min-h-[52px] flex items-center justify-center flex-col">
                                    <h3 className="font-bold text-sm text-center line-clamp-2">{item.name}</h3>
                                     {channel.recommended && (
                                      <div className="flex items-center justify-center gap-1 mt-1">
                                        <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                        <span className="text-xs font-bold uppercase text-yellow-400">Recomendado</span>
                                      </div>
                                    )}
                                </div>
                            </Card>
                        );
                    } else {
                        return (
                            <EventCard
                            key={`search-event-${(item as Event).id}-${index}`}
                            event={item as Event}
                            selection={getEventSelection(item as Event)}
                            onClick={() => openDialogForEvent(item as Event)}
                            />
                        );
                    }
                })}
            </div>
        );
    }

    if (currentView === 'home') {
        return (
            <>
                {featuredMatches.length > 0 && (
                    <div className="w-full space-y-4 pt-4 relative">
                        <Carousel opts={{ align: "start", loop: true, }} className="w-full" >
                            <CarouselContent className="-ml-4">
                                {featuredMatches.map((match, index) => (
                                    <CarouselItem key={match.id} className="basis-full md:basis-1/1 pl-4">
                                        <FeaturedMatchCard 
                                            match={match} 
                                            color={rainbowColors[index % rainbowColors.length]}
                                            onClick={() => {
                                                const event: Event = {
                                                    id: match.id,
                                                    title: match.title,
                                                    time: new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                                    options: [],
                                                    sources: match.sources,
                                                    buttons: [],
                                                    category: match.category,
                                                    language: '',
                                                    date: new Date(match.date).toISOString().split('T')[0],
                                                    source: 'streamed.pk',
                                                    image: match.teams?.home?.badge && match.teams?.away?.badge
                                                        ? `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`
                                                        : `https://i.ibb.co/dHPWxr8/depete.jpg`,
                                                    status: 'Próximo',
                                                };
                                                openDialogForEvent(event);
                                            }} 
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                            <CarouselPrevious variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-black border-none" />
                            <CarouselNext variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-black border-none" />
                        </Carousel>
                    </div>
                )}
                <div className="w-full mt-[3px]">
                    <Carousel opts={{ align: "start", dragFree: true, }} className="w-full" >
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-2xl font-bold">Categorías</h2>
                            <div className="flex items-center gap-2">
                                <CarouselPrevious variant="outline" className="static -translate-x-0 -translate-y-0 rounded-md" />
                                <CarouselNext variant="outline" className="static -translate-x-0 -translate-y-0 rounded-md" />
                            </div>
                        </div>
                        <CarouselContent className="-ml-4">
                            <CarouselItem className="basis-auto pl-4">
                                <Button variant="secondary" className="h-12 px-6 text-lg" onClick={() => handleViewChange('channels')}>
                                    Canales
                                </Button>
                            </CarouselItem>
                            {categories.map(category => (
                                <CarouselItem key={category} className="basis-auto pl-4">
                                    <Button variant="secondary" className="h-12 px-6 text-lg" onClick={() => handleViewChange(category)}>
                                        {category}
                                    </Button>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                    </Carousel>
                </div>
                
                <div className="space-y-[35px] mt-[35px] mb-8">
                     <EventCarousel 
                        title="Canales" 
                        channels={channelsData}
                        onChannelClick={handleChannelClick}
                        getEventSelection={(e) => getEventSelection(e)} 
                    />
                    <EventCarousel 
                        title="En Vivo" 
                        events={liveEvents}
                        onCardClick={openDialogForEvent} 
                        getEventSelection={(e) => getEventSelection(e)} 
                    />
                    <EventCarousel 
                        title="Próximos" 
                        events={upcomingEvents}
                        onCardClick={openDialogForEvent} 
                        getEventSelection={(e) => getEventSelection(e)} 
                    />
                    <EventCarousel 
                        title="Estado Desconocido" 
                        events={unknownEvents}
                        onCardClick={openDialogForEvent} 
                        getEventSelection={(e) => getEventSelection(e)} 
                    />
                    <EventCarousel 
                        title="Finalizados" 
                        events={finishedEvents}
                        onCardClick={openDialogForEvent} 
                        getEventSelection={(e) => getEventSelection(e)} 
                    />
                </div>
            </>
        );
    }
    
    // Category View
    const categoryFeaturedMatches = featuredMatches.filter(match => match.category.toLowerCase() === currentView.toLowerCase());

    return (
      <>
        {categoryFeaturedMatches.length > 0 && (
            <div className="w-full space-y-4 pt-4 relative">
                <Carousel opts={{ align: "start", loop: false }} className="w-full">
                    <CarouselContent className="-ml-4">
                        {categoryFeaturedMatches.map((match, index) => (
                            <CarouselItem key={match.id} className="basis-full md:basis-1/1 pl-4">
                                <FeaturedMatchCard 
                                    match={match} 
                                    color={rainbowColors[index % rainbowColors.length]}
                                    onClick={() => {
                                        const event: Event = {
                                            id: match.id,
                                            title: match.title,
                                            time: new Date(match.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                            options: [],
                                            sources: match.sources,
                                            buttons: [],
                                            category: match.category,
                                            language: '',
                                            date: new Date(match.date).toISOString().split('T')[0],
                                            source: 'streamed.pk',
                                            image: match.teams?.home?.badge && match.teams?.away?.badge
                                                ? `https://streamed.pk/api/images/poster/${match.teams.home.badge}/${match.teams.away.badge}.webp`
                                                : `https://i.ibb.co/dHPWxr8/depete.jpg`,
                                            status: 'Próximo',
                                        };
                                        openDialogForEvent(event);
                                    }} 
                                />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                    <CarouselPrevious variant="ghost" className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-black border-none" />
                    <CarouselNext variant="ghost" className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-black border-none" />
                </Carousel>
            </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 pt-4">
          {(currentView === 'channels' ? channelsData : categoryFilteredEvents).map((item, index) => {
              const isChannel = 'urls' in item;
              if (isChannel) {
                const channel = item as Channel;
                if (channel.name === 'Enlace Propio') {
                    return (
                        <Card 
                            key={`custom-link-channel-${index}`}
                            className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border flex flex-col h-full"
                            onClick={handlePasteFromClipboard}
                        >
                            <div className={cn("relative w-full flex-grow flex items-center justify-center p-4 bg-white aspect-video")}>
                                <Image
                                    src={channel.logo}
                                    alt={`${channel.name} logo`}
                                    width={120}
                                    height={67.5}
                                    className="object-contain max-h-full max-w-full"
                                />
                            </div>
                            <div className="p-3 bg-card min-h-[52px] flex items-center justify-center flex-col">
                                <h3 className="font-bold text-sm text-center line-clamp-2">{channel.name}</h3>
                                {channel.recommended && (
                                  <div className="flex items-center justify-center gap-1 mt-1">
                                    <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                    <span className="text-xs font-bold uppercase text-yellow-400">Recomendado</span>
                                  </div>
                                )}
                            </div>
                        </Card>
                    );
                }
                const channelAsEvent: Event = { id: `${channel.name}-channel-static`, title: channel.name, time: 'AHORA', category: 'Canal', options: [], sources: [], buttons: [], language: '', date: '', source: '', status: 'En Vivo', image: channel.logo };
                const selection = getEventSelection(channelAsEvent);
                return (
                    <Card 
                        key={`search-channel-${index}`}
                        className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border flex flex-col h-full"
                        onClick={() => handleChannelClick(channel)}
                    >
                        <div className={cn("relative w-full flex-grow flex items-center justify-center p-4 bg-white aspect-video")}>
                            <Image
                                src={channel.logo}
                                alt={`${channel.name} logo`}
                                width={120}
                                height={67.5}
                                className="object-contain max-h-full max-w-full"
                                onError={e => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null; 
                                    target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                                }}
                            />
                             {selection.isSelected && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="hsl(142.1 76.2% 44.9%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check drop-shadow-lg"><path d="M20 6 9 17l-5-5"/></svg>
                                </div>
                            )}
                        </div>
                        <div className="p-3 bg-card min-h-[52px] flex items-center justify-center flex-col">
                            <h3 className="font-bold text-sm text-center line-clamp-2">{item.name}</h3>
                            {channel.recommended && (
                              <div className="flex items-center justify-center gap-1 mt-1">
                                <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold uppercase text-yellow-400">Recomendado</span>
                              </div>
                            )}
                        </div>
                    </Card>
                );
              } else {
                 return (
                    <EventCard
                      key={`search-event-${(item as Event).id}-${index}`}
                      event={item as Event}
                      selection={getEventSelection(item as Event)}
                      onClick={() => openDialogForEvent(item as Event)}
                    />
                );
              }
          })}
      </div>
      </>
    );
  };
  
  return (
    <>
      <div ref={remoteControlContainerRef} />
      {isViewMode ? renderViewContent() : (
        <div className="flex h-screen w-screen flex-col bg-background text-foreground">
           {isDataLoading && !isInitialLoadDone && (
            <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
                <LoadingScreen />
            </div>
           )}
            <div className={cn("flex h-full w-full flex-col", isDataLoading && !isInitialLoadDone ? "invisible" : "")}>
                <header className="sticky top-0 z-30 flex h-header-height w-full shrink-0 items-center border-b border-border bg-background/80 backdrop-blur-sm px-4">
                    <div className={cn("flex items-center", isSearchOpen && 'hidden sm:flex')}>
                        {currentView === 'home' && (
                            <Link href="/" className="shrink-0 mr-4" onClick={handleBackToHome}>
                                <Image
                                    src="https://i.ibb.co/gZKpR4fc/deportes-para-todos.png"
                                    alt="Deportes Para Todos Logo"
                                    width={150}
                                    height={37.5}
                                    priority
                                    className='w-auto h-auto max-h-[40px] max-w-[150px]'
                                />
                            </Link>
                        )}
                        {currentView !== 'home' && (
                            <div className="flex items-center gap-1 min-w-0">
                                <Button variant="ghost" size="icon" onClick={handleBackToHome} className='flex-shrink-0 -ml-2'>
                                    <ArrowLeft />
                                </Button>
                                <h1 className="text-lg md:text-xl font-bold capitalize truncate shrink">{currentView}</h1>
                            </div>
                        )}
                    </div>

                    <div className={cn(
                        "flex flex-1 items-center gap-2",
                        !isSearchOpen && "justify-end",
                        isSearchOpen && "justify-between"
                    )}>
                        {isSearchOpen ? (
                            <div className="relative w-full ml-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    ref={r => { if (r) r.focus(); }}
                                    type="text"
                                    placeholder="Buscar evento o canal..."
                                    className="w-full pl-10"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        ) : null}

                        <div className="flex items-center gap-1">
                           <Button variant="ghost" size="icon" onClick={() => {
                                if (isSearchOpen) {
                                    setSearchTerm('');
                                }
                                setIsSearchOpen(!isSearchOpen);
                            }}>
                                {isSearchOpen ? <X/> : <Search />}
                            </Button>
                            
                            {!isSearchOpen && (
                                <>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => fetchEvents(true)}
                                      disabled={isDataLoading}
                                      aria-label="Refrescar eventos"
                                    >
                                      <RotateCw className={cn(isDataLoading && "animate-spin")} />
                                    </Button>
                                    
                                    <Button variant="ghost" size="icon" onClick={() => setRemoteControlOptionsOpen(true)}>
                                      <Airplay />
                                    </Button>

                                     <Sheet open={isSettingsSheetOpen} onOpenChange={setIsSettingsSheetOpen}>
                                        <SheetTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <Settings />
                                          </Button>
                                        </SheetTrigger>
                                         <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0" hideClose={true}>
                                            <SheetHeader className="sr-only">
                                                <SheetTitle>Configuration Panel</SheetTitle>
                                                <DialogDescription>A panel to configure the view layout and other settings.</DialogDescription>
                                            </SheetHeader>
                                            <LayoutConfigurator
                                                order={viewOrder.filter(i => selectedEvents[i] !== null)}
                                                onOrderChange={handleOrderChange}
                                                eventDetails={selectedEvents}
                                                onRemove={handleEventRemove}
                                                onModify={openDialogForModification}
                                                isViewPage={false}
                                                gridGap={gridGap}
                                                onGridGapChange={(v) => setLiveAppState({ gridGap: v })}
                                                borderColor={borderColor}
                                                onBorderColorChange={(c) => setLiveAppState({ borderColor: c })}
                                                onRestoreGridSettings={handleRestoreGridSettings}
                                                isChatEnabled={isChatEnabled}
                                                onIsChatEnabledChange={(v) => setLiveAppState({ isChatEnabled: v })}
                                                onOpenTutorial={() => setIsTutorialOpen(true)}
                                                onOpenErrors={() => setIsErrorsOpen(true)}
                                                onOpenContact={() => setContactOpen(true)}
                                                onOpenLegalNotice={() => setLegalNoticeOpen(true)}
                                                onOpenCalendar={() => setCalendarOpen(true)}
                                                onOpenPresets={() => setPresetsDialogOpen(true)}
                                                onNotificationManager={() => setNotificationManagerOpen(true)}
                                                isRemoteControlView={false}
                                                onAddEvent={() => {
                                                    setDialogContext('main');
                                                    setAddEventsDialogOpen(true);
                                                }}
                                                onSchedule={() => {
                                                  setDialogContext('schedule');
                                                  setScheduleManagerOpen(true);
                                                }}
                                                remoteControlMode={remoteControlMode}
                                                controlledSessionCode={controlledSessionCode}
                                                onActivateRemoteControl={handleActivateRemoteControl}
                                                onClearSelections={handleClearSelections}
                                                onClose={() => setIsSettingsSheetOpen(false)}
                                            />
                                      </SheetContent>
                                      </Sheet>

                                    <Button
                                        size="icon"
                                        onClick={() => handleStartView(false)}
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
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <main className="flex-grow overflow-y-auto px-4 md:px-8 pb-8">
                    {renderHomeContent()}
                </main>
            </div>
        </div>
      )}

      {/* Main App Dialogs - These are portal'd by default, so they should work fine */}
      <PresetsDialog
          open={presetsDialogOpen}
          onOpenChange={setPresetsDialogOpen}
          onSelectPreset={handlePresetSelect}
          customPresets={customPresets}
          onSavePreset={addPreset}
          onUpdatePreset={updatePreset}
          onDeletePreset={deletePreset}
          allEvents={allSortedEvents}
          allChannels={channelsData}
          isRemote={false}
      />
      <AddEventsDialog
          open={addEventsDialogOpen}
          onOpenChange={setAddEventsDialogOpen}
          onEventSelect={openDialogForEvent}
          onChannelClick={handleChannelClick}
          getEventSelection={(event) => getEventSelection(event)}
          events={allSortedEvents}
          channels={channelsData}
          isLoading={isAddEventsLoading}
          onFetch={() => fetchEvents(true, true)}
          isRemote={false}
      />
       <ScheduleManager
          open={scheduleManagerOpen}
          onOpenChange={setScheduleManagerOpen}
          schedules={schedules}
          onSchedulesChange={setSchedules}
          isLoading={isAddEventsLoading}
          initialSelection={selectedEvents}
          initialOrder={viewOrder}
          allEvents={allSortedEvents}
          allChannels={channelsData}
          getEventSelection={getEventSelection}
          remoteControlMode={remoteControlMode}
          controlledSessionCode={controlledSessionCode}
          onActivateRemoteControl={handleActivateRemoteControl}
      />
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
          <CalendarDialogContent categories={categories} />
      </Dialog>
      <NotificationManager
          open={notificationManagerOpen}
          onOpenChange={setNotificationManagerOpen}
          allCategories={categories}
      />
      {dialogEvent && (
          <EventSelectionDialog
              isOpen={eventSelectionDialogOpen}
              onOpenChange={(isOpen) => {
                  if (!isOpen) setModificationIndex(null);
                  setEventSelectionDialogOpen(isOpen);
              }}
              event={dialogEvent}
              onSelect={handleEventSelect}
              isModification={modificationIndex !== null && selectedEvents[modificationIndex] !== null}
              modificationIndex={modificationIndex}
              onRemove={handleEventRemove}
              isLoading={isOptionsLoading}
              dialogContext={dialogContext}
          />
      )}
      <Dialog open={isControllerPromptOpen} onOpenChange={setIsControllerPromptOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogModalTitle>Controlar Dispositivo</DialogModalTitle>
                  <DialogDescription>Introduce el código del dispositivo que quieres controlar.</DialogDescription>
              </DialogHeader>
              <div className="flex gap-2 py-4">
                  <Input
                      placeholder="Código de sesión..."
                      value={controllerCode}
                      onChange={(e) => setControllerCode(e.target.value)}
                  />
              </div>
              <DialogFooter>
                  <DialogModalClose asChild>
                    <Button variant="secondary">Cancelar</Button>
                  </DialogModalClose>
                  <Button onClick={() => {
                      startControllingSession(controllerCode);
                      setIsControllerPromptOpen(false);
                  }}>Conectar</Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>
      <Dialog open={remoteControlOptionsOpen} onOpenChange={setRemoteControlOptionsOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogModalTitle>Opciones de Control Remoto</DialogModalTitle>
                  <DialogDescription>Elige cómo quieres usar el control remoto.</DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 gap-4 py-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                          setRemoteControlOptionsOpen(false);
                          handleStartAndControl();
                      }}
                  >
                      Ser Controlado
                  </Button>
                  <Button
                      variant="outline"
                      onClick={() => {
                          setRemoteControlOptionsOpen(false);
                          setIsControllerPromptOpen(true);
                      }}
                  >
                      Controlar un Dispositivo
                  </Button>
              </div>
          </DialogContent>
      </Dialog>
       <Dialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogModalTitle>Tutorial Detallado de Uso</DialogModalTitle>
                <DialogDescription className="sr-only">Guía de uso completa de la aplicación Deportes para Todos.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[70vh] pr-6">
                <div className="text-sm text-muted-foreground space-y-6">
                    <div>
                        <h3 className="font-bold text-base text-foreground mb-2">1. Introducción: Tu Centro de Deportes Personalizado</h3>
                        <p>¡Bienvenido a <strong>Deportes para Todos</strong>! Esta plataforma está diseñada para que puedas ver múltiples eventos deportivos y canales de televisión simultáneamente, en una sola pantalla. Puedes combinar partidos en vivo, canales de noticias, y mucho más, creando una experiencia de visualización totalmente a tu medida.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-base text-foreground mb-2">2. Explorando y Seleccionando Contenido</h3>
                        <p className="mb-2">La página principal es tu punto de partida. Aquí encontrarás todo el contenido disponible organizado en carruseles por categorías:</p>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Canales:</strong> Cadenas de televisión que emiten 24/7.</li>
                            <li><strong>En Vivo:</strong> Eventos que se están transmitiendo en este preciso momento.</li>
                            <li><strong>Próximos:</strong> Eventos programados para empezar más tarde el mismo día.</li>
                            <li><strong>Otras categorías:</strong> Contenido agrupado por deporte (Fútbol, Motor Sports, etc.).</li>
                        </ul>
                        <p className="mt-2">Para añadir un evento o canal a tu selección, simplemente haz clic en su tarjeta. Se abrirá un diálogo con las diferentes opciones de transmisión disponibles. Elige una y el canal se añadirá automáticamente a tu parrilla de visualización.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-base text-foreground mb-2">3. El Panel de Configuración: Tu Centro de Mando</h3>
                        <p className="mb-2">Haz clic en el icono de engranaje (<Settings className="inline-block h-4 w-4" />) en la esquina superior derecha para abrir el panel de configuración. Desde aquí, puedes gestionar toda tu experiencia:</p>
                        
                        <h4 className="font-semibold text-foreground mt-3 mb-1">Eventos/Canales Seleccionados</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Añadir:</strong> Usa el botón <strong className="text-primary"><Plus className="inline-block h-3 w-3" /> Añadir Evento/Canal</strong> para abrir el catálogo completo y seguir añadiendo contenido.</li>
                            <li><strong>Reordenar:</strong> Utiliza las flechas (<ArrowUp className="inline-block h-3 w-3" /> <ArrowDown className="inline-block h-3 w-3" />) junto a cada evento para cambiar su posición en la cuadrícula.</li>
                            <li><strong>Modificar:</strong> Haz clic en el lápiz (<Pencil className="inline-block h-3 w-3" />) para cambiar la fuente de transmisión de un evento ya seleccionado.</li>
                            <li><strong>Eliminar:</strong> El icono de la papelera (<Trash2 className="inline-block h-3 w-3 text-destructive" />) quita el evento de tu selección.</li>
                        </ul>

                        <h4 className="font-semibold text-foreground mt-3 mb-1">Diseño de Cuadrícula</h4>
                        <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Espaciado:</strong> Ajusta el control deslizante para aumentar o disminuir el espacio entre las ventanas de video.</li>
                            <li><strong>Color de Borde:</strong> Personaliza el color del borde que rodea las ventanas.</li>
                        </ul>
                    </div>

                    <div>
                        <h3 className="font-bold text-base text-foreground mb-2">4. Iniciar la Vista de Transmisión</h3>
                        <p>Cuando tu selección esté lista, haz clic en el gran botón verde de <strong>Play</strong> (<Play className="inline-block h-4 w-4" />) en la esquina superior derecha. Esto te llevará a la pantalla de visualización, donde todos tus eventos y canales seleccionados se reproducirán simultáneamente en la cuadrícula que has configurado.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-base text-foreground mb-2">5. Funciones Avanzadas</h3>
                        <p className="mb-2">Dentro del panel de configuración, en "Funciones Adicionales", encontrarás herramientas potentes:</p>
                        
                        <h4 className="font-semibold text-foreground mt-3 mb-1">Control Remoto (<Airplay className="inline-block h-4 w-4" />)</h4>
                        <p>Esta increíble función te permite usar un dispositivo (como tu celular) para controlar lo que se ve en otro (como tu TV o monitor principal). Al iniciar la vista, puedes elegir "Ser Controlado" para generar un código. Introduce ese código en tu otro dispositivo para tomar el control total: cambia canales, reordena la vista, ajusta el diseño y mucho más, todo de forma remota.</p>

                        <h4 className="font-semibold text-foreground mt-3 mb-1">Programar Selección (<CalendarDays className="inline-block h-4 w-4" />)</h4>
                        <p>¿No quieres perderte un partido que empieza más tarde? Con el programador, puedes configurar una selección de eventos para que se cargue automáticamente a una fecha y hora específicas. Prepara tu vista con antelación y la plataforma la tendrá lista para ti justo a tiempo.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-base text-foreground mb-2">6. Ayuda y Notificaciones</h3>
                         <ul className="list-disc pl-5 space-y-1">
                            <li><strong>Notificaciones por Correo:</strong> Suscríbete para recibir un email diario con los eventos más importantes del día.</li>
                            <li><strong>Suscripción a Calendario:</strong> Sincroniza nuestro calendario de eventos con el tuyo (Google Calendar, Apple Calendar) para tener siempre a mano la programación.</li>
                            <li><strong>Ayuda y Soporte:</strong> Aquí encontrarás este tutorial, una guía de solución de errores comunes, nuestro contacto y el aviso legal.</li>
                        </ul>
                    </div>
                    <p className="pt-2 font-semibold text-foreground">¡Eso es todo! Explora, personaliza y disfruta del deporte como nunca antes.</p>
                </div>
            </ScrollArea>
            <DialogFooter>
                <DialogModalClose asChild><Button>Entendido</Button></DialogModalClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <Dialog open={isErrorsOpen} onOpenChange={setIsErrorsOpen}>
        <DialogContent className="max-w-2xl">
            <DialogHeader>
                <DialogModalTitle>Solución de Errores Comunes</DialogModalTitle>
                <DialogDescription className="sr-only">Guía para solucionar errores comunes.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-[70vh] pr-6">
                <div className="text-sm text-muted-foreground space-y-6">
                    <p>A continuación, te presentamos una guía detallada para resolver los problemas más frecuentes que podrías encontrar al intentar reproducir videos. Sigue estos pasos en orden para maximizar las chances de éxito.</p>
                    
                    <div>
                        <h3 className="font-bold text-foreground mb-2">1. Configurar un DNS público (Cloudflare o Google)</h3>
                        <p className="mb-1"><strong>El Problema:</strong> Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios o servidores de video a través de su DNS. Esto provoca que el video nunca cargue y veas una pantalla en negro o un error de conexión.</p>
                        <p><strong>La Solución:</strong> Cambiar el DNS de tu dispositivo o router a uno público como el de Cloudflare (1.1.1.1) o Google (8.8.8.8) puede saltarse estas restricciones. Estos servicios son gratuitos, rápidos y respetan tu privacidad. Este es el método más efectivo y soluciona la mayoría de los casos.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-foreground mb-2">2. Instalar una Extensión de Reproductor de Video</h3>
                        <p className="mb-1"><strong>El Problema:</strong> Algunos streams de video utilizan formatos modernos como M3U8 o MPD que no todos los navegadores soportan de forma nativa. Si el navegador no sabe cómo "leer" el formato, el video no se reproducirá.</p>
                        <p><strong>La Solución:</strong> Instalar una extensión como "Reproductor MPD/M3U8/M3U/EPG" (para Chrome/Edge) le da a tu navegador las herramientas necesarias para decodificar y reproducir estos formatos.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-foreground mb-2">3. Cambiar de Navegador</h3>
                        <p className="mb-1"><strong>El Problema:</strong> A veces, las configuraciones específicas de un navegador, una actualización reciente o una extensión conflictiva pueden impedir la reproducción.</p>
                        <p><strong>La Solución:</strong> Probar con un navegador diferente es una forma rápida de descartar problemas locales. Recomendamos usar las versiones más recientes de Google Chrome, Mozilla Firefox o Microsoft Edge.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-foreground mb-2">4. Desactivar Bloqueadores de Anuncios (Adblockers)</h3>
                        <p className="mb-1"><strong>El Problema:</strong> Los bloqueadores de anuncios son muy útiles, pero a veces pueden ser demasiado agresivos. Pueden bloquear no solo los anuncios, sino también los scripts o reproductores de video necesarios para que la transmisión funcione.</p>
                        <p><strong>La Solución:</strong> Intenta desactivar tu Adblocker (como AdBlock, uBlock Origin, etc.) temporalmente para este sitio web. Recarga la página después de desactivarlo.</p>
                    </div>
                    
                    <div>
                        <h3 className="font-bold text-foreground mb-2">5. Optimizar para Escritorio</h3>
                        <p className="mb-1"><strong>El Problema:</strong> La aplicación está diseñada y optimizada para la experiencia en una computadora de escritorio o portátil. Los dispositivos móviles (celulares, tabletas) tienen limitaciones de hardware y software que pueden causar errores de reproducción o problemas de rendimiento.</p>
                        <p><strong>La Solución:</strong> Para una experiencia más estable y fluida, recomendamos encarecidamente usar la plataforma en una computadora.</p>
                    </div>

                    <div>
                        <h3 className="font-bold text-foreground mb-2">6. Reiniciar el Dispositivo y la Red</h3>
                        <p className="mb-1"><strong>El Problema:</strong> Problemas temporales de software, caché acumulada o fallos en la conexión de red pueden impedir que el contenido cargue correctamente.</p>
                        <p><strong>La Solución:</strong> El clásico "apagar y volver a encender".</p>
                    </div>
                </div>
            </ScrollArea>
            <DialogFooter>
                <DialogModalClose asChild><Button>Cerrar</Button></DialogModalClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogModalTitle>Contacto</DialogModalTitle>
                <DialogDescription>
                ¿Tienes alguna sugerencia o encontraste un error? ¡Tu opinión nos ayuda a mejorar! Comunícate con nosotros para reportar fallos, enlaces incorrectos o proponer nuevos canales a deportesparatodosvercel@gmail.com.
                </DialogDescription>
            </DialogHeader>
            <DialogFooter>
                <DialogModalClose asChild>
                    <Button>Cerrar</Button>
                </DialogModalClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    <Dialog open={legalNoticeOpen} onOpenChange={setLegalNoticeOpen}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogModalTitle>Descargo de Responsabilidad – Derechos de Autor</DialogModalTitle>
            </DialogHeader>
            <ScrollArea className="h-[70vh] pr-6">
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
                <DialogModalClose asChild><Button>Cerrar</Button></DialogModalClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    </>
  );
}


// Wrapper to handle Suspense for client components
export default function Page() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <HomePageContent />
    </Suspense>
  );
}

// Controller View Component
type ControllingViewProps = {
    appState: AppState;
    setLiveAppState: (newState: Partial<AppState>) => void;
    onStopSession: () => void;
    allEvents: Event[];
    allChannels: Channel[];
    toast: any;
    customPresets: Preset[];
    onClearSelections: () => void;
    onPresetSelect: (preset: Preset) => void;
    getEventSelection: (event: Event) => { isSelected: boolean; selectedOption: string | null; index: number };
};


function ControllingView({
  appState,
  setLiveAppState,
  onStopSession,
  allEvents,
  allChannels,
  toast,
  customPresets,
  onClearSelections,
  onPresetSelect,
  getEventSelection,
}: ControllingViewProps) {
  // Local state for the controller's dialogs
  const [controllerView, setControllerView] = useState<'main' | 'addEvents' | 'eventSelection' | 'schedule' | 'chat' | 'presets'>('main');
  const [controllerDialogEvent, setControllerDialogEvent] = useState<Event | null>(null);
  const [controllerModificationIndex, setControllerModificationIndex] = useState<number | null>(null);
  const [isControllerOptionsLoading, setIsControllerOptionsLoading] = useState(false);
  const [showScheduleFailureMessage, setShowScheduleFailureMessage] = useState(false);

  // This ref is crucial for dialogs to have a container to mount into within the controller view
  const controllerContainerRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!appState.schedules || appState.schedules.length === 0) {
      return;
    }
  
    const now = new Date().getTime();
    const timeouts: NodeJS.Timeout[] = [];
  
    appState.schedules.forEach(schedule => {
      const scheduleTime = new Date(schedule.dateTime).getTime();
      const delay = scheduleTime - now;
  
      if (delay > 0) {
        const timeoutId = setTimeout(() => {
          setShowScheduleFailureMessage(true);
        }, delay);
        timeouts.push(timeoutId);
      }
    });
  
    // Cleanup timers on component unmount or when schedules change
    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [appState.schedules]);

  const { allSortedEvents } = useMemo(() => {
      // Assuming allEvents is already sorted or doesn't need sorting for the controller.
      // If it does, sorting logic can be added here.
      return { allSortedEvents: allEvents };
  }, [allEvents]);
  
  const handleEventRemove = useCallback((indexToRemove: number) => {
    const newSelectedEvents = [...appState.selectedEvents];
    newSelectedEvents[indexToRemove] = null;
    setLiveAppState({ selectedEvents: newSelectedEvents });
  }, [appState.selectedEvents, setLiveAppState]);
  
  const openDialogForEventRemote = async (event: Event, indexToModify?: number) => {
    let targetIndex: number;
    let eventForDialog = { ...event };
    
    if (indexToModify !== undefined) {
      targetIndex = indexToModify;
      const selectedEventFromState = appState.selectedEvents[targetIndex];
      if (selectedEventFromState?.selectedOption) {
          eventForDialog.selectedOption = selectedEventFromState.selectedOption;
      }
    } else {
        const selection = getEventSelection(event);
        if (selection.isSelected) {
            targetIndex = selection.index;
            const selectedEventFromState = appState.selectedEvents[targetIndex];
            if (selectedEventFromState?.selectedOption) {
                eventForDialog.selectedOption = selectedEventFromState.selectedOption;
            }
        } else {
            targetIndex = appState.selectedEvents.findIndex(e => e === null);
            if (targetIndex === -1) {
              toast({ variant: 'destructive', title: 'Selección Completa', description: 'No puedes añadir más de 9 eventos.' });
              return;
            }
        }
    }
    
    setControllerModificationIndex(targetIndex);
    setControllerDialogEvent(eventForDialog);
    setControllerView('eventSelection');
      
    if (event.source !== 'streamed.pk' || (event.options && event.options.length > 0)) {
        return;
    }

    setIsControllerOptionsLoading(true);
    try {
        const sourcePromises = event.sources.map(async (source) => {
            const response = await fetch(`/api/streams?type=stream&source=${source.source}&id=${source.id}`);
            if (response.ok) {
                const streams: any[] = await response.json();
                return streams.map((stream) => ({
                    url: stream.embedUrl,
                    label: `${stream.language}${stream.hd ? ' HD' : ''} (${stream.source})`,
                    hd: stream.hd,
                    language: stream.language,
                }));
            }
            return [];
        });
        const results = await Promise.all(sourcePromises);
        const streamOptions: StreamOption[] = results.flat().filter(Boolean);
        setControllerDialogEvent({ ...eventForDialog, options: streamOptions });
    } finally {
        setIsControllerOptionsLoading(false);
    }
  };
  
  const handleEventSelectRemote = (event: Event, optionUrl: string) => {
      if (controllerModificationIndex === null) return;
      const newSelectedEvents = [...appState.selectedEvents];
      newSelectedEvents[controllerModificationIndex] = { ...event, selectedOption: optionUrl };
      setLiveAppState({ selectedEvents: newSelectedEvents });
      setControllerView('addEvents');
      setControllerDialogEvent(null);
      setControllerModificationIndex(null);
  };
  
  const handleChannelClickRemote = (channel: Channel) => {
        let targetIndex;
        const existingIndex = appState.selectedEvents.findIndex(e => e?.id === `${channel.name}-channel-static`);

        if (existingIndex !== -1) {
          targetIndex = existingIndex;
        } else {
          targetIndex = appState.selectedEvents.findIndex(e => e === null);
        }

        if(targetIndex === -1) {
            toast({ variant: 'destructive', title: 'Selección Completa', description: 'No puedes añadir más de 9 canales.' });
            return;
        }

        const channelAsEvent: Event = {
            id: `${channel.name}-channel-static`,
            title: channel.name,
            options: channel.urls.map(u => ({ ...u, hd: false, language: '' })),
            sources: [], buttons: [], time: 'AHORA', category: 'Canal',
            language: '', date: '', source: '', status: 'En Vivo', image: channel.logo
        };
        
        openDialogForEventRemote(channelAsEvent, targetIndex);
    };
    
  const handleToggleFullscreen = (index: number) => {
    const currentFullscreen = appState.fullscreenIndex;
    setLiveAppState({ fullscreenIndex: currentFullscreen === index ? null : index });
  };

  if (showScheduleFailureMessage) {
    return (
      <div className="fixed inset-0 z-[100] bg-destructive text-destructive-foreground flex flex-col items-center justify-center text-center p-4">
        <AlertCircle className="h-16 w-16 mb-4" />
        <h2 className="text-2xl font-bold mb-2">La sesión falló inesperadamente</h2>
        <p className="max-w-md">
            Por favor, cierre el control remoto y vuelva a iniciar una sesión desde el dispositivo controlado para volver a controlar su dispositivo.
        </p>
        <Button 
            variant="secondary" 
            className="mt-6"
            onClick={onStopSession}
        >
            Cerrar Control Remoto
        </Button>
      </div>
    );
  }

  return (
    // This container ref is crucial for portals
    <div ref={controllerContainerRef} className="fixed inset-0 bg-background z-[100] flex flex-col">
        <header className="p-4 border-b border-border flex-shrink-0 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Control Remoto</h2>
            <Button variant="destructive" size="sm" onClick={onStopSession}>
            <X className="mr-2 h-4 w-4" /> Detener Control
            </Button>
        </header>
        <LayoutConfigurator
            order={appState.viewOrder.filter((i) => appState.selectedEvents[i] !== null)}
            onOrderChange={(order: number[]) => setLiveAppState({ viewOrder: order })}
            eventDetails={appState.selectedEvents}
            onRemove={handleEventRemove}
            onModify={(index: number) => {
                const event = appState.selectedEvents[index];
                if (event) {
                    openDialogForEventRemote(event, index);
                }
            }}
            isViewPage={true}
            onAddEvent={() => setControllerView('addEvents')}
            onSchedule={() => setControllerView('schedule')}
            onOpenPresets={() => setControllerView('presets')}
            gridGap={appState.gridGap}
            onGridGapChange={(v: number) => setLiveAppState({ gridGap: v })}
            borderColor={appState.borderColor}
            onBorderColorChange={(c: string) => setLiveAppState({ borderColor: c })}
            onRestoreGridSettings={() => setLiveAppState({ gridGap: 0, borderColor: '#000000' })}
            isChatEnabled={appState.isChatEnabled}
            onIsChatEnabledChange={(v: boolean) => setLiveAppState({ isChatEnabled: v })}
            isRemoteControlView={true}
            onOpenChat={() => setControllerView('chat')}
            onStopSession={onStopSession}
            onClearSelections={onClearSelections}
            onToggleFullscreen={handleToggleFullscreen}
            fullscreenIndex={appState.fullscreenIndex}
        />
        <AddEventsDialog
            open={controllerView === 'addEvents'}
            onOpenChange={(isOpen) => !isOpen && setControllerView('main')}
            onEventSelect={(event) => openDialogForEventRemote(event)}
            onChannelClick={handleChannelClickRemote}
            getEventSelection={getEventSelection}
            events={allSortedEvents}
            channels={allChannels}
            isLoading={false}
            onFetch={() => {}}
            container={controllerContainerRef.current ?? undefined}
            isRemote={true}
        />

        {controllerDialogEvent && (
            <EventSelectionDialog
                isOpen={controllerView === 'eventSelection'}
                onOpenChange={(isOpen) => {
                  if (!isOpen) {
                    setControllerView('addEvents');
                    setControllerDialogEvent(null);
                  }
                }}
                event={controllerDialogEvent}
                onSelect={handleEventSelectRemote}
                isModification={controllerModificationIndex !== null && appState.selectedEvents[controllerModificationIndex!] !== null}
                modificationIndex={controllerModificationIndex}
                onRemove={() => {
                  if (controllerModificationIndex !== null) handleRemoveEventFromFuture(controllerModificationIndex);
                  setControllerView('addEvents');
                  setControllerDialogEvent(null);
                }}
                isLoading={isControllerOptionsLoading}
                container={controllerContainerRef.current ?? undefined}
            />
        )}
        
        <ScheduleManager
            open={controllerView === 'schedule'}
            onOpenChange={(isOpen) => !isOpen && setControllerView('main')}
            schedules={appState.schedules}
            onSchedulesChange={(s) => setLiveAppState({schedules: s})}
            isLoading={false}
            initialSelection={appState.selectedEvents}
            initialOrder={appState.viewOrder}
            allEvents={allEvents}
            allChannels={allChannels}
            getEventSelection={getEventSelection}
            container={controllerContainerRef.current ?? undefined}
            remoteControlMode="controlling"
            controlledSessionCode=""
            onActivateRemoteControl={() => {}}
        />
        
        <PresetsDialog
            open={controllerView === 'presets'}
            onOpenChange={(isOpen) => !isOpen && setControllerView('main')}
            onSelectPreset={onPresetSelect}
            container={controllerContainerRef.current ?? undefined}
            customPresets={customPresets}
            // Dummy functions as the controller doesn't edit presets
            onSavePreset={() => {}}
            onUpdatePreset={() => {}}
            onDeletePreset={() => {}}
            allEvents={allEvents}
            allChannels={allChannels}
            isRemote={true}
        />
    </div>
  );
}