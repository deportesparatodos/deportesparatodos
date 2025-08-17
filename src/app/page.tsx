
'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Tv, X, Search, RotateCw, FileText, AlertCircle, Mail, BookOpen, Play, Settings, Menu, ArrowLeft, Pencil, Trash2, MessageSquare, Maximize, Minimize, AlertTriangle, Plus, BellRing, Airplay, CalendarDays, Copy, Check } from 'lucide-react';
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
import { AddEventsDialog } from '@/components/add-events-dialog';
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
import { LoadingScreen } from '@/components/loading-screen';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScheduleManager, type Schedule } from '@/components/schedule-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationManager } from '@/components/notification-manager';
import type { Subscription } from '@/components/notification-manager';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RemoteControlManager } from '@/components/remote-control';
import { EventSelectionDialog } from '@/components/event-selection-dialog';


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

interface TCChaserEvent {
  event_time_and_day: string; // "2025-08-10T00:00:00.000Z"
  event_title: string;
  end_date: string;
  cover_image: string;
}

const channels247: Event[] = [
  {
    id: 'south-park-247-static',
    title: "24/7 South Park",
    time: "AHORA",
    status: "En Vivo",
    options: [{ url: "https://veplay.top/stream/3b146825-9e54-4e17-b96e-c172ced342ad", label: "UNICA OPCION", hd: false, language: '' }],
    image: "https://thumbs.poocloud.in/southpark/preview.jpg",
    sources: [],
    buttons: [],
    category: "24/7",
    language: "",
    date: "",
    source: "",
  },
  {
    id: 'cows-247-static',
    title: "24/7 COWS",
    time: "AHORA",
    status: "En Vivo",
    options: [{ url: "https://veplay.top/stream/3027c92d-93ca-4d07-8917-f285dd9c5f9c", label: "UNICA OPCION", hd: false, language: '' }],
    image: "https://extension.usu.edu/drought/images/drought-mitigation-cows-thumbnail.png",
    sources: [],
    buttons: [],
    category: "24/7",
    language: "",
    date: "",
    source: "",
  },
  {
    id: 'family-guy-247-static',
    title: "24/7 Family Guy",
    time: "AHORA",
    status: "En Vivo",
    options: [{ url: "https://veplay.top/stream/d2b4b104-853f-4e4e-9edd-425a1275e90a", label: "UNICA OPCION", hd: false, language: '' }],
    image: "https://thumbs.poocloud.in/familyguy/preview.jpg",
    sources: [],
    buttons: [],
    category: "24/7",
    language: "",
    date: "",
    source: "",
  },
  {
    id: 'simpsons-247-static',
    title: "24/7 The Simpsons",
    time: "AHORA",
    status: "En Vivo",
    options: [{ url: "https://veplay.top/stream/8b48e26f-e89d-47ab-abf5-04b4119273d0", label: "UNICA OPCION", hd: false, language: '' }],
    image: "https://thumbs.poocloud.in/thesimpsons/preview.jpg",
    sources: [],
    buttons: [],
    category: "24/7",
    language: "",
    date: "",
    source: "",
  },
  {
    id: 'korean-tv-247-static',
    title: "(North) Korean Central Television",
    time: "AHORA",
    status: "En Vivo",
    options: [{ url: "https://veplay.top/stream/4a68d34f-7052-4a60-ac79-728320fa0531", label: "UNICA OPCION", hd: false, language: '' }],
    image: "https://i.imgur.com/CnphStu.png",
    sources: [],
    buttons: [],
    category: "24/7",
    language: "",
    date: "",
    source: "",
  }
];

const formula1StaticEvent: Event = {
  id: 'f1-multicam-static',
  title: "Formula 1: MULTICAM",
  time: "--:--",
  status: "Desconocido",
  options: [{ url: "https://p.alangulotv.blog/multi-f1.html", label: "MULTICAM", hd: false, language: "" }],
  image: "https://i.ibb.co/dHPWxr8/depete.jpg",
  sources: [],
  buttons: [],
  category: "Motor Sports",
  language: "",
  date: "",
  source: "static",
};


const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);

const normalizeCategory = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'football' || lowerCategory === 'fútbol' || lowerCategory === 'fútbol_cup') {
        return 'Fútbol';
    }
    return category;
};

export function HomePageContent() {
  const isMobile = useIsMobile();
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));
  const [gridGap, setGridGap] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);

  // View mode state
  const [isViewMode, setIsViewMode] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
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
  
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('home');
  
  // Dialog/Popup states
  const [eventSelectionDialogOpen, setEventSelectionDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [addEventsDialogOpen, setAddEventsDialogOpen] = useState(false);
  const [scheduleManagerOpen, setScheduleManagerOpen] = useState(false);
  const [notificationManagerOpen, setNotificationManagerOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [isAddEventsLoading, setIsAddEventsLoading] = useState(false);
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [isErrorsOpen, setIsErrorsOpen] = useState(false);
  const [remoteControlOptionsOpen, setRemoteControlOptionsOpen] = useState(false);
  
  // Remote Control state
  const remoteControlManagerRef = useRef<{ 
    startControlledSession: () => Promise<string | undefined>; 
    startControllingSession: (id: string) => void;
  }>(null);
  const [isControllerPromptOpen, setIsControllerPromptOpen] = useState(false);
  const [controllerCode, setControllerCode] = useState('');
  const [isControlledSessionDialog, setIsControlledSessionDialog] = useState(false);
  const [controlledSessionCode, setControlledSessionCode] = useState('');
  const [copied, setCopied] = useState(false);


  // Schedule related states
  const [futureSelection, setFutureSelection] = useState<(Event | null)[]>([]);
  const [futureOrder, setFutureOrder] = useState<number[]>([]);
  const [dialogContext, setDialogContext] = useState<'view' | 'schedule'>('view');
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
        { name: 'tc-chaser', url: '/api/streams?type=tc-chaser' },
      ];

      // Fetch scraped endpoints sequentially
      const scrapedResults: Record<string, any> = {};
      for (const endpoint of endpointsToScrape) {
          const response = await fetch(`/api/streams?type=${endpoint.name}`);
          if (response.ok) {
              scrapedResults[endpoint.name] = await response.json();
          } else {
              console.error(`Error fetching ${endpoint.name}: ${response.status} ${response.statusText}`);
              scrapedResults[endpoint.name] = [];
          }
      }

      // Fetch other endpoints in parallel
      const otherResults = await Promise.allSettled(
        otherEndpoints.map(ep => fetch(ep.url).then(res => {
          if (res.ok) return res.json();
          return Promise.reject(new Error(`Failed to fetch ${ep.url} with status ${res.status}`));
        }))
      );
      
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
      const tcChaserData: TCChaserEvent[] = getOtherData<TCChaserEvent>('tc-chaser');


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

      const tcChaserOptions = [
          { url: 'https://tvlibreonline.org/html/fl/?get=Q2FuYWw3', label: 'TV PUBLICA - 1', hd: false, language: '' },
          { url: 'https://la14hd.com/vivo/canales.php?stream=tvpublica', label: 'TV PUBLICA - 2', hd: false, language: '' },
          { url: 'https://streamtpglobal.com/global1.php?stream=tv_publica', label: 'TV PUBLICA - 3', hd: false, language: '' },
          { url: 'https://tvlibreonline.org/html/fl/?get=RGVwb3JUVkhE', label: 'DEPORTV', hd: true, language: '' },
          { url: 'https://streamtpglobal.com/global1.php?stream=dsports2', label: 'DIRECTV - 1', hd: false, language: '' },
          { url: 'https://streamtpglobal.com/global1.php?stream=dsportsplus', label: 'DIRECTV - 2', hd: false, language: '' },
          { url: 'https://streamtpglobal.com/global1.php?stream=dsports', label: 'DIRECTV - 3', hd: false, language: '' },
          { url: 'https://la14hd.com/vivo/canales.php?stream=dsportsplus', label: 'DIRECTV - 4', hd: false, language: '' },
          { url: 'https://la14hd.com/vivo/canales.php?stream=dsports', label: 'DIRECTV - 5', hd: false, language: '' },
          { url: 'https://la14hd.com/vivo/canales.php?stream=dsports2', label: 'DIRECTV - 6', hd: false, language: '' },
          { url: 'https://rereyano.ru/player/3/77', label: 'TYC SPORTS - 1', hd: false, language: '' },
          { url: 'https://elcanaldeportivo.com/tycsports-sd.php', label: 'TYC SPORTS - 2', hd: false, language: '' },
          { url: 'https://streamtpglobal.com/global1.php?stream=tycsports', label: 'TYC SPORTS - 3', hd: false, language: '' },
          { url: 'https://tvlibreonline.org/html/fl/?get=VHlDU3BvcnQ', label: 'TYC SPORTS - 4', hd: false, language: '' },
          { url: 'https://tvlibreonline.org/html/hls.html?get=aHR0cHM6Ly9saXZlLTAxLTAyLWVsdHJlY2Uudm9kZ2MubmV0L2VsdHJlY2V0di9pbmRleC5tM3U4', label: 'ELTRECE - 1', hd: true, language: '' },
          { url: 'https://tvlibreonline.org/html/fl/?get=QXJ0ZWFySEQ', label: 'ELTRECE - 2', hd: true, language: '' },
          { url: 'https://motorplay.tv/ar', label: 'OPCION DE PAGO', hd: true, language: '' },
      ];
      
      const tcChaserEvents: Event[] = tcChaserData.map((event, index) => {
          return {
              id: `${event.event_title}-tc-chaser-${index}`,
              title: event.event_title,
              time: '--:--',
              options: tcChaserOptions,
              sources: [],
              buttons: [],
              category: 'Motor Sports',
              language: '',
              date: event.event_time_and_day.split('T')[0],
              source: 'tc-chaser',
              image: event.cover_image,
              status: 'Desconocido',
          };
      });
      
      const combinedInitialEvents = [...initialEvents, ...streamTpEvents, ...agendaEvents, ...tcChaserEvents, formula1StaticEvent];
      
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

  // Load state from localStorage on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
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
    
    const storedSchedules = localStorage.getItem('schedules');
    if (storedSchedules) {
        try {
            const parsedSchedules: Schedule[] = JSON.parse(storedSchedules).map((s: any) => ({
                ...s,
                dateTime: new Date(s.dateTime) // Re-hydrate Date objects
            }));
            setSchedules(parsedSchedules);
        } catch(e) { console.error("Failed to parse schedules from localStorage", e); }
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
    if (!isViewMode || schedules.length === 0) return;

    const interval = setInterval(() => {
        const now = new Date();
        const dueSchedules = schedules.filter(s => isBefore(s.dateTime, now));

        if (dueSchedules.length > 0) {
            const scheduleToApply = dueSchedules.sort((a, b) => a.dateTime.getTime() - b.dateTime.getTime())[0];
            
            setSelectedEvents(scheduleToApply.events);
            setViewOrder(scheduleToApply.order);

            const remainingSchedules = schedules.filter(s => s.id !== scheduleToApply.id);
            setSchedules(remainingSchedules);
        }
    }, 30000); 

    return () => clearInterval(interval);
  }, [isViewMode, schedules, setSelectedEvents, setViewOrder]);


  useEffect(() => {
    if (!isInitialLoadDone) {
      fetchEvents();
    }
  }, [isInitialLoadDone, fetchEvents]);
  
  useEffect(() => {
    if (addEventsDialogOpen) {
      // Logic inside EventSelectionDialog now
    }
  }, [addEventsDialogOpen, fetchEvents]);

  useEffect(() => {
    if (isInitialLoadDone) {
        localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
        localStorage.setItem('viewOrder', JSON.stringify(viewOrder));
        localStorage.setItem('gridGap', gridGap.toString());
        localStorage.setItem('borderColor', borderColor);
        localStorage.setItem('isChatEnabled', JSON.stringify(isChatEnabled));
        localStorage.setItem('schedules', JSON.stringify(schedules));
    }
  }, [selectedEvents, viewOrder, gridGap, borderColor, isChatEnabled, schedules, isInitialLoadDone]); 

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
    setViewOrder(newOrder);
  };
  
  const handleRestoreGridSettings = () => {
    setGridGap(0);
    setBorderColor('#000000');
  };

  const { liveEvents, upcomingEvents, unknownEvents, finishedEvents, searchResults, allSortedEvents, categoryFilteredEvents, channels247Events, mobileSortedEvents } = useMemo(() => {
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
    
    const combinedEvents = [...events, ...channels247];
    
    const eventMap = new Map<string, Event>();

    combinedEvents.forEach(event => {
        const key = event.id;
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
            const newTitle = event.title.length > existingEvent.title.length ? event.title : event.title;

            eventMap.set(key, {
                ...existingEvent,
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

        if (e.source === 'tc-chaser') {
            return { ...e, status: 'Desconocido' as const, time: '--:--' };
        }


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

        // Add MULTICAM button to F1 events
        if (e.title.toLowerCase().includes('formula 1') || e.title.toLowerCase().includes('f1')) {
          const multicamOption: StreamOption = {
              url: 'https://p.alangulotv.blog/multi-f1.html',
              label: 'MULTICAM',
              hd: false,
              language: ''
          };
          const hasMulticam = e.options.some(opt => opt.url === multicamOption.url);
          if (!hasMulticam) {
              e.options.unshift(multicamOption);
          }
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

    const allLiveEvents = processedEvents.filter(e => e.status === 'En Vivo' && e.category !== '24/7');
    const liveCustom = allLiveEvents.filter(e => e.image && e.image !== placeholderImage).sort(liveSortLogic);
    const liveDefault = allLiveEvents.filter(e => !e.image || e.image === placeholderImage).sort(liveSortLogic);
    const live = [...liveCustom, ...liveDefault];

    const upcoming = processedEvents.filter(e => e.status === 'Próximo').sort(upcomingSortLogic);
    
    const unknown = processedEvents
      .filter(e => e.status === 'Desconocido')
      .sort(upcomingSortLogic);

    const finished = processedEvents
        .filter(e => e.status === 'Finalizado' && !excludedFromFinished.has(e.title))
        .sort((a,b) => b.time.localeCompare(a.time));
    
    const channels247FromEvents = processedEvents.filter(e => e.category === '24/7' && e.status === 'En Vivo');
    
    const allSorted = [...live, ...upcoming, ...unknown, ...finished];
    
    const mobileLiveCustom = allLiveEvents.filter(e => e.image && e.image !== placeholderImage).sort(liveSortLogic);
    const mobileLiveDefault = allLiveEvents.filter(e => !e.image || e.image === placeholderImage).sort(liveSortLogic);
    const mobileUpcoming = processedEvents.filter(e => e.status === 'Próximo').sort(upcomingSortLogic);
    const mobileUnknown = processedEvents.filter(e => e.status === 'Desconocido').sort(upcomingSortLogic);
    const mobileFinished = finished;
    const mobileSorted = [...mobileLiveCustom, ...mobileLiveDefault, ...channels247FromEvents, ...mobileUpcoming, ...mobileUnknown, ...mobileFinished];


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
        
        const liveCatCustom = categoryEvents.filter(e => e.status === 'En Vivo' && (e.image && e.image !== placeholderImage)).sort(liveSortLogic);
        const liveCatDefault = categoryEvents.filter(e => e.status === 'En Vivo' && (!e.image || e.image === placeholderImage)).sort(liveSortLogic);
        const upcomingCat = categoryEvents.filter(e => e.status === 'Próximo').sort(upcomingSortLogic);
        const unknownCat = categoryEvents.filter(e => e.status === 'Desconocido').sort(upcomingSortLogic);
        const finishedCat = categoryEvents.filter(e => e.status === 'Finalizado').sort((a,b) => b.time.localeCompare(a.time));

        categoryFilteredEvents = [...liveCatCustom, ...liveCatDefault, ...upcomingCat, ...unknownCat, ...finishedCat];
    }

    return { 
        liveEvents: live, 
        upcomingEvents: upcoming, 
        unknownEvents: unknown, 
        finishedEvents: finished,
        searchResults,
        allSortedEvents: allSorted,
        mobileSortedEvents: mobileSorted,
        categoryFilteredEvents,
        channels247Events: channels247FromEvents,
    };
  }, [events, searchTerm, currentView, channelsData]);


  const categories = useMemo(() => {
    const categorySet = new Set<string>();
    [...events, ...channels247].forEach(event => {
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


  const handleEventSelect = (event: Event, optionUrl: string) => {
    const eventWithSelection = { ...event, selectedOption: optionUrl };

    if (dialogContext === 'schedule') {
        const newFutureSelection = [...futureSelection];
        const emptyIndex = newFutureSelection.findIndex(e => e === null);
        if (emptyIndex !== -1) {
            newFutureSelection[emptyIndex] = eventWithSelection;
            setFutureSelection(newFutureSelection);
        } else {
            alert("No hay espacios disponibles en la programación.");
        }
        setEventSelectionDialogOpen(false);
        setScheduleManagerOpen(true);
        return;
    }
    
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
        toast({
            variant: 'destructive',
            title: 'Selección Completa',
            description: 'No puedes añadir más de 9 eventos. Elimina uno para añadir otro.',
        });
    }
    
    setEventSelectionDialogOpen(false);
    setAddEventsDialogOpen(false);
    setIsModification(false);
    setModificationIndex(null);
  };
  
  const handleEventRemove = useCallback((windowIndex: number) => {
    const newSelectedEvents = [...selectedEvents];
    newSelectedEvents[windowIndex] = null;
    setSelectedEvents(newSelectedEvents);
  }, [selectedEvents, setSelectedEvents]);
  
  const getEventSelection = (event: Event) => {
    const selectionIndex = selectedEvents.findIndex(se => se?.id === event.id);
    if (selectionIndex !== -1 && selectedEvents[selectionIndex]) {
      return { isSelected: true, selectedOption: selectedEvents[selectionIndex]!.selectedOption };
    }
    return { isSelected: false, selectedOption: null };
  };

  const selectedEventsCount = selectedEvents.filter(Boolean).length;

  const handleStartView = (isControlledStart = false) => {
    if (selectedEventsCount === 0) return;
    if (isControlledStart) {
      sessionStorage.setItem('isControlledStart', 'true');
    }
    setIsViewMode(true);
  };
  
  const handleStopView = useCallback(() => {
    setIsViewMode(false);
    setFullscreenIndex(null);
  }, []);

  const handleStartAndControl = async () => {
    if (selectedEventsCount === 0) {
        toast({
            variant: 'destructive',
            title: 'No hay eventos seleccionados',
            description: 'Por favor, selecciona al menos un evento para iniciar la vista controlada.',
        });
        return;
    }
    handleStartView(true);
    const code = await remoteControlManagerRef.current?.startControlledSession();
    if (code) {
        setControlledSessionCode(code);
        setIsControlledSessionDialog(true);
    }
  };

 const openDialogForEvent = async (event: Event, context: 'view' | 'schedule' = 'view') => {
    setDialogContext(context);
    setIsOptionsLoading(true);
    setEventSelectionDialogOpen(true);
    setDialogEvent(event);
    
    const selection = getEventSelection(event);
    let eventForDialog = {...event};
    
    const isModifying = selection.isSelected;
    setIsModification(isModifying);

    if (isModifying) {
        const originalIndex = selectedEvents.findIndex(se => se?.id === event.id);
        setModificationIndex(originalIndex);
        if(selection.selectedOption) {
            eventForDialog.selectedOption = selection.selectedOption;
        }
    } else {
        setModificationIndex(selectedEvents.findIndex(e => e === null));
    }
    
    const mainEvent = events.find(e => e.id === event.id);
    if (mainEvent && mainEvent.options.length > 0) {
        setDialogEvent({ ...eventForDialog, options: mainEvent.options });
        setIsOptionsLoading(false);
        return;
    }

    if (event.source === 'streamed.pk' && event.options.length === 0) {
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
            const streamOptions: StreamOption[] = results.flat().filter(Boolean) as StreamOption[];

            setEvents(prevEvents => prevEvents.map(e => e.id === event.id ? { ...e, options: streamOptions } : e));
            setDialogEvent({ ...eventForDialog, options: streamOptions });

        } catch (error) {
            console.error(`Failed to fetch streams for ${event.title}`);
        } finally {
            setIsOptionsLoading(false);
        }
    } else {
        setDialogEvent(eventForDialog);
        setIsOptionsLoading(false);
    }
  };


  const handleChannelClick = (channel: Channel) => {
    const channelAsEvent: Event = {
      id: `${channel.name}-channel-static`,
      title: channel.name,
      options: channel.urls.map(u => ({...u, hd: false, language: ''})),
      sources: [],
      buttons: [],
      time: 'AHORA',
      category: 'Canal',
      language: '',
      date: '',
      source: '',
      status: 'En Vivo',
      image: channel.logo,
    };

    const selection = getEventSelection(channelAsEvent);
    if (selection.isSelected) {
        const selectedEvent = selectedEvents.find(se => se?.id === channelAsEvent.id);
        if (selectedEvent) {
          channelAsEvent.selectedOption = selectedEvent.selectedOption;
        }
    }

    setDialogEvent(channelAsEvent);
    setEventSelectionDialogOpen(true);
    setIsOptionsLoading(false);


    if (selection.isSelected) {
        setIsModification(true);
        const originalIndex = selectedEvents.findIndex(se => se?.id === channelAsEvent.id);
        setModificationIndex(originalIndex);
    } else {
        setIsModification(false);
        setModificationIndex(selectedEvents.findIndex(e => e === null));
    }
  };
  
  const openDialogForModification = (event: Event, index: number) => {
    const eventWithSelection = { ...event, selectedOption: selectedEvents[index]?.selectedOption };
    setDialogEvent(eventWithSelection);
    setIsModification(true);
    setModificationIndex(index);
    setEventSelectionDialogOpen(true);
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
    setFullscreenIndex(prevIndex => (prevIndex === index ? null : index));
  };


  const handleRemoveEventFromDialog = (event: Event) => {
    setSelectedEvents((currentSelectedEvents: (Event | null)[]) => {
        return currentSelectedEvents.map(se => se?.id === event.id ? null : se);
    });
    setEventSelectionDialogOpen(false);
};
  
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
 
  const handleCopyCode = () => {
    navigator.clipboard.writeText(controlledSessionCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };


  if (!isInitialLoadDone) {
    return <LoadingScreen />;
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
            <ScheduleManager 
            open={scheduleManagerOpen}
            onOpenChange={setScheduleManagerOpen}
            currentSelection={futureSelection}
            currentOrder={futureOrder}
            schedules={schedules}
            onSchedulesChange={setSchedules}
            onModifyEventInView={openDialogForModification}
            isLoading={isAddEventsLoading}
            onAddEvent={() => setAddEventsDialogOpen(true)}
            setFutureSelection={setFutureSelection}
            setFutureOrder={setFutureOrder}
            initialSelection={selectedEvents}
            initialOrder={viewOrder}
            />
            <NotificationManager
            open={notificationManagerOpen}
            onOpenChange={setNotificationManagerOpen}
            allCategories={categories}
            />
            <Dialog open={welcomePopupOpen} onOpenChange={setWelcomePopupOpen}>
                <DialogContent className="sm:max-w-md p-0" hideClose={true}>
                    <DialogHeader className="sr-only">
                        <DialogModalTitle>Bienvenida</DialogModalTitle>
                    </DialogHeader>
                    <DialogModalClose asChild>
                    <Button variant="ghost" className="absolute right-2 top-2 rounded-full p-1 bg-black/50 text-white/70 transition-colors hover:bg-black/75 hover:text-white focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 z-10" onClick={() => setWelcomePopupOpen(false)}>
                        <X className="h-4 w-4" />
                        <span className="sr-only">Close</span>
                    </Button>
                    </DialogModalClose>
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
                            <DialogDescription className="text-yellow-500/80">
                                Algunos canales pueden tardar mas en cargar que otros, hasta no ver un mensaje de error, NO CAMBIAR DE CANAL.
                            </DialogDescription>
                        </Alert>
                    </div>
                    <DialogFooter className="flex-row items-center justify-center gap-2 p-4 border-t bg-background">
                        <Dialog open={isTutorialOpen} onOpenChange={setIsTutorialOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="gap-2">
                                <BookOpen /> Tutorial
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogModalTitle>Tutorial de Uso</DialogModalTitle>
                            </DialogHeader>
                            <ScrollArea className="h-96 pr-6">
                                <div className="text-sm text-muted-foreground space-y-4">
                                    <p><strong>¡Bienvenido a Deportes para Todos!</strong> Aquí puedes ver múltiples eventos deportivos a la vez. Sigue estos simples pasos para empezar:</p>
                                    
                                    <h3 className="font-bold text-foreground mt-4">1. Elige tus Eventos</h3>
                                    <p>En la pantalla principal, haz clic en las tarjetas de los partidos o canales que quieras ver. Se abrirá una ventana para que elijas una opción de transmisión.</p>
                                    
                                    <h3 className="font-bold text-foreground mt-4">2. Configura tu Vista</h3>
                                    <p>Haz clic en el icono de engranaje (<Settings className="inline-block h-4 w-4" />) en la esquina superior derecha. Se abrirá un panel donde podrás ver tu selección, reordenar las ventanas o eliminarlas.</p>
                                    
                                    <h3 className="font-bold text-foreground mt-4">3. Inicia la Transmisión</h3>
                                    <p>Una vez que estés listo, presiona el botón de "Play" (<Play className="inline-block h-4 w-4" />). Tu pantalla se dividirá para mostrar todos los eventos que elegiste.</p>

                                    <h3 className="font-bold text-foreground mt-4">4. Control Remoto y Programación</h3>
                                    <p>Puedes controlar la vista desde otro dispositivo activando el <strong>Control Remoto</strong> en el menú de configuración. También puedes <strong>Programar</strong> una selección de eventos para que se active a una hora específica.</p>
                                    
                                    <p className="pt-2">¡Eso es todo! Explora, personaliza y disfruta del deporte como nunca antes.</p>
                                </div>
                            </ScrollArea>
                            <DialogFooter>
                                <DialogModalClose asChild><Button>Entendido</Button></DialogModalClose>
                            </DialogFooter>
                        </DialogContent>
                        </Dialog>
                        <Dialog open={isErrorsOpen} onOpenChange={setIsErrorsOpen}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="gap-2">
                                    <AlertCircle /> Solución de Errores
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                    <DialogModalTitle>Solución de Errores Comunes</DialogModalTitle>
                                </DialogHeader>
                                <ScrollArea className="h-96 pr-6">
                                    <div className="text-sm text-muted-foreground space-y-4">
                                        <p>A continuación, te presentamos una guía detallada para resolver los problemas más frecuentes que podrías encontrar al intentar reproducir videos. Sigue estos pasos en orden para maximizar las chances de éxito.</p>
                                        <h3 className="font-bold text-foreground">1. Configurar un DNS público (Cloudflare o Google)</h3>
                                        <p><span className="font-semibold text-foreground">El Problema:</span> Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios o servidores de video a través de su DNS. Esto provoca que el video nunca cargue y veas una pantalla en negro o un error de conexión.</p>
                                        <p><span className="font-semibold text-foreground">La Solución:</span> Cambiar el DNS de tu dispositivo o router a uno público como el de <a href="https://one.one.one.one" target="_blank" rel="noopener noreferrer" className="text-primary underline">Cloudflare (1.1.1.1)</a> o Google (8.8.8.8) puede saltarse estas restricciones.</p>
                                        <h3 className="font-bold text-foreground">2. Instalar una Extensión de Reproductor de Video</h3>
                                        <p><span className="font-semibold text-foreground">El Problema:</span> Algunos streams de video utilizan formatos modernos como M3U8 o MPD que no todos los navegadores soportan de forma nativa. Si el navegador no sabe cómo "leer" el formato, el video no se reproducirá.</p>
                                        <p><span className="font-semibold text-foreground">La Solución:</span> Instalar una extensión como "<a href="https://chromewebstore.google.com/detail/reproductor-mpdm3u8m3uepg/opmeopcambhfimffbomjgemehjkbbmji?hl=es" target="_blank" rel="noopener noreferrer" className="text-primary underline">Reproductor MPD/M3U8/M3U/EPG</a>" (para Chrome/Edge) le da a tu navegador las herramientas necesarias para decodificar y reproducir estos formatos.</p>
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
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isControlledSessionDialog} onOpenChange={setIsControlledSessionDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogModalTitle>Control Remoto Activado</DialogModalTitle>
                        <DialogDescription>
                            Introduce este código en el dispositivo que usarás como control remoto para empezar a gestionar esta vista.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex items-center justify-center gap-2 p-4 border-2 border-dashed rounded-lg my-4">
                        <span className="text-2xl font-bold tracking-widest">{controlledSessionCode}</span>
                        <Button size="icon" variant="ghost" onClick={handleCopyCode}>
                            {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                        </Button>
                    </div>
                    <DialogFooter>
                        <DialogModalClose asChild>
                            <Button>Cerrar</Button>
                        </DialogModalClose>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="relative flex flex-col h-screen w-screen flex-grow">
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
                    order={viewOrder.filter(i => selectedEvents[i] !== null)}
                    onOrderChange={handleOrderChange}
                    eventDetails={selectedEvents}
                    onReload={handleReloadCamera}
                    onRemove={handleEventRemove}
                    onModify={openDialogForModification}
                    onToggleFullscreen={handleToggleFullscreen}
                    fullscreenIndex={fullscreenIndex}
                    isViewPage={true}
                    onAddEvent={() => setAddEventsDialogOpen(true)}
                    onSchedule={() => setScheduleManagerOpen(true)}
                    onNotificationManager={() => setNotificationManagerOpen(true)}
                    onRemoteControl={remoteControlManagerRef.current?.startControlledSession}
                    gridGap={gridGap}
                    onGridGapChange={setGridGap}
                    borderColor={borderColor}
                    onBorderColorChange={setBorderColor}
                    onRestoreGridSettings={handleRestoreGridSettings}
                    isChatEnabled={isChatEnabled}
                    onIsChatEnabledChange={setIsChatEnabled}
                    categories={categories}
                    onOpenTutorial={() => setIsTutorialOpen(true)}
                    onOpenErrors={() => setIsErrorsOpen(true)}
                    onOpenCalendar={() => setCalendarOpen(true)}
                    isTutorialOpen={isTutorialOpen}
                    onIsTutorialOpenChange={setIsTutorialOpen}
                    isErrorsOpen={isErrorsOpen}
                    onIsErrorsOpenChange={setIsErrorsOpen}
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
                        ...fullscreenIndex === null ? { 
                            gap: `${gridGap}px`,
                            padding: `${gridGap}px`,
                            backgroundColor: borderColor
                        } : {},
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
                                fullscreenIndex !== null && fullscreenIndex !== windowSlotIndex && "hidden", // Hide if another is fullscreen
                                fullscreenIndex === windowSlotIndex && 'absolute inset-0 z-20', // Style for fullscreen window
                                !event && "hidden", // Hide if no event is selected for this slot
                                fullscreenIndex === null && getItemClasses(orderedIndex, numCameras)
                            )}
                            style={{
                                order: orderedIndex,
                            }}
                        >
                        {event && (
                            <iframe
                                ref={el => (iframeRefs.current[windowSlotIndex] = el)}
                                src={event.selectedOption ? `${event.selectedOption}${event.selectedOption.includes('?') ? '&' : '?'}reload=${reloadCounters[windowSlotIndex] || 0}`: 'about:blank'}
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
  }

  const renderHomeContent = () => {
    let itemsToDisplay: (Event|Channel)[] = [];
    if (searchTerm) {
      itemsToDisplay = searchResults;
    } else if (currentView === 'home') {
       return (
        <>
            <div className="w-full space-y-4 pt-4 md:mb-8">
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
            
            {isMobile ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6 pt-4">
                    {mobileSortedEvents.map((event, index) => (
                        <EventCard
                            key={`mobile-event-${event.id}-${index}`}
                            event={event}
                            selection={getEventSelection(event)}
                            onClick={() => openDialogForEvent(event)}
                            displayMode='checkmark'
                        />
                    ))}
                </div>
            ) : (
                <>
                    <div className="mb-8">
                        <EventCarousel title="Canales" channels={channelsData} onChannelClick={handleChannelClick} getEventSelection={getEventSelection} />
                    </div>
                    <div className="mb-8">
                        <EventCarousel title="En Vivo" events={liveEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                    </div>
                     <div className="mb-8">
                        <EventCarousel title="Canales 24/7" events={channels247Events} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
                    </div>
                    <div className="mb-8">
                        <EventCarousel title="Próximos" events={upcomingEvents} onCardClick={openDialogForEvent} getEventSelection={getEventSelection} />
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
       );
    } else if (currentView === 'live') {
      itemsToDisplay = liveEvents;
    } else if (currentView === 'channels') {
      itemsToDisplay = channelsData;
    } else {
      itemsToDisplay = categoryFilteredEvents;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 pt-4">
          {itemsToDisplay.map((item, index) => {
              const isChannel = 'urls' in item;
              if (isChannel) {
                const channelAsEvent: Event = { id: `${(item as Channel).name}-channel-static`, title: (item as Channel).name, time: 'AHORA', category: 'Canal', options: [], sources: [], buttons: [], language: '', date: '', source: '', status: 'En Vivo', image: (item as Channel).logo };
                const selection = getEventSelection(channelAsEvent);
                return (
                    <Card 
                        key={`search-channel-${index}`}
                        className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border flex flex-col h-full"
                        onClick={() => handleChannelClick(item as Channel)}
                    >
                        <div className={cn("relative w-full flex-grow flex items-center justify-center p-2 bg-white aspect-video")}>
                            <Image
                                src={(item as Channel).logo}
                                alt={`${(item as Channel).name} logo`}
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
                        <div className="p-3 bg-card min-h-[52px] flex items-center justify-center">
                            <h3 className="font-bold text-sm text-center line-clamp-2">{item.name}</h3>
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
                      displayMode='checkmark'
                    />
                );
              }
          })}
      </div>
    );
  };
  
  return (
    <>
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

                                     <Sheet>
                                        <SheetTrigger asChild>
                                          <Button variant="ghost" size="icon">
                                            <Settings />
                                          </Button>
                                        </SheetTrigger>
                                         <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0">
                                              <SheetHeader className="p-0 m-0 h-0">
                                                <SheetTitle className="sr-only">Configuración</SheetTitle>
                                              </SheetHeader>
                                              <LayoutConfigurator
                                                order={viewOrder.filter(i => selectedEvents[i] !== null)}
                                                onOrderChange={handleOrderChange}
                                                eventDetails={selectedEvents}
                                                onRemove={handleEventRemove}
                                                onModify={openDialogForModification}
                                                isViewPage={false}
                                                onAddEvent={() => setAddEventsDialogOpen(true)}
                                                gridGap={gridGap}
                                                onGridGapChange={setGridGap}
                                                borderColor={borderColor}
                                                onBorderColorChange={setBorderColor}
                                                onRestoreGridSettings={handleRestoreGridSettings}
                                                isChatEnabled={isChatEnabled}
                                                onIsChatEnabledChange={setIsChatEnabled}
                                                categories={categories}
                                                onOpenTutorial={() => setIsTutorialOpen(true)}
                                                onOpenErrors={() => setIsErrorsOpen(true)}
                                                onNotificationManager={() => setNotificationManagerOpen(true)}
                                                onOpenCalendar={() => setCalendarOpen(true)}
                                                isTutorialOpen={isTutorialOpen}
                                                onIsTutorialOpenChange={setIsTutorialOpen}
                                                isErrorsOpen={isErrorsOpen}
                                                onIsErrorsOpenChange={setIsErrorsOpen}
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

      {/* Dialogs at top level */}
      <AddEventsDialog
          open={addEventsDialogOpen}
          onOpenChange={setAddEventsDialogOpen}
          onEventSelect={handleEventSelect}
          onChannelClick={handleChannelClick}
          getEventSelection={getEventSelection}
          events={events}
          channels={channelsData}
          liveEvents={liveEvents}
          upcomingEvents={upcomingEvents}
          unknownEvents={unknownEvents}
          finishedEvents={finishedEvents}
          channels247Events={channels247Events}
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
              onOpenChange={setEventSelectionDialogOpen}
              event={dialogEvent}
              onSelect={handleEventSelect}
              isModification={isModification}
              onRemove={() => handleRemoveEventFromDialog(dialogEvent)}
              isLoading={isOptionsLoading}
          />
      )}
      <RemoteControlManager
          ref={remoteControlManagerRef}
          appState={{
              selectedEvents,
              viewOrder,
              gridGap,
              borderColor,
              isChatEnabled,
              schedules,
          }}
          setAppState={({
              selectedEvents: newSelectedEvents,
              viewOrder: newViewOrder,
              gridGap: newGridGap,
              borderColor: newBorderColor,
              isChatEnabled: newIsChatEnabled,
              schedules: newSchedules,
          }) => {
              if (newSelectedEvents) setSelectedEvents(newSelectedEvents);
              if (newViewOrder) setViewOrder(newViewOrder);
              if (newGridGap) setGridGap(newGridGap);
              if (newBorderColor) setBorderColor(newBorderColor);
              if (newIsChatEnabled) setIsChatEnabled(newIsChatEnabled);
              if (newSchedules) setSchedules(newSchedules);
          }}
          allEvents={events}
          allChannels={channelsData}
      />
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
                      remoteControlManagerRef.current?.startControllingSession(controllerCode);
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
