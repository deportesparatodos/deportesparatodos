

'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings, X } from 'lucide-react';
import { LayoutConfigurator } from './layout-configurator';
import type { Event } from '@/components/event-carousel';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';

interface CameraConfigurationProps {
  order: number[];
  onOrderChange: (newOrder: number[]) => void;
  eventDetails: (Event | null)[];
  onReload: (index: number) => void;
  onRemove: (index: number) => void;
  onModify: (event: Event, index: number) => void;
  onToggleFullscreen: (index: number) => void;
  fullscreenIndex: number | null;
  isViewPage: boolean;
  onAddEvent: () => void;
  onSchedule: () => void;
  onNotification: () => void;
  remoteSessionId: string | null;
  remoteControlMode: 'inactive' | 'controlling' | 'controlled';
  onActivateControlledMode: () => void;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  onRestoreGridSettings: () => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  categories: string[];
  onOpenTutorial: () => void;
  onOpenErrors: () => void;
  onOpenCalendar: () => void;
}

export function CameraConfigurationComponent({ 
  order, 
  onOrderChange, 
  eventDetails, 
  onReload, 
  onRemove,
  onModify,
  onToggleFullscreen,
  fullscreenIndex,
  isViewPage,
  onAddEvent,
  onSchedule,
  onNotification,
  remoteSessionId,
  remoteControlMode,
  onActivateControlledMode,
  gridGap,
  onGridGapChange,
  borderColor,
  onBorderColorChange,
  onRestoreGridSettings,
  isChatEnabled,
  onIsChatEnabledChange,
  categories,
  onOpenTutorial,
  onOpenErrors,
  onOpenCalendar,
}: CameraConfigurationProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="ghost" className="bg-transparent hover:bg-accent/80 text-white h-10 w-10">
            <Settings className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0" hideClose={true}>
          <SheetHeader className="p-4 border-b flex-row justify-center items-center relative">
            <SheetTitle className="text-center flex-grow">Configuración</SheetTitle>
            <SheetClose asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 absolute right-2 top-1/2 -translate-y-1/2">
                    <X className="h-5 w-5" />
                </Button>
            </SheetClose>
          </SheetHeader>
          <ScrollArea className="flex-grow h-0">
              <div className='p-6 pt-4'>
                <LayoutConfigurator
                    order={order}
                    onOrderChange={onOrderChange}
                    eventDetails={eventDetails}
                    onReload={onReload}
                    onRemove={onRemove}
                    onModify={onModify}
                    isViewPage={isViewPage}
                    onAddEvent={onAddEvent}
                    onSchedule={onSchedule}
                    onNotificationManager={onNotification}
                    remoteSessionId={remoteSessionId}
                    remoteControlMode={remoteControlMode}
                    onActivateControlledMode={onActivateControlledMode}
                    onToggleFullscreen={onToggleFullscreen}
                    fullscreenIndex={fullscreenIndex}
                    gridGap={gridGap}
                    onGridGapChange={onGridGapChange}
                    borderColor={borderColor}
                    onBorderColorChange={onBorderColorChange}
                    onRestoreGridSettings={onRestoreGridSettings}
                    isChatEnabled={isChatEnabled}
                    onIsChatEnabledChange={onIsChatEnabledChange}
                    categories={categories}
                    onOpenTutorial={onOpenTutorial}
                    onOpenErrors={onOpenErrors}
                    onOpenCalendar={onOpenCalendar}
                />
              </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
