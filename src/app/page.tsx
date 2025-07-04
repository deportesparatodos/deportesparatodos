
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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";


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
  const [cameraUrls, setCameraUrls] = useState<string[]>(Array(9).fill(''));
  const [cameraStatuses, setCameraStatuses] = useState<CameraStatus[]>([]);
  const [messages, setMessages] = useState<string[]>([]);
  const [acknowledged, setAcknowledged] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const [channelStatuses, setChannelStatuses] = useState<Record<string, 'online' | 'offline'>>({});
  const [isLoadingStatuses, setIsLoadingStatuses] = useState<boolean>(true);

  const [events, setEvents] = useState<Omit<Event, 'status'>[]>([]);
  const [processedEvents, setProcessedEvents] = useState<Event[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

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
    setCurrentTime(new Date());
    const timer = setInterval(() => {
        setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!events.length || !currentTime) {
      setProcessedEvents([]);
      return;
    }
    
    const now = currentTime;

    const getEventStatus = (event: Omit<Event, 'status'>): Event['status'] => {
      try {
        const eventStartBA = fromZonedTime(`${event.date}T${event.time}:00`, 'America/Argentina/Buenos_Aires');
        const eventEndBA = addHours(eventStartBA, 3);
        
        if (isAfter(now, eventEndBA)) return 'Finalizado';
        if (isAfter(now, eventStartBA)) return 'En Vivo';
        return 'Próximo';
      } catch (e) {
        console.error("Error processing event date:", event, e);
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

    setProcessedEvents(eventsWithStatus);

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
      const newUrls = Array(9).fill('');
      parsedUrls.slice(0, 9).forEach((url: string, i: number) => {
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
      localStorage.setItem('gridGap', gridGap.toString());
      localStorage.setItem('borderColor', borderColor);
    }
  }, [cameraUrls, numCameras, gridGap, borderColor, isMounted]);


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

  const nextTutorialSlide = () => {
    setCurrentTutorialSlide((prev) => (prev === TUTORIAL_IMAGES.length - 1 ? 0 : prev + 1));
  };

  const prevTutorialSlide = () => {
    setCurrentTutorialSlide((prev) => (prev === 0 ? TUTORIAL_IMAGES.length - 1 : prev - 1));
  };

  const handleStartView = () => {
    const activeUrlInputs = cameraUrls.slice(0, numCameras);
    const activeStatuses = cameraStatuses.slice(0, numCameras);
  
    setMessages([]);
  
    const warningMessages: string[] = [];
    let emptyViewCount = 0;
    let unknownLinkCount = 0;
    let inactiveChannelCount = 0;
  
    activeUrlInputs.forEach((url, i) => {
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
    
    const activeUrls = activeUrlInputs.filter(url => url && url.trim() !== "");

    if (activeUrls.length === 0) {
        setMessages([`Por favor, ingrese al menos una URL.`]);
        setAcknowledged(false);
        return;
    }

    setAcknowledged(false);
    
    const processedUrls = activeUrls.map(processUrlForView);
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
                <DialogContent className="max-w-lg">
                  <DialogHeader className="border-b pb-3">
                    <DialogTitle>Configuración de la Vista:</DialogTitle>
                  </DialogHeader>
                  <Accordion type="single" collapsible className="w-full -mt-4">
                    <AccordionItem value="item-1">
                      <AccordionTrigger>Bordes</AccordionTrigger>
                      <AccordionContent>
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
                                  className="grid h-48 grid-cols-2 grid-rows-2 rounded-md transition-all border border-black"
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
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
                    <div className="mt-4 flex flex-col items-center gap-4">
                      <div className="flex w-full items-center justify-center gap-4">
                        <Button onClick={prevTutorialSlide} size="icon" variant="secondary" className="rounded-full h-8 w-8 flex-shrink-0">
                            <ChevronLeft />
                        </Button>
                        <div className="border rounded-md overflow-hidden">
                            <Image
                                src={TUTORIAL_IMAGES[currentTutorialSlide]}
                                alt={`Tutorial paso ${currentTutorialSlide + 1}`}
                                width={1200}
                                height={675}
                                unoptimized
                            />
                        </div>
                        <Button onClick={nextTutorialSlide} size="icon" variant="secondary" className="rounded-full h-8 w-8 flex-shrink-0">
                            <ChevronRight />
                        </Button>
                      </div>
                      <div className="flex gap-2">
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
                      <DialogTitle>Descargo de Responsabilidad – Derechos de Autor</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4 text-sm text-muted-foreground">
                    <p>
                        Deportes para Todos es una plataforma que actúa únicamente como agregador de enlaces embebidos provenientes de terceros. No alojamos, retransmitimos ni manipulamos directamente ninguna señal de audio o video. Todos los contenidos audiovisuales visibles en este sitio están incrustados mediante iframes públicos desde plataformas externas como streamtp3.com, la12hd.com, YouTube, Twitch, OK.ru, entre otras.
                    </p>
                    <p>
                        No participamos en la creación, alteración ni distribución de dichas señales, y no somos responsables de la legalidad de los contenidos a los que se accede a través de estos terceros. Cualquier infracción potencial corresponde a dichos proveedores externos.
                    </p>

                    <h4 className="font-semibold text-foreground">Sobre la legalidad y responsabilidad de terceros:</h4>
                    <p>
                        Existen antecedentes de sitios sancionados por alojar y retransmitir directamente contenido con derechos de autor. En contraste, Deportes para Todos no aloja señales ni transmite contenido, y se limita exclusivamente a insertar enlaces públicos de terceros mediante código iframe. No participamos en la obtención ni distribución del contenido audiovisual y no tenemos control sobre su disponibilidad o legalidad.
                    </p>

                    <h4 className="font-semibold text-foreground">Uso de marcas y logos:</h4>
                    <p>
                        Todas las marcas, nombres comerciales, logotipos o imágenes presentes en el sitio son propiedad de sus respectivos dueños. En Deportes para Todos se utilizan exclusivamente con fines informativos o ilustrativos, respetando el derecho de cita previsto por el Artículo 32 de la Ley 11.723 de Propiedad Intelectual de Argentina.
                    </p>

                    <h4 className="font-semibold text-foreground">Legislación aplicable:</h4>
                    <p>
                        Este sitio opera bajo las leyes de la República Argentina. El mero hecho de insertar un iframe público no configura, por sí solo, un delito conforme al derecho argentino, siempre que no se participe en la obtención o manipulación del contenido protegido.
                    </p>
                    
                    <h4 className="font-semibold text-foreground">Uso personal y responsabilidad del usuario:</h4>
                    <p>
                        El acceso a esta página se realiza bajo responsabilidad del usuario. Si en tu país este tipo de contenido se encuentra restringido, es tu obligación cumplir con las leyes locales. No nos responsabilizamos por el uso indebido o ilegal de los enlaces por parte de los visitantes.
                    </p>

                    <h4 className="font-semibold text-foreground">Sobre el uso de subdominios:</h4>
                    <p>
                        Deportes para Todos utiliza subdominios como https://www.google.com/search?q=gh.deportesparatodos.com con fines exclusivamente organizativos y técnicos, para centralizar y facilitar el acceso a iframes de terceros. Estos subdominios no almacenan, manipulan ni retransmiten contenido audiovisual, sino que actúan como una ventana hacia los streams originales disponibles públicamente en sitios como streamtp3.com, la12hd.com y otros. En ningún caso se modifica la fuente original ni se interviene en el contenido emitido por dichos terceros.
                    </p>

                    <h4 className="font-semibold text-foreground">Sobre la experiencia del usuario:</h4>
                    <p>
                        Deportes para Todos puede aplicar medidas para mejorar la experiencia de navegación, como la reducción de anuncios emergentes o contenido intrusivo de terceros. Estas medidas no interfieren con el contenido audiovisual transmitido dentro de los reproductores embebidos, ni modifican las señales originales. Cualquier bloqueo se limita a elementos externos ajenos a la emisión en sí.
                    </p>

                    <h4 className="font-semibold text-foreground">Monetización, publicidad y patrocinadores</h4>
                    <p>
                        Deportes para Todos puede exhibir anuncios publicitarios proporcionados por plataformas de monetización de terceros (como Monetag) y/o incluir contenido patrocinado de empresas vinculadas al sector iGaming (casas de apuestas, juegos online y plataformas similares).
                    </p>
                    <p>
                        Estos ingresos publicitarios permiten el mantenimiento del sitio, pero no están directamente vinculados al contenido embebido ni implican relación comercial con las plataformas desde las cuales se obtiene dicho contenido.
                    </p>
                    <p>
                        Deportes para Todos no gestiona ni opera plataformas de apuestas, ni aloja contenido audiovisual, y no obtiene beneficios económicos derivados de la transmisión de señales protegidas. Toda la monetización se genera por el tráfico general del sitio, independientemente del contenido de terceros que se pueda visualizar mediante iframes.
                    </p>
                    <p>
                        Los contenidos promocionados, ya sea por publicidad programática o acuerdos de patrocinio, se presentan conforme a la legislación vigente y no representan un respaldo o relación directa con los titulares de los derechos de las transmisiones que pudieran visualizarse mediante terceros.
                    </p>
                    <p>
                        Nos reservamos el derecho de incluir o remover campañas publicitarias en cualquier momento, y recomendamos a los usuarios consultar la política de privacidad de cada plataforma externa a la que accedan desde este sitio.
                    </p>

                    <h4 className="font-semibold text-foreground">Relación con los dueños del contenido:</h4>
                    <p>
                        Deportes para Todos no tiene relación alguna con los titulares de los derechos de las transmisiones embebidas, ni con las plataformas que los alojan. Todo el contenido audiovisual visualizado mediante iframes es responsabilidad exclusiva del sitio externo que lo provee.
                    </p>

                    <h4 className="font-semibold text-foreground">Mecanismos de seguridad:</h4>
                    <p>
                        No se utilizan mecanismos técnicos para eludir bloqueos, restricciones regionales (geobloqueos) ni sistemas de autenticación de las plataformas externas.
                    </p>

                    <h4 className="font-semibold text-foreground">Cookies y datos del usuario:</h4>
                    <p>
                        Este sitio puede utilizar cookies de terceros para ofrecer una mejor experiencia de usuario, realizar estadísticas anónimas de uso o mostrar anuncios relevantes. Al navegar por Deportes para Todos usted acepta este uso de cookies. Recomendamos consultar las políticas de privacidad de los servicios externos vinculados a este sitio.
                    </p>
                    <p>
                        El contenido patrocinado relacionado con plataformas de iGaming está destinado únicamente a usuarios mayores de 18 años. Deportes para Todos no se responsabiliza por el acceso a dichas plataformas por parte de menores de edad.
                    </p>
                    <p>
                        This Site is affiliated with Monumetric (dba for The Blogger Network, LLC) for the purposes of placing advertising on the Site, and Monumetric will collect and use certain data for advertising purposes. To learn more about Monumetric’s data usage, click here: Publisher Advertising Privacy
                    </p>

                    <h4 className="font-semibold text-foreground">Notificaciones de derechos de autor:</h4>
                    <p>
                        Si usted es titular de derechos o su representante y considera que un contenido embebido desde una fuente externa infringe sus derechos, puede enviarnos una notificación formal mandando un mail a deportesparatodosvercel@gmail.com. Aunque no estamos sujetos a la legislación DMCA de EE.UU., colaboramos voluntariamente con cualquier requerimiento legítimo bajo dicho marco.
                    </p>
                    <p>
                        Por favor incluya en su notificación:
                    </p>
                    <ul className="list-disc pl-6 space-y-1">
                        <li>(a) Su firma (física o digital) como titular o representante autorizado.</li>
                        <li>(b) Identificación clara del contenido presuntamente infringido.</li>
                        <li>(c) Enlace directo al contenido incrustado en Deportes para Todos.</li>
                        <li>(d) Datos de contacto válidos (correo electrónico).</li>
                        <li>(e) Una declaración de buena fe indicando que el uso no está autorizado por usted, su agente o la ley.</li>
                        <li>(f) Una declaración de veracidad de la información, bajo pena de perjurio.</li>
                    </ul>
                    <p>
                        Una vez recibida y analizada la notificación, procederemos a desactivar el enlace correspondiente si así corresponde. También podremos notificar al proveedor del iframe, si fuera posible.
                    </p>
                    <p>
                        Al utilizar este sitio web, usted declara haber leído, comprendido y aceptado este descargo de responsabilidad en su totalidad.
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
                  events={processedEvents}
                  isLoadingEvents={isLoadingEvents}
                  eventsError={eventsError}
                />
              </div>
          </div>
        </div>
    </div>
  );
}
