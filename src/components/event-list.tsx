
"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, Loader2, AlertTriangle, Tv, Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface Event {
  time: string;
  title: string;
  options: string[];
  buttons: string[];
  category: string;
  language: string;
  date: string;
  source: string;
  status: string;
}

interface CopiedStates {
  [key: string]: boolean;
}

interface EventListComponentProps {
  onSelectEvent?: (url: string) => void;
}

export const EventListComponent: FC<EventListComponentProps> = ({ onSelectEvent }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});
  const [searchTerm, setSearchTerm] = useState('');
  const isSelectMode = !!onSelectEvent;

  useEffect(() => {
    const fetchEvents = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('https://agenda-dpt.vercel.app/api/events');
        if (!response.ok) {
          throw new Error('No se pudieron cargar los eventos.');
        }
        const data: Event[] = await response.json();
        const sortedData = data.sort((a, b) => a.time.localeCompare(b.time));
        setEvents(sortedData);
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

  const handleAction = async (url: string, key: string) => {
    if (isSelectMode && onSelectEvent) {
      onSelectEvent(url);
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setCopiedStates(prev => ({ ...prev, [key]: true }));
        setTimeout(() => {
          setCopiedStates(prev => ({ ...prev, [key]: false }));
        }, 1500);
      } catch (err) {
        console.error("Error al copiar: ", err);
      }
    }
  };
  
  const filteredEvents = events.filter(event =>
    event.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  return (
    <div className="h-full w-full bg-card text-card-foreground flex flex-col">
      <div className="px-4 py-5 flex-shrink-0 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar evento por título..."
            className="h-9 w-full pl-10 pr-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => setSearchTerm('')}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="flex-grow p-4 overflow-y-auto">
        <TooltipProvider delayDuration={300}>
          {filteredEvents.length > 0 ? (
            <div className="space-y-4">
              {filteredEvents.map((event, eventIndex) => (
                <Card key={eventIndex} className="bg-muted/50">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-center gap-4">
                      <p className="font-semibold text-foreground text-sm leading-tight flex-grow">{event.title}</p>
                      <p className="text-sm font-semibold text-primary px-2 py-1 bg-background rounded-md flex-shrink-0">{event.time}</p>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 pt-2">
                     <h4 className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Canales</h4>
                     <div className="flex flex-wrap gap-2">
                        {event.options.map((url, channelIndex) => {
                          const key = `${eventIndex}-${channelIndex}`;
                          const isCopied = copiedStates[key];
                          const buttonLabel = event.buttons[channelIndex] || 'Canal';
                          
                          const actionLabel = isSelectMode ? 'Seleccionar' : (isCopied ? '¡Copiado!' : 'Copiar');
                          const Icon = isSelectMode ? Tv : (isCopied ? CheckCircle2 : Copy);
    
                          return (
                            <Tooltip key={key}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={cn(
                                    "transition-all duration-200",
                                    !isSelectMode && isCopied && "border-green-500 bg-green-500/10 text-green-600 hover:text-green-600"
                                  )}
                                  onClick={() => handleAction(url, key)}
                                >
                                  <Icon className="mr-2 h-4 w-4" />
                                  {isSelectMode ? "Seleccionar" : (isCopied ? '¡Copiado!' : 'Copiar')}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{actionLabel} {buttonLabel}</p>
                              </TooltipContent>
                            </Tooltip>
                          );
                        })}
                      </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
             <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground text-center">
                    {searchTerm ? `No se encontraron eventos para "${searchTerm}".` : "No hay eventos disponibles."}
                </p>
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
};
