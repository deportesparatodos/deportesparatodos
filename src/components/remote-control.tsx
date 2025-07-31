
'use client';

import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Input } from './ui/input';
import { Loader2, Youtube, X, Airplay } from 'lucide-react';
import type { RemoteSession } from '@/app/api/remote/route';
import { useToast } from '@/hooks/use-toast';
import { LayoutConfigurator } from './layout-configurator';
import type { Event, StreamOption } from './event-carousel';
import type { Channel } from './channel-list';
import { AddEventsDialog } from '@/app/page';

// --- Main Dialog to start a remote session ---
export function RemoteControlDialog({ setRemoteControlMode, setRemoteSession }: {
  setRemoteControlMode: (mode: 'inactive' | 'controlling' | 'controlled') => void;
  setRemoteSession: (session: RemoteSession | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'main' | 'connect' | 'control'>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const handleCreateSession = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/remote', { method: 'POST' });
      if (response.ok) {
        const session: RemoteSession = await response.json();
        setRemoteSession(session);
        setRemoteControlMode('controlling');
        setIsOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to create remote session.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the server.' });
    }
    setIsLoading(false);
  };
  
  const handleConnectToSession = async () => {
    if (!code || code.length !== 4) {
        toast({ variant: 'destructive', title: 'Error', description: 'Please enter a valid 4-digit code.' });
        return;
    }
    setIsLoading(true);
     try {
      const response = await fetch(`/api/remote?id=${code}`);
      if (response.ok) {
        const session: RemoteSession = await response.json();
        setRemoteSession(session);
        setRemoteControlMode('controlled');
        setIsOpen(false);
      } else {
        toast({ variant: 'destructive', title: 'Error', description: 'Session code not found or has expired.' });
      }
    } catch (error) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to the server.' });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset view when dialog is closed
      setTimeout(() => setView('main'), 200);
      setCode('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (view === 'connect') {
      handleCreateSession();
    }
  }, [view]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Airplay />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Control Remoto</DialogTitle>
          <DialogDescription>
            Controla la aplicación desde otro dispositivo o permite que otro dispositivo te controle.
          </DialogDescription>
        </DialogHeader>
        {view === 'main' && (
          <div className="grid gap-4 py-4">
            <Button onClick={() => setView('connect')} size="lg" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar Control Remoto
            </Button>
            <Button onClick={() => setView('control')} variant="outline" size="lg">Controlar Otro Dispositivo</Button>
          </div>
        )}
        {view === 'control' && (
          <div className="grid gap-4 py-4">
            <Input 
                placeholder="Introduce el código de 4 dígitos" 
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={4}
                className="text-center text-2xl h-14 tracking-widest font-mono"
            />
            <Button onClick={handleConnectToSession} disabled={isLoading} size="lg">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Conectar
            </Button>
          </div>
        )}
        {(view === 'connect' || view === 'control') && (
            <DialogFooter>
                <Button variant="link" onClick={() => setView('main')}>Volver</Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}


// --- View for the "Controlling" device (e.g., phone) ---
export function RemoteControlView({ session, onStop, allEvents, allChannels, updateAllEvents }: {
  session: RemoteSession | null;
  onStop: () => void;
  allEvents: Event[];
  allChannels: Channel[];
  updateAllEvents: (events: Event[]) => void;
}) {
  const [remoteEvents, setRemoteEvents] = useState<(Event | null)[]>(session?.selectedEvents || Array(9).fill(null));
  const [remoteOrder, setRemoteOrder] = useState<number[]>(session?.viewOrder || Array.from({ length: 9 }, (_, i) => i));
  const [isUpdating, setIsUpdating] = useState(false);
  const [addEventsOpen, setAddEventsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Sync local state with polled session state from server
  useEffect(() => {
    if(session) {
      setRemoteEvents(session.selectedEvents);
      setRemoteOrder(session.viewOrder);
    }
  }, [session]);
  
  const updateRemoteState = async (newEvents: (Event|null)[], newOrder: number[]) => {
      if (!session?.id || isSubmitting) return;
      setIsSubmitting(true);
      try {
          const response = await fetch(`/api/remote?id=${session.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ selectedEvents: newEvents, viewOrder: newOrder }),
          });
          if (!response.ok) {
              toast({ variant: 'destructive', title: 'Error', description: 'Failed to update remote device.' });
          }
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not connect to server to update.' });
      } finally {
        setIsSubmitting(false);
      }
  };

  const handleRemove = (index: number) => {
    const newEvents = [...remoteEvents];
    newEvents[index] = null;
    setRemoteEvents(newEvents);
    const newOrder = remoteOrder.filter(i => newEvents[i] !== null);
    updateRemoteState(newEvents, newOrder);
  };
  
  const handleOrderChange = (newOrder: number[]) => {
    setRemoteOrder(newOrder);
    updateRemoteState(remoteEvents, newOrder);
  };
  
  const handleAddEvent = (event: Event, option: string) => {
    const newEvents = [...remoteEvents];
    const eventWithSelection = { ...event, selectedOption: option };
    const emptyIndex = newEvents.findIndex(e => e === null);
    if(emptyIndex !== -1) {
      newEvents[emptyIndex] = eventWithSelection;
      setRemoteEvents(newEvents);
      updateRemoteState(newEvents, remoteOrder);
    } else {
      toast({ title: "Info", description: "All 9 slots are full."});
    }
    setAddEventsOpen(false);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
       <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
            <div className='text-center'>
                <h1 className="text-lg font-bold">Control Remoto</h1>
                <p className="text-sm text-muted-foreground">Código de Sesión: <span className="font-mono text-primary">{session?.id}</span></p>
            </div>
            <Button variant="destructive" onClick={onStop}>
                <X className="mr-2 h-4 w-4" /> Terminar
            </Button>
        </header>
       <div className="flex-grow overflow-y-auto p-4">
          <LayoutConfigurator
              order={remoteOrder.filter(i => remoteEvents[i] !== null)}
              onOrderChange={handleOrderChange}
              eventDetails={remoteEvents}
              onRemove={handleRemove}
              onModify={() => toast({ title: "Info", description: "La modificación debe hacerse eliminando y volviendo a añadir el evento."})}
              isViewPage={true}
              onAddEvent={() => setAddEventsOpen(true)}
              onSchedule={() => toast({ title: "Info", description: "La programación no está disponible en modo control remoto."})}
              onNotificationManager={() => toast({ title: "Info", description: "Las notificaciones no están disponibles en modo control remoto."})}
              // Dummy props
              gridGap={0} onGridGapChange={() => {}}
              borderColor="#000" onBorderColorChange={() => {}}
              isChatEnabled={false} onIsChatEnabledChange={() => {}}
            />
       </div>
        <AddEventsDialog
            open={addEventsOpen}
            onOpenChange={setAddEventsOpen}
            onSelect={handleAddEvent}
            selectedEvents={remoteEvents}
            allEvents={allEvents}
            allChannels={allChannels}
            onFetchEvents={async () => {}} // No fetching in remote
            updateAllEvents={updateAllEvents}
            isFullScreen={isFullScreen}
            setIsFullScreen={setIsFullScreen}
        />
    </div>
  );
}


// --- View for the "Controlled" device (e.g., computer) ---
export function ControlledDeviceView({ onStop, session }: { onStop: () => void; session: RemoteSession | null }) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <div className='space-y-2'>
            <h1 className="text-2xl font-bold">Dispositivo bajo Control Remoto</h1>
            <p className="text-muted-foreground">
                Esta ventana ahora está siendo controlada por otro dispositivo. <br/>
                Código de sesión: <span className="font-mono text-primary">{session?.id}</span>
            </p>
        </div>
        <Button variant="outline" onClick={onStop}>
            <X className="mr-2 h-4 w-4" /> Detener Control
        </Button>
    </div>
  );
}
