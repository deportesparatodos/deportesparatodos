
"use client";

import type { Dispatch, FC, SetStateAction } from 'react';
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { AlertTriangle, Tv, ArrowUp, ArrowDown, ChevronDown } from 'lucide-react';
import { cn } from "@/lib/utils";
import { ChannelListComponent, type Channel } from './channel-list';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EventListComponent, type Event } from './event-list';

export type CameraStatus = 'empty' | 'valid' | 'unknown' | 'inactive';

interface CameraConfigurationProps {
  numCameras: number;
  setNumCameras: (num: number) => void;
  cameraUrls: string[];
  setCameraUrls: Dispatch<SetStateAction<string[]>>;
  messages: string[];
  setMessages: Dispatch<SetStateAction<string[]>>;
  handleStartView: () => void;
  channels: Channel[];
  channelStatuses: Record<string, 'online' | 'offline'>;
  setCameraStatuses: Dispatch<SetStateAction<CameraStatus[]>>;
  setAcknowledged: Dispatch<SetStateAction<boolean>>;
  isLoadingChannelStatuses?: boolean;
  events: Event[];
  isLoadingEvents: boolean;
  eventsError: string | null;
}

export const CameraConfigurationComponent: FC<CameraConfigurationProps> = ({
  numCameras,
  setNumCameras,
  cameraUrls,
  setCameraUrls,
  messages,
  setMessages,
  handleStartView,
  channels,
  channelStatuses,
  setCameraStatuses,
  setAcknowledged,
  isLoadingChannelStatuses,
  events,
  isLoadingEvents,
  eventsError,
}) => {
  const [dialogOpenForIndex, setDialogOpenForIndex] = useState<number | null>(null);

  const getDisplayStatus = (url: string): { text: string; status: CameraStatus } => {
    if (!url || url.trim() === '') {
        return { text: "Elegir Canal…", status: 'empty' };
    }
    
    if (events && events.length > 0) {
      for (const event of events) {
        const optionIndex = event.options.indexOf(url);
        if (optionIndex > -1 && event.buttons[optionIndex]) {
          return { text: event.buttons[optionIndex].toUpperCase(), status: 'valid' };
        }
      }
    }

    if (url.includes('ksdjugfsddeports.fun')) {
      const getStreamNameFromUrl = (u: string): string | null => {
        try {
            const urlObject = new URL(u);
            if (urlObject.hostname.includes('ksdjugfsddeports.fun')) {
                const pathParts = urlObject.pathname.split('/');
                const htmlFile = pathParts[pathParts.length - 1];
                if (htmlFile && htmlFile.endsWith('.html')) {
                    return htmlFile.slice(0, -5);
                }
            }
        } catch (e) {
            let match = u.match(/embed\/([^/]+)\.html/);
            if (match && match[1]) return match[1];
        }
        return null;
      };
      const streamName = getStreamNameFromUrl(url);
      if (streamName) {
        return { text: streamName.toUpperCase(), status: 'valid' };
      }
      return { text: 'STREAM VÁLIDO', status: 'valid' };
    }

    const getStreamNameFromUrl = (u: string): string | null => {
        try {
            const urlObject = new URL(u);
            if (urlObject.hostname.includes('streamtpglobal.com')) {
                return urlObject.searchParams.get('stream');
            }
        } catch (e) {
            let match = u.match(/[?&]stream=([^&]+)/);
            if (match && match[1]) return match[1];
        }
        return null;
    };

    const streamName = getStreamNameFromUrl(url);

    if (streamName && channelStatuses && channelStatuses[streamName] === 'offline') {
        return { text: `CANAL INACTIVO (${streamName.toUpperCase()})`, status: 'inactive' };
    }

    const foundChannel = channels.find(channel => channel.url === url);
    if (foundChannel) {
        return { text: foundChannel.name.toUpperCase(), status: 'valid' };
    }

    if (streamName) {
        return { text: streamName.toUpperCase(), status: 'valid' };
    }

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
  }, [cameraUrls, numCameras, setCameraStatuses, channelStatuses, events]);


  const handleNumCamerasChange = (value: string) => {
    setNumCameras(parseInt(value, 10));
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...cameraUrls];
    newUrls[index] = value;
    setCameraUrls(newUrls);
    setMessages([]);
    setAcknowledged(false);
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
    setMessages([]);
    setAcknowledged(false);
  };

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    handleStartView();
  };
  
  const handleSelectChannel = (url: string) => {
    if (dialogOpenForIndex !== null) {
      handleUrlChange(dialogOpenForIndex, url);
      setDialogOpenForIndex(null); // Close dialog
    }
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
                  <SelectItem value="6">6 VENTANAS</SelectItem>
                  <SelectItem value="9">9 VENTANAS</SelectItem>
              </SelectContent>
          </Select>

          <div className="space-y-3">
          {Array.from({ length: numCameras }).map((_, index) => {
            const displayStatus = getDisplayStatus(cameraUrls[index] || '');

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
                
                <Dialog open={dialogOpenForIndex === index} onOpenChange={(isOpen) => setDialogOpenForIndex(isOpen ? index : null)}>
                  <DialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-grow justify-between overflow-hidden w-0"
                      aria-label={`Seleccionar entrada para Vista ${index + 1}`}
                    >
                      <span className={cn(
                        "truncate text-left",
                         {
                          'text-green-600 dark:text-green-400': displayStatus.status === 'valid',
                          'text-muted-foreground': displayStatus.status === 'empty',
                          'text-red-600 dark:text-red-500': displayStatus.status === 'inactive' || displayStatus.status === 'unknown'
                         }
                      )}>
                        {displayStatus.text}
                      </span>
                      <ChevronDown className="h-4 w-4 opacity-50 flex-shrink-0" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl h-[80vh] flex flex-col p-0">
                      <DialogHeader className="p-5 pb-0">
                          <DialogTitle>Seleccionar una entrada para la Vista {index + 1}</DialogTitle>
                      </DialogHeader>
                      <Tabs defaultValue="channels" className="w-full flex-grow flex flex-col overflow-hidden p-5 pt-2">
                          <TabsList className="grid w-full grid-cols-2">
                              <TabsTrigger value="channels">Canales</TabsTrigger>
                              <TabsTrigger value="events">Eventos</TabsTrigger>
                          </TabsList>
                          <TabsContent value="channels" className="flex-grow overflow-hidden mt-0 data-[state=inactive]:hidden pt-5">
                              <ChannelListComponent 
                                  channelStatuses={channelStatuses}
                                  isLoading={isLoadingChannelStatuses || false}
                                  onSelectChannel={handleSelectChannel}
                              />
                          </TabsContent>
                          <TabsContent value="events" className="flex-grow overflow-hidden mt-0 data-[state=inactive]:hidden pt-5">
                              <EventListComponent 
                                onSelectEvent={handleSelectChannel}
                                events={events}
                                isLoading={isLoadingEvents}
                                error={eventsError}
                              />
                          </TabsContent>
                      </Tabs>
                  </DialogContent>
                </Dialog>

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

          {messages && messages.length > 0 && (
            <div className="space-y-2">
              {messages.map((text, index) => (
                <div key={index} className={cn(
                  "flex items-center p-3 text-sm rounded-md border",
                  "bg-destructive/10 text-destructive border-destructive/30",
                )}>
                  <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
                  <p>{text}</p>
                </div>
              ))}
            </div>
          )}
        
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <Tv className="mr-2 h-4 w-4" /> Iniciar Vista
          </Button>
      </form>
    </>
  );
};
