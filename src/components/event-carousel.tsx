
'use client';

import { useState, type FC } from 'react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EventCard } from './event-card';
import { Button } from './ui/button';
import { EventSelectionDialog } from './event-selection-dialog';


export interface Event {
  time: string;
  title: string;
  options: string[];
  buttons: string[];
  category: string;
  language: string;
  date: string;
  source: string;
  image?: string;
  status: 'Próximo' | 'En Vivo' | 'Finalizado' | 'Desconocido';
  selectedOption?: string;
}


interface EventCarouselProps {
  title: string;
  events: Event[];
  onSelect: (event: Event, optionUrl: string) => void;
  getEventSelection: (event: Event) => { isSelected: boolean; window: number | null };
  activeWindow: number;
  setActiveWindow: (window: number) => void;
  selectedEvents: (Event | null)[];
  onEventRemove: (windowIndex: number) => void;
}

export const EventCarousel: FC<EventCarouselProps> = ({ title, events, onSelect, getEventSelection, activeWindow, setActiveWindow, selectedEvents, onEventRemove }) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogEvent, setDialogEvent] = useState<Event | null>(null);
  const [isModification, setIsModification] = useState(false);
  const [modificationIndex, setModificationIndex] = useState<number | null>(null);

  if (events.length === 0) {
    return null;
  }

  const handleOpenDialog = (event: Event, isMod: boolean = false, modIndex: number | null = null) => {
    setDialogEvent(event);
    setIsModification(isMod);
    setModificationIndex(modIndex);
    setDialogOpen(true);
  };
  
  const handleSelectAndClose = (event: Event, optionUrl: string) => {
    const targetIndex = isModification ? modificationIndex! : activeWindow;
    const newSelectedEvents = [...selectedEvents];
    const eventWithSelection = { ...event, selectedOption: optionUrl };
    newSelectedEvents[targetIndex] = eventWithSelection;
    
    onSelect(event, optionUrl);
    setDialogOpen(false);
  };

  const handleRemoveAndClose = () => {
    if (modificationIndex !== null) {
      onEventRemove(modificationIndex);
    }
    setDialogOpen(false);
  }

  const isFinishedSection = title === 'Finalizados';

  const renderWindowSelectors = () => {
    if (isFinishedSection) {
      return (
        <div className="flex flex-wrap gap-2 mt-4">
            {selectedEvents.map((event, index) => {
                if (event) {
                    return (
                        <Button
                            key={index}
                            variant="outline"
                            className="rounded-full w-10 h-10 flex items-center justify-center bg-secondary hover:bg-primary hover:text-primary-foreground"
                            onClick={() => handleOpenDialog(event, true, index)}
                        >
                           {index + 1}
                        </Button>
                    )
                }
                return null;
            })}
        </div>
      );
    }
    
    return (
      <div className="flex flex-wrap gap-2 mt-4">
          {[...Array(9)].map((_, i) => (
              <Button
                  key={i}
                  onClick={() => setActiveWindow(i)}
                  variant={activeWindow === i ? 'default' : 'outline'}
                  className="w-10 h-10"
              >
                  {i + 1}
              </Button>
          ))}
      </div>
    );
  };

  return (
    <div className="w-full space-y-4">
        <div className="flex items-center justify-between">
             <h2 className="text-2xl font-bold">{title}</h2>
        </div>
        {!isFinishedSection && renderWindowSelectors()}
        <Carousel
            opts={{
            align: "start",
            dragFree: true,
            slidesToScroll: 'auto',
            }}
            className="w-full relative px-12"
        >
            <CarouselContent className="-ml-4 py-4">
            {events.map((event, index) => (
                <CarouselItem key={`${event.title}-${index}`} className="basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6 2xl:basis-1/7 pl-4">
                <EventCard 
                    event={event} 
                    selection={getEventSelection(event)}
                    onClick={() => handleOpenDialog(event)}
                />
                </CarouselItem>
            ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-0 top-1/2 -translate-y-1/2" />
            <CarouselNext className="absolute right-0 top-1/2 -translate-y-1/2" />
        </Carousel>
        {isFinishedSection && renderWindowSelectors()}

        {dialogEvent && (
            <EventSelectionDialog
                isOpen={dialogOpen}
                onOpenChange={setDialogOpen}
                event={dialogEvent}
                onSelect={handleSelectAndClose}
                isModification={isModification}
                onRemove={handleRemoveAndClose}
                windowNumber={isModification ? modificationIndex! + 1 : activeWindow + 1}
            />
        )}
    </div>
  );
};
