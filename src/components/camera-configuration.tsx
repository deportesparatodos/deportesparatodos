
'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Settings } from 'lucide-react';
import { LayoutConfigurator } from './layout-configurator';
import type { Event } from '@/components/event-carousel';

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
  isTutorialOpen: boolean;
  onIsTutorialOpenChange: (open: boolean) => void;
  isErrorsOpen: boolean;
  onIsErrorsOpenChange: (open: boolean) => void;
}

export function CameraConfigurationComponent(props: CameraConfigurationProps) {
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
          <LayoutConfigurator {...props} onNotificationManager={props.onNotification} />
        </SheetContent>
      </Sheet>
    </>
  );
}
