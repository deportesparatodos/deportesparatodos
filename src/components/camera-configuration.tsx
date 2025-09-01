

'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  onModify: (index: number) => void;
  onToggleFullscreen: (index: number) => void;
  fullscreenIndex: number | null;
  isViewPage: boolean;
  onAddEvent: () => void;
  onSchedule?: () => void;
  onNotificationManager?: () => void;
  gridGap: number;
  onGridGapChange: (value: number) => void;
  borderColor: string;
  onBorderColorChange: (value: string) => void;
  onRestoreGridSettings: () => void;
  isChatEnabled: boolean;
  onIsChatEnabledChange: (value: boolean) => void;
  onOpenTutorial?: () => void;
  onOpenErrors?: () => void;
  onOpenCalendar?: () => void;
  onOpenPresets?: () => void;
  onOpenContact?: () => void;
  onOpenLegalNotice?: () => void;
  remoteControlMode: 'inactive' | 'controlled' | 'controlling';
  controlledSessionCode: string;
  onActivateRemoteControl: () => void;
  onClearSelections: () => void;
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
          <SheetHeader className="sr-only">
              <SheetTitle>Configuration Panel</SheetTitle>
          </SheetHeader>
          <LayoutConfigurator {...props} />
        </SheetContent>
      </Sheet>
    </>
  );
}
