"use client";

import type { Dispatch, FC, SetStateAction } from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Tv, ArrowUp, ArrowDown, X, ClipboardPaste } from 'lucide-react';
import { cn } from "@/lib/utils";
import type { Channel } from './channel-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export type CameraStatus = 'empty' | 'valid' | 'unknown';

interface CameraConfigurationProps {
  numCameras: number;
  setNumCameras: (num: number) => void;
  cameraUrls: string[];
  setCameraUrls: Dispatch<SetStateAction<string[]>>;
  message: { type: 'error' | 'warning'; text: string } | null;
  setMessage: Dispatch<SetStateAction<{ type: 'error' | 'warning'; text: string } | null>>;
  handleStartView: () => void;
  channels: Channel[];
  setCameraStatuses: Dispatch<SetStateAction<CameraStatus[]>>;
  setUserAcknowledgedWarning: Dispatch<SetStateAction<boolean>>;
}

export const CameraConfigurationComponent: FC<CameraConfigurationProps> = ({
  numCameras,
  setNumCameras,
  cameraUrls,
  setCameraUrls,
  message,
  setMessage,
  handleStartView,
  channels,
  setCameraStatuses,
  setUserAcknowledgedWarning,
}) => {
  const [focusedInput, setFocusedInput] = useState<number | null>(null);
  const [hoveredInputIndex, setHoveredInputIndex] = useState<number | null>(null);

  const getDisplayStatus = (url: string): { text: string; status: CameraStatus } => {
    if (!url || url.trim() === '') {
      return { text: "VACIO", status: 'empty' };
    }

    const foundChannel = channels.find(channel => channel.url === url);
    if (foundChannel) {
      return { text: foundChannel.name.toUpperCase(), status: 'valid' };
    }
    
    try {
      const urlObject = new URL(url);
      const streamParam = urlObject.searchParams.get('stream');
      if (streamParam) {
        return { text: streamParam.toUpperCase(), status: 'valid' };
      }
    } catch (e) {
      // Not a valid URL, try regex match for stream param
      const match = url.match(/[?&]stream=([^&]+)/);
      if (match && match[1]) {
          return { text: match[1].toUpperCase(), status: 'valid' };
      }
    }
    
    // Check if it's a known non-streamtpglobal but valid URL (like YouTube)
    if (url.includes('youtube.com/embed/')) {
        return { text: "YOUTUBE", status: 'valid' };
    }

    return { text: "DESCONOCIDO", status: 'unknown' };
  };

  useEffect(() => {
    const statuses = Array.from({ length: numCameras }).map((_, index) => {
        return getDisplayStatus(cameraUrls[index] || '').status;
    });
    setCameraStatuses(statuses);
  }, [cameraUrls, numCameras, setCameraStatuses]);


  const handleNumCamerasChange = (value: string) => {
    setNumCameras(parseInt(value, 10));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...cameraUrls];
    newUrls[index] = value;
    setCameraUrls(newUrls);
    setMessage(null);
    setUserAcknowledgedWarning(false);
  };

  const handleClearUrl = (index: number) => {
    const newUrls = [...cameraUrls];
    newUrls[index] = '';
    setCameraUrls(newUrls);
    setMessage(null);
    setUserAcknowledgedWarning(false);
  };

  const handleMoveUrl = (index: number, direction: 'up' | 'down') => {
    const newUrls = [...cameraUrls];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= numCameras) {
      return;
    }

    for (let i = 0; i < numCameras; i++) {
        if (newUrls[i] === undefined) newUrls[i] = '';
    }

    [newUrls[index], newUrls[targetIndex]] = [newUrls[targetIndex], newUrls[index]];
    setCameraUrls(newUrls);
    setMessage(null);
    setUserAcknowledgedWarning(false);
  };

  const handlePasteUrl = async (index: number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        handleUrlChange(index, text);
      }
    } catch (err) {
      console.error("Error al pegar desde el portapapeles: ", err);
      setMessage({ type: 'error', text: "No se pudo pegar. Verifica los permisos del portapapeles."});
    }
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleStartView();
  };

  return (
    <>
      <form onSubmit={handleFormSubmit} className="w-full space-y-4">
          <Select onValueChange={handleNumCamerasChange} value={numCameras.toString()}>
              <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar cantidad de ventanas" />
              </SelectTrigger>
              <SelectContent>
                  <SelectItem value="1">1 VENTANA</SelectItem>
                  <SelectItem value="2">2 VENTANAS</SelectItem>
                  <SelectItem value="3">3 VENTANAS</SelectItem>
                  <SelectItem value="4">4 VENTANAS</SelectItem>
              </SelectContent>
          </Select>

          <div className="space-y-3">
          {Array.from({ length: numCameras }).map((_, index) => {
            const displayStatus = getDisplayStatus(cameraUrls[index] || '');
            const isFocused = focusedInput === index;
            const isHovered = hoveredInputIndex === index;
            const isActive = isFocused || isHovered;

            return (
              <div key={index} className="flex items-center space-x-2">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleMoveUrl(index, 'up')}
                    disabled={index === 0}
                    aria-label="Mover URL hacia arriba"
                    className="bg-background hover:bg-accent/50"
                    type="button" 
                >
                    <ArrowUp className="h-4 w-4" />
                </Button>
                
                <div
                  className="relative flex-grow"
                  onMouseEnter={() => setHoveredInputIndex(index)}
                  onMouseLeave={() => setHoveredInputIndex(null)}
                >
                  <Input
                    id={`url-${index}`}
                    type="url"
                    placeholder={isActive && displayStatus.status === 'empty' ? `URL Vista ${index + 1}` : ""}
                    value={cameraUrls[index] || ''}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    onFocus={() => setFocusedInput(index)}
                    onBlur={() => setFocusedInput(null)}
                    className={cn(
                      "w-full",
                      displayStatus.status === 'valid' && "bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 focus:ring-green-500 dark:focus:ring-green-600",
                      displayStatus.status === 'empty' && "bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 focus:ring-red-500 dark:focus:ring-red-600",
                      displayStatus.status === 'unknown' && "bg-yellow-100 dark:bg-yellow-900/30 border-yellow-400 dark:border-yellow-700 focus:ring-yellow-500 dark:focus:ring-yellow-600",
                      isActive
                        ? {
                            'valid': "text-green-800 dark:text-green-300",
                            'empty': "text-red-800 dark:text-red-300 placeholder-red-500 dark:placeholder-red-400/80",
                            'unknown': "text-yellow-800 dark:text-yellow-300 placeholder-yellow-500 dark:placeholder-yellow-400/80",
                          }[displayStatus.status]
                        : "text-transparent placeholder-transparent selection:text-transparent selection:bg-transparent caret-transparent"
                    )}
                    readOnly={!isActive && displayStatus.status !== 'empty'}
                  />
                  {!isActive && (
                    <div
                      className={cn(
                        "absolute inset-0 flex items-center justify-center px-3 py-2 text-sm rounded-md pointer-events-none select-none",
                        {
                          'valid': "bg-green-600 text-white",
                          'empty': "bg-destructive text-destructive-foreground",
                          'unknown': "bg-yellow-500 text-black",
                        }[displayStatus.status]
                      )}
                    >
                      {displayStatus.text}
                    </div>
                  )}
                </div>

                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePasteUrl(index)}
                    aria-label="Pegar URL desde portapapeles"
                    className="bg-background hover:bg-accent/50"
                    type="button"
                >
                    <ClipboardPaste className="h-4 w-4" />
                </Button>
                {cameraUrls[index] && (
                  <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleClearUrl(index)}
                      aria-label="Limpiar URL"
                      className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
                      type="button"
                  >
                      <X className="h-4 w-4" />
                  </Button>
                )}
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleMoveUrl(index, 'down')}
                    disabled={index === numCameras - 1}
                    aria-label="Mover URL hacia abajo"
                    className="bg-background hover:bg-accent/50"
                    type="button"
                >
                    <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            )
          })}
          </div>

          {message && (
            <div className={cn(
              "flex items-center p-3 text-sm rounded-md border",
              message.type === 'error' && "bg-destructive/10 text-destructive border-destructive/30",
              message.type === 'warning' && "bg-yellow-500/10 text-yellow-600 border-yellow-500/30"
            )}>
              <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
              <p>{message.text}</p>
            </div>
          )}
        
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Tv className="mr-2 h-4 w-4" /> Iniciar Vista
          </Button>
      </form>
      <div className="text-center mt-4">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="link" className="text-sm text-muted-foreground hover:text-foreground px-1 py-0 h-auto">Aviso Legal</Button>
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
      </div>
    </>
  );
};
