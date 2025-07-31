
'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { Loader2, X, Airplay } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import type { Channel } from './channel-list';
import { useToast } from '@/hooks/use-toast';
import { LayoutConfigurator } from './layout-configurator';
import { AddEventsDialog } from '@/app/page';
import Ably from 'ably';

// --- Main Dialog to start a remote session ---
export function RemoteControlDialog({
  setRemoteControlMode,
  setRemoteSessionId,
}: {
  setRemoteControlMode: (mode: 'inactive' | 'controlling' | 'controlled') => void;
  setRemoteSessionId: (id: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'main' | 'connect' | 'control'>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const { toast } = useToast();

  const handleCreateSession = useCallback(async () => {
    setIsLoading(true);
    // Generate a simple 4-digit code on the client
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(newCode);
    setIsLoading(false);
  }, []);

  const handleConnectToSession = () => {
    if (!code || code.length !== 4) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Por favor, introduce un código de 4 dígitos válido.',
      });
      return;
    }
    setIsLoading(true);
    setRemoteSessionId(code);
    setRemoteControlMode('controlled');
    setIsOpen(false);
    setIsLoading(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('main');
        setCode('');
        setGeneratedCode('');
        setIsLoading(false);
      }, 200);
    }
  }, [isOpen]);
  
  useEffect(() => {
    if (view === 'connect' && isOpen && !generatedCode) {
      handleCreateSession();
    }
  }, [view, isOpen, generatedCode, handleCreateSession]);

  const startControlling = () => {
    setRemoteControlMode('controlling');
    setRemoteSessionId(generatedCode);
    setIsOpen(false);
  }

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
            <Button onClick={() => setView('connect')} size="lg">
              Conectar Control Remoto
            </Button>
            <Button onClick={() => setView('control')} variant="outline" size="lg">
              Controlar Otro Dispositivo
            </Button>
          </div>
        )}
        
        {view === 'connect' && (
          <div className="grid gap-4 py-4 text-center">
             <DialogDescription>
                Introduce este código en el dispositivo que quieres controlar:
            </DialogDescription>
            <div className="p-4 bg-muted rounded-lg">
                <p className="text-4xl font-bold tracking-widest text-primary">
                    {isLoading ? <Loader2 className="h-10 w-10 animate-spin mx-auto" /> : generatedCode}
                </p>
            </div>
            <Button onClick={startControlling} size="lg">
                Empezar a Controlar
            </Button>
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

        {view !== 'main' && (
          <DialogFooter>
            <Button variant="link" onClick={() => setView('main')}>
              Volver
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// --- View for the "Controlling" device (e.g., phone) ---
export function RemoteControlView({
  onStop,
  allEvents,
  allChannels,
  updateAllEvents,
}: {
  onStop: () => void;
  allEvents: Event[];
  allChannels: Channel[];
  updateAllEvents: (events: Event[]) => void;
}) {
    const [ablyClient, setAblyClient] = useState<Ably.Realtime | null>(null);
    const [ablyChannel, setAblyChannel] = useState<Ably.Types.RealtimeChannelPromise | null>(null);
    const [sessionId, setSessionId] = useState<string | null>(null)
    const [remoteEvents, setRemoteEvents] = useState<(Event | null)[]>(Array(9).fill(null));
    const [remoteOrder, setRemoteOrder] = useState<number[]>(Array.from({ length: 9 }, (_, i) => i));
    const [addEventsOpen, setAddEventsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const { toast } = useToast();

    // Initialize Ably client and channel for the controlling device
    useEffect(() => {
        const clientId = `controller-${Math.random().toString(36).substr(2, 9)}`;
        const client = new Ably.Realtime({ authUrl: `/api/ably?clientId=${clientId}` });
        setAblyClient(client);

        client.connection.on('connected', () => {
            const code = Math.floor(1000 + Math.random() * 9000).toString();
            setSessionId(code);
            const channel = client.channels.get(`remote-control:${code}`);
            setAblyChannel(channel);
        });
        
        return () => { client.close(); };
    }, []);

    const updateRemoteState = useCallback((newEvents: (Event | null)[], newOrder: number[]) => {
        if (ablyChannel) {
            ablyChannel.publish('control-update', {
                action: 'updateState',
                payload: {
                    selectedEvents: newEvents,
                    viewOrder: newOrder,
                },
            });
        }
    }, [ablyChannel]);

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
        if (emptyIndex !== -1) {
            newEvents[emptyIndex] = eventWithSelection;
            setRemoteEvents(newEvents);
            updateRemoteState(newEvents, remoteOrder);
        } else {
            toast({ title: 'Info', description: 'All 9 slots are full.' });
        }
        setAddEventsOpen(false);
    };

    if (!sessionId) {
        return (
            <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="mt-4 text-muted-foreground">Generando código de sesión...</p>
            </div>
        )
    }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
        <div className="text-center">
          <h1 className="text-lg font-bold">Control Remoto</h1>
          <p className="text-sm text-muted-foreground">
            Código de Sesión:{' '}
            <span className="font-mono text-primary">{sessionId}</span>
          </p>
        </div>
        <Button variant="destructive" onClick={onStop}>
          <X className="mr-2 h-4 w-4" /> Terminar
        </Button>
      </header>
      <div className="flex-grow overflow-y-auto p-4">
        <LayoutConfigurator
          order={remoteOrder.filter((i) => remoteEvents[i] !== null)}
          onOrderChange={handleOrderChange}
          eventDetails={remoteEvents}
          onRemove={handleRemove}
          onModify={() =>
            toast({
              title: 'Info',
              description:
                'La modificación debe hacerse eliminando y volviendo a añadir el evento.',
            })
          }
          isViewPage={true}
          onAddEvent={() => setAddEventsOpen(true)}
          onSchedule={() =>
            toast({
              title: 'Info',
              description: 'La programación no está disponible en modo control remoto.',
            })
          }
          onNotificationManager={() =>
            toast({
              title: 'Info',
              description: 'Las notificaciones no están disponibles en modo control remoto.',
            })
          }
          // Dummy props
          gridGap={0}
          onGridGapChange={() => {}}
          borderColor="#000"
          onBorderColorChange={() => {}}
          isChatEnabled={false}
          onIsChatEnabledChange={() => {}}
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
export function ControlledDeviceView({ onStop, sessionId }: { onStop: () => void; sessionId: string | null }) {
  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-6 p-8 text-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <div className='space-y-2'>
            <h1 className="text-2xl font-bold">Dispositivo bajo Control Remoto</h1>
            <p className="text-muted-foreground">
                Esta ventana ahora está siendo controlada por otro dispositivo. <br/>
                Código de sesión: <span className="font-mono text-primary">{sessionId}</span>
            </p>
        </div>
        <Button variant="outline" onClick={onStop}>
            <X className="mr-2 h-4 w-4" /> Detener Control
        </Button>
    </div>
  );
}
