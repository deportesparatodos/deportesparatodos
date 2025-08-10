

'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetTrigger } from "@/components/ui/sheet";
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
  isViewPage: boolean;
  onAddEvent: () => void;
  onSchedule: () => void;
  onNotification: () => void;
  remoteSessionId: string | null;
  remoteControlMode: 'inactive' | 'controlling' | 'controlled';
  onStartControlledSession: () => void;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  onRestoreGridSettings: () => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  onToggleMute: (index: number) => void;
}

export function CameraConfigurationComponent({ 
  order, 
  onOrderChange, 
  eventDetails, 
  onReload, 
  onRemove,
  onModify,
  isViewPage,
  onAddEvent,
  onSchedule,
  onNotification,
  remoteSessionId,
  remoteControlMode,
  onStartControlledSession,
  gridGap,
  onGridGapChange,
  borderColor,
  onBorderColorChange,
  onRestoreGridSettings,
  isChatEnabled,
  onIsChatEnabledChange,
  onToggleMute
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
        <SheetContent side="left" className="w-full sm:max-w-md flex flex-col p-0">
          <SheetHeader className="p-6 pb-0 text-center flex-shrink-0">
            <SheetTitle className="text-center break-words whitespace-pre-wrap">Configuración de la Vista</SheetTitle>
          </SheetHeader>
          <Separator className="my-4 flex-shrink-0" />
          <ScrollArea className="flex-grow h-0 px-6">
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
                  onStartControlledSession={onStartControlledSession}
                  gridGap={gridGap}
                  onGridGapChange={onGridGapChange}
                  borderColor={borderColor}
                  onBorderColorChange={onBorderColorChange}
                  onRestoreGridSettings={onRestoreGridSettings}
                  isChatEnabled={isChatEnabled}
                  onIsChatEnabledChange={onIsChatEnabledChange}
                  categories={[]}
                  onToggleMute={onToggleMute}
              />
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
