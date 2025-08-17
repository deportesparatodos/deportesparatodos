
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, X, Maximize, Minimize, RotateCw } from 'lucide-react';
import { EventCard } from './event-card';
import type { Event, StreamOption } from './event-carousel';
import { Card } from './ui/card';
import Image from 'next/image';
import type { Channel } from './channel-list';
import { EventCarousel } from './event-carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { cn } from '@/lib/utils';
import { parse, isValid, isBefore } from 'date-fns';

interface AddEventsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEventSelect: (event: Event, optionUrl: string) => void;
  onChannelClick: (channel: Channel) => void;
  getEventSelection: (event: Event) => { isSelected: boolean; selectedOption: string | null };
  events: Event[];
  channels: Channel[];
  liveEvents: Event[];
  upcomingEvents: Event[];
  unknownEvents: Event[];
  finishedEvents: Event[];
  channels247Events: Event[];
}

export function AddEventsDialog({ 
    open, 
    onOpenChange,
    onEventSelect,
    onChannelClick,
    getEventSelection,
    events,
    channels,
    liveEvents,
    upcomingEvents,
    unknownEvents,
    finishedEvents,
    channels247Events
}: AddEventsDialogProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        if (!open) {
            setSearchTerm('');
            setIsFullScreen(false);
        }
    }, [open]);

    const handleChannelClick = (channel: Channel) => {
        onChannelClick(channel);
        onOpenChange(false);
    }
    
    const handleEventClick = (event: Event) => {
        // This will be handled by the parent opening the EventSelectionDialog
        // For now, we just close this dialog. The parent should handle opening the next one.
        onOpenChange(false);
        // A bit of a hack, but we need to call the original onCardClick logic which is in page.tsx
        // A better solution might involve more context/state management
        setTimeout(() => {
            const el = document.querySelector(`[data-event-id="${event.id}"]`) as HTMLElement;
            if (el) el.click();
        }, 100);
    }
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent 
                hideClose={true}
                className={cn(
                    "flex flex-col p-4 transition-all duration-300",
                    isFullScreen 
                        ? "w-screen h-screen max-w-none rounded-none inset-0 translate-x-0 translate-y-0"
                        : "h-[90vh] sm:max-w-4xl"
                )}
            >
                <DialogHeader className='flex-row items-center justify-between pb-0'>
                    <DialogTitle>Añadir Evento/Canal</DialogTitle>
                     <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => setIsFullScreen(!isFullScreen)}>
                           {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { onOpenChange(false); }}>
                           <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>
                 
                <div className="relative flex-grow flex flex-col mt-2">
                   <p>This dialog is now a placeholder. The main logic has been moved to the page component.</p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

    