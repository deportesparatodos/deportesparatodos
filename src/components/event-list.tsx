
"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, Loader2, AlertTriangle } from 'lucide-react';
import { channels as allChannels, type Channel } from '@/components/channel-list';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Event {
  time: string;
  competition: string;
  team1: string;
  team2: string;
  team1_logo: string;
  team2_logo: string;
  channels: string[];
  channels_logo: string[];
}

interface CopiedStates {
  [key: string]: boolean;
}

const logoToChannelMap = new Map<string, Channel>();
allChannels.forEach(c => {
    if (c.logoUrl) {
        if (!logoToChannelMap.has(c.logoUrl)) {
            logoToChannelMap.set(c.logoUrl, c);
        }
    }
});

export const EventListComponent: FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('https://corsproxy.io/?https%3A%2F%2Fagenda-dpt.vercel.app%2Fapi%2Fevents');
        if (!response.ok) {
          throw new Error('No se pudieron cargar los eventos.');
        }
        const data: Event[] = await response.json();
        setEvents(data);
      } catch (err) {
        if (err instanceof Error) {
            setError(err.message);
        } else {
            setError('Ocurrió un error inesperado.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleCopy = async (url: string, eventIndex: number, channelIndex: number) => {
    const key = `${eventIndex}-${channelIndex}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 1500);
    } catch (err) {
      console.error("Error al copiar: ", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-destructive p-4 text-center">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p>{error}</p>
        <p className="text-sm text-muted-foreground">Inténtalo de nuevo más tarde.</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No hay eventos disponibles.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-card text-card-foreground p-4 overflow-y-auto">
      <TooltipProvider delayDuration={300}>
        <div className="space-y-4">
          {events.map((event, eventIndex) => (
            <Card key={eventIndex} className="bg-muted/50">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-muted-foreground truncate mr-2">{event.competition}</p>
                  <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md flex-shrink-0">{event.time}</p>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="flex items-center justify-around text-center mb-4">
                  <div className="flex flex-col items-center gap-2 w-2/5">
                    {event.team1_logo && <Image src={event.team1_logo} alt={`${event.team1} logo`} width={40} height={40} className="object-contain h-10" unoptimized />}
                    <span className="font-semibold text-foreground text-sm leading-tight">{event.team1}</span>
                  </div>
                  <span className="text-2xl font-bold text-muted-foreground">VS</span>
                  <div className="flex flex-col items-center gap-2 w-2/5">
                    {event.team2_logo && <Image src={event.team2_logo} alt={`${event.team2} logo`} width={40} height={40} className="object-contain h-10" unoptimized />}
                    <span className="font-semibold text-foreground text-sm leading-tight">{event.team2}</span>
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Canales</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.channels_logo.map((logoUrl, channelIndex) => {
                      const channel = logoToChannelMap.get(logoUrl);
                      const key = `${eventIndex}-${channelIndex}`;
                      const isCopied = copiedStates[key];
                      const channelNameFromApi = event.channels[channelIndex];

                      return (
                        <Tooltip key={channelIndex}>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              className={cn(
                                "h-10 w-10 p-1.5 border-2 transition-all duration-200",
                                isCopied ? "border-green-500 bg-green-500/10" : "bg-background",
                                !channel && "opacity-50 cursor-not-allowed"
                              )}
                              onClick={() => channel && handleCopy(channel.url, eventIndex, channelIndex)}
                              disabled={!channel}
                            >
                              {isCopied ? (
                                <CheckCircle2 className="h-full w-full text-green-500" />
                              ) : (
                                <Image
                                  src={logoUrl}
                                  alt={`${channelNameFromApi} logo`}
                                  width={24}
                                  height={24}
                                  className="object-contain w-full h-full"
                                  unoptimized
                                />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{channel ? (isCopied ? "¡Copiado!" : `Copiar para ${channel.name}`) : `${channelNameFromApi} (No encontrado)`}</p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TooltipProvider>
    </div>
  );
};
