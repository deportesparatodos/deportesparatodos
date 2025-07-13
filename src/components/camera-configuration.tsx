
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, ArrowUp, ArrowDown, RotateCw, Trash2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Event } from '@/components/event-carousel';

interface CameraConfigurationProps {
  order: number[];
  onOrderChange: (newOrder: number[]) => void;
  eventDetails: (Event | null)[];
  onReload: (index: number) => void;
  onRemove: (index: number) => void;
  onReplace: (index: number) => void;
}

export function CameraConfigurationComponent({ order, onOrderChange, eventDetails, onReload, onRemove, onReplace }: CameraConfigurationProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  const handleMove = (currentIndex: number, direction: 'up' | 'down') => {
    const newOrder = [...order];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex >= 0 && targetIndex < newOrder.length) {
      const itemToMove = newOrder.splice(currentIndex, 1)[0];
      newOrder.splice(targetIndex, 0, itemToMove);
      onOrderChange(newOrder);
    }
  };
  
  const activeEventsCount = order.length;

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="bg-transparent hover:bg-accent/80 text-white h-10 w-10">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Configurar Vista</SheetTitle>
        </SheetHeader>
        <ScrollArea className="h-[calc(100%-4rem)] mt-4">
          <div className="space-y-4 pr-4">
            {order.map((originalIndex, currentIndex) => {
              const event = eventDetails[originalIndex];
              if (!event) return null;

              return (
                <div key={originalIndex} className="flex items-start gap-3 p-2 rounded-md bg-secondary/50">
                   <div 
                      className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold"
                   >
                        {currentIndex + 1}
                    </div>
                    <div 
                      className="relative w-24 h-auto aspect-video rounded-md overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => onReplace(originalIndex)}
                    >
                        <Image
                          src={event.image || 'https://i.ibb.co/dHPWxr8/depete.jpg'}
                          alt={event.title}
                          width={160}
                          height={90}
                          className="object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = 'https://i.ibb.co/dHPWxr8/depete.jpg';
                          }}
                        />
                    </div>

                    <div className="flex-grow flex flex-col gap-2">
                        <p 
                          className="text-sm font-semibold break-words cursor-pointer"
                          onClick={() => onReplace(originalIndex)}
                        >
                          {event.title}
                        </p>
                        <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={() => handleMove(currentIndex, 'up')}
                              disabled={currentIndex === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7" 
                              onClick={() => handleMove(currentIndex, 'down')}
                              disabled={currentIndex === activeEventsCount - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7"
                              onClick={() => onReload(originalIndex)}
                            >
                                <RotateCw className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => onRemove(originalIndex)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>
              )
            })}
             {activeEventsCount === 0 && (
                <p className="text-muted-foreground text-center pt-8">No hay eventos para configurar.</p>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
