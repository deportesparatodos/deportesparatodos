
"use client";

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { WelcomeMessage } from '@/components/welcome-message';
import { CameraConfigurationComponent, type CameraStatus } from '@/components/camera-configuration';
import { cn } from "@/lib/utils";
import { channels } from '@/components/channel-list';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Menu, X, Settings, HelpCircle, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import type { Event } from '@/components/event-list';
import { fromZonedTime } from 'date-fns-tz';
import { addHours, isAfter } from 'date-fns';


const processUrlForView = (inputUrl: string): string => {
  if (!inputUrl || typeof inputUrl !== 'string') return inputUrl;

  try {
    // Handle standard YouTube watch URLs
    if (inputUrl.includes('youtube.com/watch')) {
      const url = new URL(inputUrl);
      const videoId = url.searchParams.get('v');
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
    // Handle youtu.be short URLs
    if (inputUrl.includes('youtu.be/')) {
      const url = new URL(inputUrl);
      const videoId = url.pathname.substring(1);
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }
  } catch (e) {
    // Not a valid URL, or some other parsing error. Fallback to original URL.
    return inputUrl;
  }
  
  // Return original URL if it's not a convertible YouTube URL
  return inputUrl;
};

const TUTORIAL_IMAGES = [
  "https://i.ibb.co/YBjHxj6Z/TUTORIAL-1.jpg",
  "https://i.ibb.co/N2hpR2Jy/TUTORIAL-2.jpg",
  "https://i.ibb.co/hJR6tmYj/TUTORIAL-3.jpg",
];


export default function HomePage() {
  const [numCameras, setNumCameras] = useState<number>(4);
  const [cameraUrls, setCameraUrls] = useState<string[]>(Array(4).fill(''));
  const [cameraStatuses, setCameraStatuses] = useState<CameraStatus[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState<boolean>(true);

  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [gridGap, setGridGap] = useState<number>(4);
  const [borderColor, setBorderColor] = useState<string>('#18181b');
  const [currentTutorialSlide, setCurrentTutorialSlide] = useState(0);


  const topBarColorClass = useMemo(() => {
    const activeStatuses = cameraStatuses.slice(0, numCameras);
    
    if (activeStatuses.includes('empty') || activeStatuses.includes('inactive') || activeStatuses.some((s, i) => s === 'unknown' && cameraUrls[i])) {
        return 'bg-red-500';
    }
    if (activeStatuses.length > 0 && activeStatuses.every(s => s === 'valid')) {
      return 'bg-green-500';
    }
    return 'bg-red-500';
  }, [cameraStatuses, numCameras, cameraUrls]);

  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  const processedAndSortedEvents = useMemo((): Event[] => {
    if (!events.length) return [];
    
    const now = currentTime;

    const getEventStatus = (event: Omit<Event, 'status'>): Event['status'] => {
      try {
        const eventStartBA = fromZonedTime(`${event.date}T${event.time}:00`, 'America/Argentina/Buenos_Aires');
        const eventEndBA = addHours(eventStartBA, 3);
        
        if (isAfter(now, eventEndBA)) return 'Finalizado';
        if (isAfter(now, eventStartBA)) return 'En Vivo';
        return 'Próximo';
      } catch (e) {
        console.error("Error processing event date:", e);
        return 'Próximo';
      }
    };
    
    const eventsWithStatus = events.map(e => ({
      ...e,
      status: getEventStatus(e),
    }));

    const statusOrder = { 'En Vivo': 1, 'Próximo': 2, 'Finalizado': 3 };

    eventsWithStatus.sort((a, b) => {
        if (a.status !== b.status) {
            return statusOrder[a.status] - statusOrder[b.status];
        }
        return a.time.localeCompare(b.time);
    });

    return eventsWithStatus;

  }, [events, currentTime]);


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

    const fetchEvents = async () => {
      setIsLoadingEvents(true);
      setEventsError(null);
      try {
        const response = await fetch('https://agenda-dpt.vercel.app/api/events');
        if (!response.ok) {
          throw new Error('No se pudieron cargar los eventos.');
        }
        const data = await response.json();
        setEvents(data);
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
    
    fetchStatuses();
    fetchEvents();
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const storedUrls = localStorage.getItem('cameraUrls');
    if (storedUrls) {
      const parsedUrls = JSON.parse(storedUrls);
      const newUrls = Array(4).fill('');
      parsedUrls.slice(0, 4).forEach((url: string, i: number) => {
        newUrls[i] = url;
      });
      setCameraUrls(newUrls);
    }
    const storedNumCameras = localStorage.getItem('numCameras');
    if (storedNumCameras) {
      setNumCameras(parseInt(storedNumCameras, 10));
    } else {
      setNumCameras(4);
    }
    const storedGap = localStorage.getItem('gridGap');
    if (storedGap) {
      setGridGap(parseInt(storedGap, 10));
    }
    const storedBorderColor = localStorage.getItem('borderColor');
    if (storedBorderColor) {
      setBorderColor(storedBorderColor);
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cameraUrls', JSON.stringify(cameraUrls));
      localStorage.setItem('numCameras', numCameras.toString());
    }
  }, [cameraUrls, numCameras, isMounted]);

  const handleGridGapChange = (value: number[]) => {
    const newGap = value[0];
    setGridGap(newGap);
    localStorage.setItem('gridGap', newGap.toString());
  };

  const handleBorderColorChange = (color: string) => {
    setBorderColor(color);
    localStorage.setItem('borderColor', color);
  };
  
  const handleRestoreDefaults = () => {
    const defaultGap = 0;
    const defaultColor = '#18181b'; 
    setGridGap(defaultGap);
    setBorderColor(defaultColor);
    localStorage.setItem('gridGap', defaultGap.toString());
    localStorage.setItem('borderColor', defaultColor);
  };

  const nextTutorialSlide = () => {
    setCurrentTutorialSlide((prev) => (prev === TUTORIAL_IMAGES.length - 1 ? 0 : prev + 1));
  };

  const prevTutorialSlide = () => {
    setCurrentTutorialSlide((prev) => (prev === 0 ? TUTORIAL_IMAGES.length - 1 : prev - 1));
  };

  const handleStartView = () => {
    const activeUrls = cameraUrls.slice(0, numCameras);
    const activeStatuses = cameraStatuses.slice(0, numCameras);
    const filledUrls = activeUrls.filter((u) => u && u.trim() !== "");
  
    setMessages([]); 
  
    const warningMessages: string[] = [];
    let emptyViewCount = 0;
    let unknownLinkCount = 0;
    let inactiveChannelCount = 0;
  
    activeUrls.forEach((url, i) => {
      if (!url || url.trim() === "") {
        emptyViewCount++;
      } else if (activeStatuses[i] === "inactive") {
        inactiveChannelCount++;
      } else if (activeStatuses[i] === "unknown") {
        unknownLinkCount++;
      }
    });
  
    if (emptyViewCount > 0) {
      const pluralS = emptyViewCount > 1 ? "s" : "";
      warningMessages.unshift(
        `Hay ${emptyViewCount} vista${pluralS} vacía${pluralS}. Si presionas "Iniciar Vista" se iniciará la vista solo con las ventanas que están llenas.`
      );
    }
  
    if (inactiveChannelCount > 0) {
      const pluralNoun = inactiveChannelCount > 1 ? 'canales' : 'canal';
      const pluralAdj = inactiveChannelCount > 1 ? 'inactivos' : 'inactivo';
      warningMessages.push(
        `Hay ${inactiveChannelCount} ${pluralNoun} ${pluralAdj}. Si presionas "Iniciar Vista" se iniciará la vista de todas formas (posibles fallos).`
      );
    }
  
    if (unknownLinkCount > 0) {
      const pluralS = unknownLinkCount > 1 ? "s" : "";
      warningMessages.push(
        `Hay ${unknownLinkCount} link${pluralS} desconocido${pluralS}. Si presionas "Iniciar Vista" se iniciará la vista de todas formas (posibles fallos).`
      );
    }
  
    if (warningMessages.length > 0 && !acknowledged) {
      setMessages(warningMessages);
      setAcknowledged(true);
      return;
    }
  
    if (filledUrls.length === 0) {
      setMessages([`Por favor, ingrese al menos una URL.`]);
      setAcknowledged(false);
      return;
    }
  
    setAcknowledged(false);
  
    const processedUrls = filledUrls.map(processUrlForView);
    const queryParams = new URLSearchParams();
    processedUrls.forEach((url) => queryParams.append("urls", encodeURIComponent(url)));
    queryParams.append("gap", gridGap.toString());
    queryParams.append("borderColor", encodeURIComponent(borderColor));
    router.push(`/view?${queryParams.toString()}`);
  };
  
  if (!isMounted) {
    return null; 
  }

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
        <div className="absolute top-4 left-4 z-20">
          <Sheet>
            <SheetTrigger asChild>
              <Button size="icon" className="bg-white text-background hover:bg-white/90">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent 
              side="left" 
              className="w-full sm:w-96 flex flex-col p-6 gap-4" 
            >
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="flex justify-center">
                 <Image
                  src="https://i.ibb.co/BVLhxp2k/deportes-para-todos.png"
                  alt="Deportes Para Todos Logo"
                  width={250}
                  height={62.5}
                  priority
                  data-ai-hint="logo"
                />
              </div>
              <Separator />

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="justify-start">
                    <Settings className="mr-2" />
                    Configuración
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configuración de la Vista</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 pt-4">
                    <div className="space-y-2">
                        <Label htmlFor="grid-gap-slider">Tamaño de Bordes ({gridGap}px)</Label>
                        <Slider
                            id="grid-gap-slider"
                            min={0}
                            max={32}
                            step={1}
                            value={[gridGap]}
                            onValueChange={handleGridGapChange}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="border-color-input">Color de Bordes</Label>
                        <div className="flex items-center gap-2">
                            <Input
                                id="border-color-input"
                                value={borderColor}
                                onChange={(e) => handleBorderColorChange(e.target.value)}
                                className="flex-grow"
                            />
                            <div
                                className="h-8 w-8 rounded-md border border-input"
                                style={{ backgroundColor: borderColor }}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Vista Previa</Label>
                        <div
                            className="grid h-48 grid-cols-2 grid-rows-2 rounded-md transition-all"
                            style={{
                                gap: `${gridGap}px`,
                                padding: `${gridGap}px`,
                                backgroundColor: borderColor,
                            }}
                        >
                            <div className="rounded-md bg-background" />
                            <div className="rounded-md bg-background" />
                            <div className="rounded-md bg-background" />
                            <div className="rounded-md bg-background" />
                        </div>
                    </div>
                  </div>
                  <DialogFooter className="pt-4">
                    <Button variant="outline" onClick={handleRestoreDefaults}>
                        Restaurar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                   <Button variant="outline" className="justify-start">
                     <HelpCircle className="mr-2" />
                     Tutorial
                   </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl">
                   <DialogHeader>
                      <DialogTitle>Tutorial de Uso</DialogTitle>
                   </DialogHeader>
                   <div className="relative mt-4">
                      <Image
                        src={TUTORIAL_IMAGES[currentTutorialSlide]}
                        alt={`Tutorial paso ${currentTutorialSlide + 1}`}
                        width={1200}
                        height={675}
                        className="rounded-md"
                        unoptimized
                      />
                      <Button onClick={prevTutorialSlide} size="icon" variant="secondary" className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8">
                        <ChevronLeft />
                      </Button>
                      <Button onClick={nextTutorialSlide} size="icon" variant="secondary" className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full h-8 w-8">
                        <ChevronRight />
                      </Button>
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                        {TUTORIAL_IMAGES.map((_, i) => (
                           <div key={i} className={cn(
                             "h-2 w-2 rounded-full transition-colors",
                             i === currentTutorialSlide ? 'bg-primary' : 'bg-muted'
                           )} />
                        ))}
                      </div>
                   </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="justify-start">
                      <FileText className="mr-2" />
                      Aviso Legal
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>Aviso Legal</DialogTitle>
                    </DialogHeader>
                    <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                      <p>
                          DEPORTES PARA TODOS es un proveedor de servicios de Internet que ofrece una plataforma que solo muestra enlaces a contenidos audiovisuales ubicados en servidores de terceros y provistos y/o transmitidos por terceros. Nadie puede responsabilizar a DEPORTES PARA TODOS de alojar contenido con copyright, ya que nosotros no alojamos ningún contenido con derechos de autor ni tampoco transmitimos ningún contenido audiovisual. Por favor: Averigüe bien en qué sitio web están realmente alojados sus archivos o contenido audiovisual antes de culpar a DEPORTES PARA TODOS de infringir derechos de autor.
                      </p>
                      <p>
                          Los enlaces que figuran en esta web han sido encontrados en diferentes webs de streaming online (ustream.tv, justin.tv, yukons.net, mips.tv, dinozap.tv, castalba.tv, sawlive.tv, entre otros...) y desconocemos si los mismos tienen contratos de cesión de derechos sobre estos partidos o eventos de pago para reproducirlos, alojarlos o permitir verlos. Todas las marcas aquí mencionadas y logos están registrados por sus legítimos propietarios y solamente se emplean en referencia a las mismas y con un fin de cita o comentario. No nos hacemos responsables del uso indebido que puedes hacer del contenido de nuestra página. Todo el contenido ha sido exclusivamente sacado de sitios públicos de Internet, por lo que este material es considerado de libre distribución. En ningún artículo legal se menciona la prohibición de material libre, por lo que esta página no infringe en ningún caso la ley. Si alguien tiene alguna duda o problema al respecto, no dude en ponerse en contacto con nosotros.
                      </p>
                      <p>
                          En ningún caso o circunstancia se podrá responsabilizar directa o indirectamente al propietario ni a los colaboradores de DEPORTES PARA TODOS del ilícito uso de la información contenida en rojadirectaenvivo.pl. Asimismo, tampoco se nos podrá responsabilizar directa o indirectamente del incorrecto uso o mala interpretación que se haga de la información y servicios incluidos. Igualmente, quedará fuera de nuestra responsabilidad el material al que usted pueda acceder desde nuestros enlaces.
                      </p>
                    </div>
                  </DialogContent>
              </Dialog>
            </SheetContent>
          </Sheet>
        </div>
        
        <div className="w-full flex-grow flex flex-col relative px-4">
          <div className={cn("h-2 w-full absolute top-0 left-0", topBarColorClass)} />
          <div className="flex-grow flex flex-col items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <WelcomeMessage />
              </div>
              <div className="w-full max-w-lg">
                <CameraConfigurationComponent
                  numCameras={numCameras}
                  setNumCameras={(num) => {
                    setNumCameras(num);
                    setMessages([]);
                    setAcknowledged(false);
                  }}
                  cameraUrls={cameraUrls}
                  setCameraUrls={setCameraUrls}
                  messages={messages}
                  setMessages={setMessages}
                  handleStartView={handleStartView}
                  channels={channels}
                  channelStatuses={channelStatuses}
                  setCameraStatuses={setCameraStatuses}
                  setAcknowledged={setAcknowledged}
                  isLoadingChannelStatuses={isLoadingStatuses}
                  events={processedAndSortedEvents}
                  isLoadingEvents={isLoadingEvents}
                  eventsError={eventsError}
                />
              </div>
          </div>
        </div>
    </div>
  );
}
