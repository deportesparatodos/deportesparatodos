

'use client';

import { useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Loader2, Tv, X, Search, RotateCw, FileText, AlertCircle, Mail, BookOpen, Play, Settings, Menu, ArrowLeft, Pencil, Trash2, MessageSquare, Maximize, Minimize, AlertTriangle, Plus, BellRing, Airplay, CalendarDays, Volume2, VolumeX } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import { EventCard } from '@/components/event-card';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Badge } from '@/components/ui/badge';
import { LayoutConfigurator } from '@/components/layout-configurator';
import { toZonedTime, format } from 'date-fns-tz';
import { addHours, isBefore, isAfter, parse, differenceInMinutes, isValid, isPast, isFuture, differenceInDays, isToday } from 'date-fns';
import { LoadingScreen } from '@/components/loading-screen';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { ScheduleManager, type Schedule } from '@/components/schedule-manager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NotificationManager } from '@/components/notification-manager';
import type { Subscription } from '@/components/notification-manager';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RemoteControlDialog, RemoteControlView, type RemoteControlViewState } from '@/components/remote-control';
import Ably from 'ably';


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
  source: "",
};


const isValidTimeFormat = (time: string) => /^\d{2}:\d{2}$/.test(time);

const normalizeCategory = (category: string): string => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory === 'football' || lowerCategory === 'fútbol' || lowerCategory === 'fútbol_cup') {
        return 'Fútbol';
    }
    return category;
};

function HomePageContent() {
  const isMobile = useIsMobile();
  const [selectedEvents, setSelectedEvents] = useState<(Event | null)[]>(Array(9).fill(null));
  const [viewOrder, setViewOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));
  const [gridGap, setGridGap] = useState<number>(0);
  const [borderColor, setBorderColor] = useState<string>('#000000');
  const [isChatEnabled, setIsChatEnabled] = useState<boolean>(true);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const iframeRefs = useRef<(HTMLIFrameElement | null)[]>([]);
  const [mutedStates, setMutedStates] = useState<boolean[]>(Array(9).fill(true));


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
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isInitialLoadDone, setIsInitialLoadDone] = useState(false);
  const [lastFetchTimestamp, setLastFetchTimestamp] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isOptionsLoading, setIsOptionsLoading] = useState(false);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);
  const [sideMenuOpen, setSideMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentView, setCurrentView] = useState<string>('home');
  
  // Dialog/Popup states
  const [configDialogOpen, setConfigDialogOpen] = useState(false);
  const [tutorialDialogOpen, setTutorialDialogOpen] = useState(false);
  const [errorsDialogOpen, setErrorsDialogOpen] = useState(false);
  const [addEventsDialogOpen, setAddEventsDialogOpen] = useState(false);
  const [modifyEvent, setModifyEvent] = useState<{ event: Event, index: number } | null>(null);
  const [modifyEventDialogOpen, setModifyEventDialogOpen] = useState(false);
  const [scheduleManagerOpen, setScheduleManagerOpen] = useState(false);
  const [notificationManagerOpen, setNotificationManagerOpen] = useState(false);
  const [isAddEventsLoading, setIsAddEventsLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [codePopupOpen, setCodePopupOpen] = useState(false);


  // Schedule related states
  const [futureSelection, setFutureSelection] = useState<(Event | null)[]>([]);
  const [futureOrder, setFutureOrder] = useState<number[]>([]);
  const [dialogContext, setDialogContext] = useState<'view' | 'schedule'>('view');

  // --- Remote Control States ---
  const ablyRef = useRef<{ client: Ably.Realtime | null; channel: Ably.Types.RealtimeChannelPromise | null }>({ client: null, channel: null });
  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null);
  const [remoteControlMode, setRemoteControlMode] = useState<'inactive' | 'controlling' | 'controlled'>('inactive');

  // Notification states
  const { toast } = useToast();
  
  const cleanupAbly = useCallback(() => {
    const { client, channel } = ablyRef.current;
    if (channel) {
      channel.detach();
    }
    if (client && (client.connection.state === 'connected' || client.connection.state === 'connecting')) {
      client.close();
    }
    ablyRef.current = { client: null, channel: null };
    setRemoteSessionId(null);
    setRemoteControlMode('inactive');
  }, []);

  const initAbly = useCallback(async (clientIdSuffix: string) => {
    if (ablyRef.current.client) {
      await ablyRef.current.client.connection.close();
    }
    const client = new Ably.Realtime({ authUrl: `/api/ably?clientId=${clientIdSuffix}-${Date.now()}` });
    await client.connection.once('connected');
    ablyRef.current.client = client;
    return client;
  }, []);
  
  const handleToggleMute = useCallback((index: number) => {
      setMutedStates(prev => {
          const newMutedStates = [...prev];
          newMutedStates[index] = !newMutedStates[index];
          return newMutedStates;
      });

      if (remoteControlMode === 'controlled' && ablyRef.current.channel && remoteSessionId) {
          ablyRef.current.channel.publish('control-action', {
              action: 'updateMutedState',
              payload: {
                  index: index,
                  isMuted: !mutedStates[index],
                  sessionId: remoteSessionId
              }
          });
      }
  }, [mutedStates, remoteControlMode, remoteSessionId]);

  
  const handleStartControlledSession = useCallback(async () => {
    if (remoteControlMode === 'controlled' && ablyRef.current.channel) return;

    try {
        const client = await initAbly('controlled');
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        setRemoteSessionId(newCode);

        const channel = client.channels.get(`remote-control:${newCode}`);
        ablyRef.current.channel = channel;
        
        const presence = channel.presence;
        await presence.enter();
        setRemoteControlMode('controlled');

        channel.subscribe('control-action', (message: Ably.Types.Message) => {
            const { action, payload } = message.data;
            if (payload.sessionId !== newCode) return;

            switch (action) {
                case 'requestInitialState':
                    const currentState = {
                        selectedEvents, viewOrder, gridGap, borderColor, isChatEnabled, fullscreenIndex, mutedStates,
                        sessionId: newCode
                    };
                    channel.publish('control-action', { action: 'initialState', payload: currentState });
                    break;
                case 'updateState':
                    setSelectedEvents(payload.selectedEvents || Array(9).fill(null));
                    setViewOrder(payload.viewOrder || Array.from({ length: 9 }, (_, i) => i));
                    setGridGap(payload.gridGap ?? 0);
                    setBorderColor(payload.borderColor ?? '#000000');
                    setIsChatEnabled(payload.isChatEnabled ?? true);
                    setFullscreenIndex(payload.fullscreenIndex ?? null);
                    setMutedStates(payload.mutedStates ?? Array(9).fill(true));
                    break;
                case 'toggleFullscreen':
                    setFullscreenIndex(prev => prev === payload.index ? null : payload.index);
                    break;
                case 'toggleMute': 
                    handleToggleMute(payload.index);
                    break;
                 case 'reload':
                    handleReloadCamera(payload.index);
                    break;
                 case 'startView':
                    setIsViewMode(true);
                    break;
                case 'disconnect':
                     break;
            }
        });
        
        presence.subscribe('leave', () => {
             // Handle controller leaving if needed, e.g., show a message
        });

        setIsViewMode(true);
        setCodePopupOpen(true);

    } catch (error) {
        console.error("Failed to start controlled session:", error);
        toast({ variant: 'destructive', title: 'Error de Conexión', description: 'No se pudo iniciar el modo controlado.' });
        cleanupAbly();
    }
  }, [initAbly, cleanupAbly, toast, selectedEvents, viewOrder, gridGap, borderColor, isChatEnabled, fullscreenIndex, remoteControlMode, mutedStates, handleToggleMute]);
  
  const handleActivateControlledMode = async () => {
    if (selectedEvents.filter(Boolean).length === 0) {
      toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Debes seleccionar al menos un evento para iniciar el modo de control.',
      });
      return;
    }
    await handleStartControlledSession();
  };

  const handleStopView = useCallback(() => {
    const { channel } = ablyRef.current;
    if (remoteControlMode === 'controlled' && channel && remoteSessionId) {
        channel.publish('control-action', { action: 'controlledViewClosed', payload: { sessionId: remoteSessionId } });
    }
    setIsViewMode(false);
    setFullscreenIndex(null);
    if (remoteControlMode === 'controlled' || remoteControlMode === 'controlling') {
      cleanupAbly();
    }
  }, [remoteControlMode, cleanupAbly, remoteSessionId]);


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

      const initialEvents: Event[] = combinedData.map((match: StreamedMatch) => {
        const eventDate = new Date(match.date);
        const zonedEventTime = toZonedTime(eventDate, timeZone);
        
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
          title: match.title,
          time: format(zonedEventTime, 'HH:mm'),
          options: [], // Options will be fetched on demand
          sources: match.sources, 
          buttons: [],
          category: normalizeCategory(categoryMap[match.category] || match.category.charAt(0).toUpperCase() + match.category.slice(1)),
          language: '',
          date: format(zonedEventTime, 'yyyy-MM-dd'),
          source: 'streamed.pk',
          image: imageUrl,
          status: status,
        };
      });

      const streamTpEvents: Event[] = streamTpData.map(event => {
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
          
          return {
              title: event.title,
              time: eventTime,
              options: [{ url: event.link, label: optionLabel.toUpperCase(), hd: false, language: '' }],
              sources: [],
              buttons: [],
              category: normalizeCategory(event.category === 'Other' ? 'Otros' : event.category),
              language: '',
              date: format(toZonedTime(new Date(), timeZone), 'yyyy-MM-dd'),
              source: 'streamtpglobal',
              image: 'https://i.ibb.co/dHPWxr8/depete.jpg',
              status: status,
          };
      });

      const agendaEvents: Event[] = agendaData.map((event: AgendaEvent): Event => {
          const streamOptions: StreamOption[] = event.options.map((optionUrl, index) => ({
            url: optionUrl,
            label: event.buttons[index] || `STREAM ${index + 1}`,
            hd: false, 
            language: event.language || '',
          }));

          return {
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
      
      const tcChaserEvents: Event[] = tcChaserData.map(event => {
          const now = new Date();
          const eventDate = new Date(event.event_time_and_day);
          
          let status: Event['status'] = 'Próximo';
          if (isPast(eventDate) || differenceInDays(eventDate, now) <= 3) {
              status = 'En Vivo';
          }

          const zonedEventTime = toZonedTime(eventDate, timeZone);

          return {
              title: event.event_title,
              time: format(zonedEventTime, 'HH:mm'),
              options: tcChaserOptions,
              sources: [],
              buttons: [],
              category: 'Motor Sports',
              language: '',
              date: format(zonedEventTime, 'yyyy-MM-dd'),
              source: 'tc-chaser',
              image: event.cover_image,
              status: status,
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

    const storedMutedStates = localStorage.getItem('mutedStates');
    if (storedMutedStates) {
        try {
            const parsedMuted = JSON.parse(storedMutedStates);
            if(Array.isArray(parsedMuted) && parsedMuted.length === 9) {
                setMutedStates(parsedMuted);
            }
        } catch(e) { console.error("Failed to parse mutedStates from localStorage", e); }
    }
    
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
    
    if (isViewMode) {
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
      fetchEvents(false, true);
    }
  }, [addEventsDialogOpen, fetchEvents]);

  useEffect(() => {
    if (isInitialLoadDone) {
        localStorage.setItem('selectedEvents', JSON.stringify(selectedEvents));
        localStorage.setItem('viewOrder', JSON.stringify(viewOrder));
        localStorage.setItem('gridGap', gridGap.toString());
        localStorage.setItem('borderColor', borderColor);
        localStorage.setItem('isChatEnabled', JSON.stringify(isChatEnabled));
        localStorage.setItem('mutedStates', JSON.stringify(mutedStates));
        localStorage.setItem('schedules', JSON.stringify(schedules));
    }
  }, [selectedEvents, viewOrder, gridGap, borderColor, isChatEnabled, schedules, isInitialLoadDone, mutedStates]); 

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
        const normalized = normalizeTitle(event.title);
        const key = event.source === 'streamed.pk' ? `${normalized}|${event.date}|${event.time}` : `${normalized}|${normalized}|${event.time}`;

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

        if (e.source !== 'tc-chaser' && e.status === 'Desconocido' && e.time !== '--:--' && isValidTimeFormat(e.time)) {
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
  }, [events, searchTerm, currentView]);


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
  
  const handleEventRemove = useCallback((windowIndex: number) => {
    const newSelectedEvents = [...selectedEvents];
    newSelectedEvents[windowIndex] = null;
    setSelectedEvents(newSelectedEvents);
  }, [selectedEvents]);
  
  const getEventSelection = (event: Event) => {
    const selectionIndex = selectedEvents.findIndex(se => se?.title === event.title && se?.time === event.time);
    if (selectionIndex !== -1 && selectedEvents[selectionIndex]) {
      return { isSelected: true, selectedOption: selectedEvents[selectionIndex]!.selectedOption };
    }
    return { isSelected: false, selectedOption: null };
  };

  const selectedEventsCount = selectedEvents.filter(Boolean).length;

  const handleStartView = () => {
    if (remoteControlMode === 'controlling' || selectedEventsCount === 0) return;
    setIsViewMode(true);
  };

  

  const openDialogForEvent = (event: Event) => {
    const selection = getEventSelection(event);
    let eventForDialog = {...event};
    
    if (selection.isSelected) {
        setIsModification(true);
        const originalIndex = selectedEvents.findIndex(se => se?.title === event.title && se?.time === event.time);
        setModificationIndex(originalIndex);
        if(selection.selectedOption) {
            eventForDialog.selectedOption = selection.selectedOption;
        }
    } else {
        setIsModification(false);
        setModificationIndex(selectedEvents.findIndex(e => e === null));
    }
    
    setIsOptionsLoading(true);
    setDialogEvent(eventForDialog);
    setDialogOpen(true);
    
    // Fetch options if they are missing
    if (event.source === 'streamed.pk' && event.options.length === 0) {
        const fetchStreamOptions = async () => {
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
                
                // Update the event in the dialog with the fetched options
                setDialogEvent(prevEvent => prevEvent ? { ...prevEvent, options: streamOptions } : null);
                
                // Also update the main events array to cache the options
                setEvents(prevEvents => prevEvents.map(e => (e.title === event.title && e.time === event.time) ? { ...e, options: streamOptions } : e));
                
            } catch (error) {
                console.error(`Failed to fetch streams for ${event.title}`, error);
                setDialogEvent(prevEvent => prevEvent ? { ...prevEvent, options: [] } : null);
            } finally {
                setIsOptionsLoading(false);
            }
        };
        fetchStreamOptions();
    } else {
        setIsOptionsLoading(false); // No fetching needed, options already exist
    }
  };


  const handleChannelClick = (channel: Channel) => {
    const channelAsEvent: Event = {
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
        const selectedEvent = selectedEvents.find(se => se?.title === channelAsEvent.title);
        if (selectedEvent) {
          channelAsEvent.selectedOption = selectedEvent.selectedOption;
        }
    }

    setDialogEvent(channelAsEvent);
    setDialogOpen(true);
    setIsOptionsLoading(false); // Channels don't need to load options

    if (selection.isSelected) {
        setIsModification(true);
        const originalIndex = selectedEvents.findIndex(se => se?.title === channelAsEvent.title && se?.time === channelAsEvent.time);
        setModificationIndex(originalIndex);
    } else {
        setIsModification(false);
        setModificationIndex(selectedEvents.findIndex(e => e === null));
    }
  };
  
  const openDialogForModification = (event: Event, index: number) => {
    setConfigDialogOpen(false); // Close main config dialog
    const currentEventState = selectedEvents[index];
    if (!currentEventState) return;
    const eventForModification = { ...event, selectedOption: currentEventState.selectedOption };
    setModifyEvent({ event: eventForModification, index });
    setModifyEventDialogOpen(true); // Open the specific modification dialog
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

  const handleMinimizeFromView = () => {
    if (fullscreenIndex === null) return;
    const { channel } = ablyRef.current;
    if (remoteControlMode === 'controlled' && channel && remoteSessionId) {
        channel.publish('control-action', {
            action: 'minimizeFromControlled',
            payload: { sessionId: remoteSessionId }
        });
    }
    setFullscreenIndex(null);
  };


  const handleModifyEventSelect = (event: Event, option: string) => {
      const newSelectedEvents = [...selectedEvents];
      const eventWithSelection = { ...event, selectedOption: option };
      
      let targetIndex = -1;
      // This function can be called from the main page config or the view page config
      if (modifyEvent) {
          targetIndex = modifyEvent.index;
      }

      if (targetIndex !== -1) {
          newSelectedEvents[targetIndex] = eventWithSelection;
          setSelectedEvents(newSelectedEvents);
          if (isViewMode) {
              handleReloadCamera(targetIndex);
          }
      }

      // Close dialogs
      setModifyEvent(null);
      setModifyEventDialogOpen(false);
      // Re-open config dialog if we are not in view mode
      if (!isViewMode) {
        setConfigDialogOpen(true);
      }
  };
  
  const handleAddEventToSchedule = (event: Event, option: string) => {
    const newFutureSelection = [...futureSelection];
    const eventWithSelection = { ...event, selectedOption: option };
    const emptyIndex = newFutureSelection.findIndex(e => e === null);
    if (emptyIndex !== -1) {
        newFutureSelection[emptyIndex] = eventWithSelection;
        setFutureSelection(newFutureSelection);
    } else {
        alert("No hay espacios disponibles en la programación.");
    }
    setAddEventsDialogOpen(false);
    setScheduleManagerOpen(true);
  };

  const handleAddEventSelect = (event: Event, option: string) => {
    const newSelectedEvents = [...selectedEvents];
    const eventWithSelection = { ...event, selectedOption: option };

    const existingIndex = newSelectedEvents.findIndex(se => se?.title === event.title);

    if (existingIndex !== -1) {
        newSelectedEvents[existingIndex] = eventWithSelection;
    } else {
        const emptyIndex = newSelectedEvents.findIndex(e => e === null);
        if (emptyIndex !== -1) {
            newSelectedEvents[emptyIndex] = eventWithSelection;
        } else {
            alert("No empty slots available.");
            return;
        }
    }
    
    setSelectedEvents(newSelectedEvents);
    setAddEventsDialogOpen(false);
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

  const handleSelectForCurrentDialog = (event: Event, option: string) => {
    if (dialogContext === 'schedule') {
        handleAddEventToSchedule(event, option);
    } else {
        handleAddEventSelect(event, option);
    }
  };

  const handleEndRemoteSession = (finalState: RemoteControlViewState) => {
    setSelectedEvents(finalState.selectedEvents);
    setViewOrder(finalState.viewOrder);
    setGridGap(finalState.gridGap);
    setBorderColor(finalState.borderColor);
    setIsChatEnabled(finalState.isChatEnabled);
    setFullscreenIndex(finalState.fullscreenIndex);
    cleanupAbly();
    setIsSessionEnded(false);
  };

  if (remoteControlMode === 'controlling') {
    return (
      <Suspense fallback={<div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="mt-4 text-muted-foreground">Cargando modo de control...</p>
        </div>}>
        <RemoteControlView 
            ablyRef={ablyRef}
            initAbly={initAbly}
            onSessionEnd={handleEndRemoteSession}
            allEvents={events}
            allChannels={channels}
            updateAllEvents={setEvents}
            initialRemoteSessionId={remoteSessionId}
            isSessionEnded={isSessionEnded}
            setIsSessionEnded={setIsSessionEnded}
        />
      </Suspense>
    )
  }

  if (!isInitialLoadDone) {
    return <LoadingScreen />;
  }

  if (isViewMode) {
     const numCameras = selectedEventsCount;
     const gridContainerClasses = `grid flex-grow w-full h-full ${getGridClasses(numCameras)}`;
     
     if (numCameras === 0 && remoteControlMode === 'controlled') {
        return (
            <div className="flex flex-col h-screen bg-background text-foreground p-4 items-center justify-center">
                <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                    <h1 className="text-2xl font-bold">Dispositivo bajo Control Remoto</h1>
                    <p className="text-muted-foreground">
                        Esperando comandos desde el dispositivo de control... <br/>
                        Código de sesión: <span className="font-mono text-primary">{remoteSessionId}</span>
                    </p>
                    <Button variant="outline" onClick={handleStopView}>
                        <X className="mr-2 h-4 w-4" /> Detener Control
                    </Button>
                </div>
            </div>
        );
    }
    if (numCameras === 0) {
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
         <Dialog open={codePopupOpen} onOpenChange={setCodePopupOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Código de Control Remoto</DialogTitle>
                    <DialogDescription>
                        Introduce este código en el dispositivo que quieres usar como control.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center">
                    <div className="p-4 bg-muted rounded-lg">
                        <p className="text-4xl font-bold tracking-widest text-primary">
                            {remoteSessionId || <Loader2 className="h-10 w-10 animate-spin mx-auto" />}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
        {modifyEvent && (
             <Dialog open={modifyEventDialogOpen} onOpenChange={(open) => { if (!open) { setModifyEvent(null); setModifyEventDialogOpen(false); } else { setModifyEventDialogOpen(true); } }}>
                <EventSelectionDialog
                    isOpen={modifyEventDialogOpen}
                    onOpenChange={(open) => { if (!open) { setModifyEvent(null); setModifyEventDialogOpen(false); } else { setModifyEventDialogOpen(true); } }}
                    event={modifyEvent.event}
                    onSelect={handleModifyEventSelect}
                    isModification={true}
                    onRemove={() => handleEventRemove(modifyEvent.index)}
                    isLoading={isOptionsLoading}
                    setIsLoading={setIsOptionsLoading}
                    setEventForDialog={(event) => setModifyEvent(prev => prev ? {...prev, event} : null)}
                />
            </Dialog>
        )}
        <AddEventsDialog 
            open={addEventsDialogOpen}
            onOpenChange={(open) => {
              if (!open) {
                setAddEventsDialogOpen(false);
                if (dialogContext === 'schedule') {
                  setScheduleManagerOpen(true);
                }
              } else {
                setDialogContext(isAddEventsLoading ? 'schedule' : 'view');
                setAddEventsDialogOpen(true);
              }
            }}
            onSelect={handleSelectForCurrentDialog}
            selectedEvents={dialogContext === 'schedule' ? futureSelection : selectedEvents}
            allEvents={events} 
            allChannels={channels}
            onFetchEvents={() => fetchEvents(true, true)}
            updateAllEvents={setEvents}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
        />
        <ScheduleManager 
          open={scheduleManagerOpen}
          onOpenChange={setScheduleManagerOpen}
          currentSelection={futureSelection}
          currentOrder={futureOrder}
          schedules={schedules}
          onSchedulesChange={setSchedules}
          onModifyEventInView={openDialogForModification}
          isLoading={isAddEventsLoading}
          onAddEvent={() => {
            setDialogContext('schedule');
            setAddEventsDialogOpen(true);
          }}
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
                      <DialogDescription className="text-yellow-500/80">
                         Algunos canales pueden tardar mas en cargar que otros, hasta no ver un mensaje de error, NO CAMBIAR DE CANAL.
                      </DialogDescription>
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
                                    <li><strong>Categorías:</strong> Un carrusel horizontal que te permite filtrar el contenido. Puedes deslizarte para ver categorías como "En Vivo", "Fútbol", etc. Al hacer clic en una, la página mostrará solo el contenido de esa categoría.</li>
                                    <li><strong>Carruseles de Eventos/Canales:</strong> (En vista de escritorio) El contenido está agrupado en filas por estado: "En Vivo", "Próximos", "Canales 24/7", etc. Puedes deslizar cada carrusel para explorar los eventos.</li>
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
                                    <p><span className="font-semibold text-foreground">El Problema:</span> Muchos proveedores de internet (ISP) bloquean el acceso a ciertos dominios o servidores de video a través de su DNS. Esto provoca que el video nunca cargue y veas una pantalla en negro o un error de conexión.</p>
                                    <p><span className="font-semibold text-foreground">La Solución:</span> Cambiar el DNS de tu dispositivo o router a uno público como el de Cloudflare (<a href="https://one.one.one.one" target="_blank" rel="noopener noreferrer" className="text-primary underline">1.1.1.1</a>) o Google (8.8.8.8) puede saltarse estas restricciones.</p>
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
                isViewPage={true}
                gridGap={gridGap}
                onGridGapChange={setGridGap}
                borderColor={borderColor}
                onBorderColorChange={setBorderColor}
                isChatEnabled={isChatEnabled}
                onIsChatEnabledChange={setIsChatEnabled}
                onAddEvent={() => {
                  setDialogContext('view');
                  setAddEventsDialogOpen(true);
                }}
                onSchedule={() => setScheduleManagerOpen(true)}
                onNotification={() => setNotificationManagerOpen(true)}
                remoteSessionId={remoteSessionId}
                remoteControlMode={remoteControlMode}
                onStartControlledSession={handleActivateControlledMode}
                mutedStates={mutedStates}
                onToggleMute={handleToggleMute}
            />

            {fullscreenIndex !== null && (
              <Button
                size="icon"
                variant="ghost"
                className="bg-transparent hover:bg-accent/80 text-white h-10 w-10"
                onClick={handleMinimizeFromView}
                aria-label="Minimizar"
              >
                <Minimize className="h-5 w-5" />
              </Button>
            )}

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
                {viewOrder.map((originalIndex) => {
                    const event = selectedEvents[originalIndex];
                    if (!event) return null;

                    const isFullscreen = fullscreenIndex === originalIndex;
                    
                    if (fullscreenIndex !== null && !isFullscreen) {
                        return (
                            <div key={`window-stable-${originalIndex}`} className="hidden">
                                <iframe
                                    ref={el => (iframeRefs.current[originalIndex] = el)}
                                    src={`${event.selectedOption}${event.selectedOption && event.selectedOption.includes('?') ? '&' : '?'}reload=${reloadCounters[originalIndex] || 0}`}
                                    title={`Stream ${originalIndex + 1}`}
                                    className="w-full h-full border-0"
                                    loading="eager"
                                    allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                                    allowFullScreen
                                    muted={mutedStates[originalIndex]}
                                />
                            </div>
                        );
                    }
                    
                    let iframeSrc = event.selectedOption
                        ? `${event.selectedOption}${event.selectedOption.includes('?') ? '&amp;' : '?'}reload=${reloadCounters[originalIndex] || 0}`
                        : '';
                    
                    if (iframeSrc.includes("youtube-nocookie.com")) {
                        iframeSrc += `&amp;autoplay=1`;
                    }
                    
                    return (
                        <div 
                           key={`window-stable-${originalIndex}`} 
                           className={cn(
                                "overflow-hidden bg-black relative",
                                isFullscreen && 'absolute inset-0 z-20'
                            )}
                           style={{
                             order: originalIndex
                           }}
                        >
                           <iframe
                                ref={el => (iframeRefs.current[originalIndex] = el)}
                                src={iframeSrc}
                                title={`Stream ${originalIndex + 1}`}
                                className="w-full h-full border-0"
                                loading="eager"
                                allow="autoplay; encrypted-media; fullscreen; picture-in-picture; web-share"
                                allowFullScreen
                                {...(mutedStates[originalIndex] && { muted: true })}
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


  // --- HOME VIEW (DEFAULT) ---
  const renderContent = () => {
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
                            key={`mobile-event-${index}`}
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
                        <EventCarousel title="Canales" channels={channels} onChannelClick={handleChannelClick} getEventSelection={getEventSelection} />
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
      itemsToDisplay = channels;
    } else {
      itemsToDisplay = categoryFilteredEvents;
    }

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 md:gap-6 pt-4">
          {itemsToDisplay.map((item, index) => {
              const isChannel = 'urls' in item;
              if (isChannel) {
                const channelAsEvent: Event = { title: (item as Channel).name, time: 'AHORA', category: 'Canal', options: [], sources: [], buttons: [], language: '', date: '', source: '', status: 'En Vivo', image: (item as Channel).logo };
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
                      key={`search-event-${index}`}
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
    <div className="flex h-screen w-screen flex-col bg-background text-foreground">
       {isDataLoading && !isInitialLoadDone && (
        <div className="absolute inset-0 z-50 bg-background flex items-center justify-center">
            <LoadingScreen />
        </div>
       )}
        <div className={cn("flex h-full w-full flex-col", isDataLoading && !isInitialLoadDone ? "invisible" : "")}>
            <header className="sticky top-0 z-30 flex h-header-height w-full shrink-0 items-center border-b border-border bg-background/80 backdrop-blur-sm px-4">
                <div className={cn("flex items-center gap-2", isSearchOpen && 'hidden sm:flex')}>
                    {currentView === 'home' ? (
                        <>
                            <Sheet open={sideMenuOpen} onOpenChange={setSideMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:rounded-none -ml-2">
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
                                                        <p>¡Bienvenido a <strong>Deportes para Todos</strong>! Esta guía detallada te enseñará a usar la plataforma como un experto para que no te pierdas ni un segundo de tus eventos deportivos favoritos.</p>
                                                        
                                                        <h3 className="font-bold text-foreground mt-6">1. Entendiendo la Pantalla Principal</h3>
                                                        <p>La página de inicio es tu centro de comando. Aquí encontrarás todo el contenido organizado para un acceso rápido y sencillo.</p>
                                                        <ul className="list-disc pl-5 space-y-2">
                                                            <li><strong>Barra Superior:</strong> Aquí se encuentra el logo, la barra de búsqueda (icono de lupa) y los botones de configuración y de inicio de transmisión.</li>
                                                            <li><strong>Categorías:</strong> Un carrusel horizontal que te permite filtrar el contenido. Puedes deslizarte para ver categorías como "En Vivo", "Fútbol", "Baloncesto", etc. Al hacer clic en una, la página mostrará solo el contenido de esa categoría.</li>
                                                            <li><strong>Carruseles de Eventos/Canales:</strong> El contenido está agrupado en filas por estado o tipo. Puedes deslizar cada carrusel para explorar los eventos. El orden es: Canales, En Vivo, Próximos, Canales 24/7, y más.</li>
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
                                                        <h3 className="font-bold text-foreground mt-6">5. Menú de Ayuda y Contacto</h3>
                                                        <p>En la esquina superior izquierda, el icono de menú (<Menu className="inline-block h-4 w-4" />) abre un panel con recursos importantes:</p>
                                                        <ul className="list-disc pl-5 space-y-2">
                                                            <li><strong>Aviso Legal:</strong> Información sobre los términos de uso del servicio.</li>
                                                            <li><strong>Errores y Soluciones:</strong> ¡Muy recomendado! Una guía detallada para resolver problemas comunes de reproducción, como pantallas negras o errores de carga.</li>
                                                            <li><strong>Contacto:</strong> Un enlace para enviarnos un correo con sugerencias, reportes de errores o enlaces caídos.</li>
                                                        </ul>

                                                        <p className="font-bold text-foreground mt-6">¡Explora, combina y disfruta de todos tus deportes favoritos en un solo lugar y al mismo tiempo!</p>
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
                                        <Button variant="outline" className="w-full justify-start gap-2" onClick={() => { setNotificationManagerOpen(true); setSideMenuOpen(false); }}>
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
                                </SheetContent>
                            </Sheet>
                             <Link href="/" className="shrink-0" onClick={handleBackToHome}>
                                <Image
                                    src="https://i.ibb.co/gZKpR4fc/deportes-para-todos.png"
                                    alt="Deportes Para Todos Logo"
                                    width={150}
                                    height={37.5}
                                    priority
                                    data-ai-hint="logo"
                                    className='w-auto h-auto max-h-[40px] max-w-[150px]'
                                />
                            </Link>
                        </>
                    ) : (
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
                                <RemoteControlDialog 
                                  remoteSessionId={remoteSessionId}
                                  setRemoteControlMode={setRemoteControlMode}
                                  onStartControlling={(code) => {
                                      setRemoteSessionId(code);
                                      setRemoteControlMode('controlling');
                                  }}
                                  onActivateControlledMode={handleActivateControlledMode}
                                  isViewMode={isViewMode}
                                />

                                <Dialog open={configDialogOpen} onOpenChange={setConfigDialogOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="ghost" size="icon">
                                            <Settings />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-h-[90vh] flex flex-col p-0">
                                        <DialogHeader className="p-6 pb-4 text-center flex-shrink-0">
                                          <DialogTitle>Configuración y Eventos</DialogTitle>
                                          <DialogDescription>
                                              Personaliza la vista y gestiona tus eventos seleccionados.
                                          </DialogDescription>
                                        </DialogHeader>
                                        <ScrollArea className="flex-grow h-0 px-6 pb-6">
                                           <LayoutConfigurator
                                                gridGap={gridGap}
                                                onGridGapChange={setGridGap}
                                                borderColor={borderColor}
                                                onBorderColorChange={setBorderColor}
                                                isChatEnabled={isChatEnabled}
                                                onIsChatEnabledChange={setIsChatEnabled}
                                                order={viewOrder.filter(i => selectedEvents[i] !== null)}
                                                onOrderChange={handleOrderChange}
                                                eventDetails={selectedEvents}
                                                onRemove={handleEventRemove} 
                                                onModify={openDialogForModification}
                                                isViewPage={false}
                                            />
                                        </ScrollArea>
                                    </DialogContent>
                                </Dialog>

                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => fetchEvents(true)}
                                  disabled={isDataLoading}
                                  aria-label="Refrescar eventos"
                                >
                                  <RotateCw className={cn(isDataLoading && "animate-spin")} />
                                </Button>

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
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-grow overflow-y-auto px-4 md:px-8 pb-8">
                {renderContent()}
            </main>
        </div>
        
        <NotificationManager
            open={notificationManagerOpen}
            onOpenChange={setNotificationManagerOpen}
            allCategories={categories}
        />
        
        {dialogEvent && (
            <EventSelectionDialog
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                event={dialogEvent}
                onSelect={handleEventSelect}
                isModification={isModification}
                onRemove={() => {
                  if(modificationIndex !== null) {
                    handleEventRemove(modificationIndex)
                  }
                  setDialogOpen(false)
                }}
                isLoading={isOptionsLoading}
                setIsLoading={setIsOptionsLoading}
                setEventForDialog={setDialogEvent}
            />
        )}

        {modifyEvent && (
            <EventSelectionDialog
                isOpen={modifyEventDialogOpen}
                onOpenChange={open => {
                    if (!open) {
                        setModifyEvent(null);
                        setModifyEventDialogOpen(false);
                         if (!isViewMode) {
                           setConfigDialogOpen(true);
                         }
                    } else {
                        setModifyEventDialogOpen(true);
                    }
                }}
                event={modifyEvent.event}
                onSelect={handleModifyEventSelect}
                isModification={true}
                onRemove={() => { 
                    if(modifyEvent){
                      handleEventRemove(modifyEvent.index)
                    } 
                    setModifyEventDialogOpen(false)
                }}
                isLoading={isOptionsLoading}
                setIsLoading={setIsOptionsLoading}
                setEventForDialog={event => setModifyEvent(prev => prev ? {...prev, event} : null)}
            />
        )}
        <AddEventsDialog 
            open={addEventsDialogOpen}
            onOpenChange={setAddEventsDialogOpen}
            onSelect={handleSelectForCurrentDialog}
            selectedEvents={selectedEvents}
            allEvents={events} 
            allChannels={channels}
            onFetchEvents={() => fetchEvents(true, true)}
            updateAllEvents={setEvents}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
        />
    </div>
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


export function AddEventsDialog({ open, onOpenChange, onSelect, selectedEvents, allEvents, allChannels, onFetchEvents, updateAllEvents, isFullScreen, setIsFullScreen }: { open: boolean, onOpenChange: (open: boolean) => void, onSelect: (event: Event, option: string) => void, selectedEvents: (Event|null)[], allEvents: Event[], allChannels: Channel[], onFetchEvents: () => Promise<void>, updateAllEvents: (events: Event[]) => void, isFullScreen: boolean, setIsFullScreen: (isFullScreen: boolean) => void }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddEventsLoading, setIsAddEventsLoading] = useState(false);
    
    const [subDialogOpen, setSubDialogOpen] = useState(false);
    const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
    const [isSubDialogLoading, setIsSubDialogLoading] = useState(false);
    const [isModification, setIsModification] = useState(false);
    const [modificationIndex, setModificationIndex] = useState<number | null>(null);

    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setIsFullScreen(false); // Reset fullscreen state on close
        }
    }, [open, setIsFullScreen]);

    const handleForceFetch = async () => {
        setIsAddEventsLoading(true);
        await onFetchEvents();
        setIsAddEventsLoading(false);
    };

    const getEventSelection = useCallback((eventTitle: string, eventTime: string) => {
        const selectionIndex = selectedEvents.findIndex(se => se?.title === eventTitle && se?.time === eventTime);
        if (selectionIndex !== -1 && selectedEvents[selectionIndex]) {
            return { isSelected: true, selectedOption: selectedEvents[selectionIndex]!.selectedOption };
        }
        return { isSelected: false, selectedOption: null };
    }, [selectedEvents]);


    const handleSubDialogSelect = (event: Event, option: string) => {
        onSelect(event, option);
        setSubDialogOpen(false);
    };
    
    const openSubDialogForEvent = async (event: Event) => {
        const selection = getEventSelection(event.title, event.time);
        let eventForDialog = {...event};
        if(selection.isSelected && selection.selectedOption){
            eventForDialog.selectedOption = selection.selectedOption;
        }

        setIsSubDialogLoading(true);
        setDialogEvent(eventForDialog); // Set event immediately to show dialog
        setSubDialogOpen(true);

        setIsModification(selection.isSelected);
        setModificationIndex(selection.isSelected ? selectedEvents.findIndex(se => se?.title === event.title) : selectedEvents.findIndex(e => e === null));
        
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

                const updatedEventForDialog = { ...eventForDialog, options: streamOptions };
                setDialogEvent(updatedEventForDialog);

                // Also update the main events array so we don't fetch again
                updateAllEvents(allEvents.map(e => e.title === updatedEventForDialog.title && e.time === updatedEventForDialog.time ? { ...e, options: streamOptions } : e));
            } catch (error) {
                console.error(`Failed to fetch streams for ${event.title}`);
                const updatedEventForDialog = { ...eventForDialog, options: [] };
                setDialogEvent(updatedEventForDialog);
            }
        }
        setIsSubDialogLoading(false);
    };

    const handleChannelClick = (channel: Channel) => {
        const event: Event = {
            title: channel.name,
            options: channel.urls,
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
        const selection = getEventSelection(event.title, event.time);
        if (selection.isSelected) {
            const selectedEvent = selectedEvents.find(se => se?.title === event.title);
            if (selectedEvent) {
                event.selectedOption = selectedEvent.selectedOption;
            }
        }
        openSubDialogForEvent(event);
    };

    const sortedAndFilteredEvents = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        
        const liveSortLogic = (a: Event, b: Event): number => a.title.localeCompare(b.title);
        
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
            if (!timeA && !timeB) return a.title.localeCompare(b.title);
            
            const isPastA = isBefore(timeA!, now);
            const isPastB = isBefore(timeB!, now);
            
            if (isPastA && !isPastB) return 1;
            if (!isPastA && isPastB) return -1;
            
            return timeA!.getTime() - timeB!.getTime();
        };

        const placeholderImage = 'https://i.ibb.co/dHPWxr8/depete.jpg';
        const filtered = allEvents.filter(e => e.title.toLowerCase().includes(lowercasedFilter));

        const liveCustom = filtered.filter(e => e.status === 'En Vivo' && e.image && e.image !== placeholderImage).sort(liveSortLogic);
        const liveDefault = filtered.filter(e => e.status === 'En Vivo' && (!e.image || e.image === placeholderImage)).sort(liveSortLogic);
        const upcoming = filtered.filter(e => e.status === 'Próximo').sort(upcomingSortLogic);
        const unknown = filtered.filter(e => e.status === 'Desconocido').sort(upcomingSortLogic);
        const finished = filtered.filter(e => e.status === 'Finalizado').sort((a,b) => b.time.localeCompare(a.time));

        return [...liveCustom, ...liveDefault, ...upcoming, ...unknown, ...finished];
    }, [searchTerm, allEvents]);


    const filteredChannels = useMemo(() => {
        const lowercasedFilter = searchTerm.toLowerCase();
        return allChannels.filter(c => c.name.toLowerCase().includes(lowercasedFilter));
    }, [searchTerm, allChannels]);

    return (
        <Dialog open={open} onOpenChange={isOpen => { onOpenChange(isOpen); }}>
            <DialogContent 
                hideClose={true}
                className={cn(
                    "flex flex-col p-4 transition-all duration-300",
                    isFullScreen 
                        ? "w-screen h-screen max-w-none rounded-none" 
                        : "h-[90vh] sm:max-w-4xl"
                )}
            >
                <DialogHeader className='flex-row items-center justify-between pb-0'>
                    <DialogTitle>Añadir Evento/Canal</DialogTitle>
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)}>
                            {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { onOpenChange(false); setIsFullScreen(false); }}>
                           <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>
                 
                <div className="relative flex-grow flex flex-col mt-2">
                    <Tabs defaultValue="eventos" className="flex-grow flex flex-col">
                        <div className="flex flex-col gap-2">
                            <div className="relative flex-grow mt-[5px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="text"
                                    placeholder="Buscar..."
                                    className="w-full pl-10 pr-20"
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                                <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleForceFetch} disabled={isAddEventsLoading}>
                                        <RotateCw className={cn("h-5 w-5", isAddEventsLoading && "animate-spin")} />
                                    </Button>
                                    {searchTerm && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8"
                                            onClick={() => setSearchTerm('')}
                                        >
                                            <X className="h-5 w-5" />
                                        </Button>
                                    )}
                                </div>
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
                                            key={`event-${event.title}-${index}`}
                                            event={event}
                                            selection={getEventSelection(event.title, event.time)}
                                            onClick={() => openSubDialogForEvent(event)}
                                            displayMode="checkmark"
                                        />
                                    ))}
                                </div>
                            </ScrollArea>
                        </TabsContent>

                        <TabsContent value="canales" className="flex-grow mt-4 h-0">
                            <ScrollArea className="h-full pr-4 -mr-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                    {filteredChannels.map((channel, index) => {
                                        const channelAsEvent: Event = { title: channel.name, options: [], sources: [], buttons: [], time: 'AHORA', category: 'Canal', language: '', date: '', source: '', status: 'En Vivo', image: channel.logo };
                                        const selection = getEventSelection(channelAsEvent.title, channelAsEvent.time);
                                        return (
                                            <Card 
                                                key={`search-channel-${channel.name}-${index}`}
                                                className="group cursor-pointer rounded-lg bg-card text-card-foreground overflow-hidden transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg border-border h-full w-full flex flex-col"
                                                onClick={() => handleChannelClick(channel)}
                                            >
                                                <div className="relative w-full aspect-video flex items-center justify-center p-2 bg-white h-[100px] flex-shrink-0">
                                                    <Image
                                                        src={channel.logo}
                                                        alt={`${channel.name} logo`}
                                                        width={120}
                                                        height={67.5}
                                                        className="object-contain max-h-full max-w-full"
                                                        onError={e => { e.currentTarget.src = 'https://i.ibb.co/dHPWxr8/depete.jpg'; }}
                                                    />
                                                    {selection.isSelected && (
                                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="hsl(142.1 76.2% 44.9%)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-check drop-shadow-lg"><path d="M20 6 9 17l-5-5"/></svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="p-3 bg-card flex-grow flex flex-col justify-center">
                                                    <h3 className="font-bold text-sm text-center line-clamp-2">{channel.name}</h3>
                                                </div>
                                            </Card>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    </Tabs>
                    {isAddEventsLoading && (
                        <div className="absolute inset-0 bg-background flex items-center justify-center z-10 rounded-lg">
                            <Loader2 className="h-10 w-10 animate-spin" />
                        </div>
                    )}
                </div>
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
                        isLoading={isSubDialogLoading}
                        setIsLoading={setIsSubDialogLoading}
                        setEventForDialog={setDialogEvent}
                    />
                </Dialog>
            )}
        </Dialog>
    );
}
    
    

    













    

    
