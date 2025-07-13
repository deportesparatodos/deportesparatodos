
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, ArrowUp, ArrowDown, RotateCw, Trash2, SlidersHorizontal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Event } from '@/components/event-carousel';
import { Separator } from './ui/separator';
import { LayoutConfigurator } from './layout-configurator';

interface CameraConfigurationProps {
  order: number[];
  onOrderChange: (newOrder: number[]) => void;
  eventDetails: (Event | null)[];
  onReload: (index: number) => void;
  onRemove: (index: number) => void;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
}

export function CameraConfigurationComponent({ 
  order, 
  onOrderChange, 
  eventDetails, 
  onReload, 
  onRemove,
  gridGap,
  onGridGapChange,
  borderColor,
  onBorderColorChange,
  isChatEnabled,
  onIsChatEnabledChange,
}: CameraConfigurationProps) {
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
      <SheetContent side="left">
        <SheetHeader>
          <SheetTitle>Configurar Vista</SheetTitle>
          <SheetDescription>
            Arrastra y suelta eventos para reordenarlos o usa los controles.
          </SheetDescription>
        </SheetHeader>
        <Separator className="my-4" />
        <LayoutConfigurator
            gridGap={gridGap}
            onGridGapChange={onGridGapChange}
            borderColor={borderColor}
            onBorderColorChange={onBorderColorChange}
            isChatEnabled={isChatEnabled}
            onIsChatEnabledChange={onIsChatEnabledChange}
        />
        <Separator className="my-4" />

        <ScrollArea className="h-[calc(100%-18rem)]">
          <div className="space-y-4 pr-4">
            {order.map((originalIndex, currentIndex) => {
              const event = eventDetails[originalIndex];
              if (!event) return null;

              return (
                <div key={originalIndex} className="flex items-center gap-3 p-2 rounded-md bg-secondary/50">
                   <div 
                      className="flex-shrink-0 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold"
                   >
                        {currentIndex + 1}
                    </div>
                    
                    <div className="flex-grow flex flex-col gap-2">
                        <p 
                          className="text-sm font-semibold break-words"
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
