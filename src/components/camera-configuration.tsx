
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { Separator } from './ui/separator';
import { LayoutConfigurator } from './layout-configurator';
import type { Event } from '@/components/event-carousel';

interface CameraConfigurationProps {
  order: number[];
  onOrderChange: (newOrder: number[]) => void;
  eventDetails: (Event | null)[];
  onReload: (index: number) => void;
  onRemove: (index: number) => void;
  onModify: (event: Event, index: number) => void;
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
  onModify,
  gridGap,
  onGridGapChange,
  borderColor,
  onBorderColorChange,
  isChatEnabled,
  onIsChatEnabledChange,
}: CameraConfigurationProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  
  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button size="icon" variant="ghost" className="bg-transparent hover:bg-accent/80 text-white h-10 w-10">
          <Settings className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>Configurar Vista</SheetTitle>
          <SheetDescription>
            Ajusta el diseño y gestiona los eventos activos.
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
            order={order}
            onOrderChange={onOrderChange}
            eventDetails={eventDetails}
            onReload={onReload}
            onRemove={onRemove}
            onModify={onModify}
            isViewPage={true}
        />
      </SheetContent>
    </Sheet>
  );
}
