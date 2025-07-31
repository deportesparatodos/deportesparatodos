
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
import type Ably from 'ably';

// --- Main Dialog to start a remote session ---
export function RemoteControlDialog({
  ablyClient,
  setRemoteControlMode,
  setRemoteSessionId,
}: {
  ablyClient: Ably.Realtime | null;
  setRemoteControlMode: (mode: 'inactive' | 'controlling' | 'controlled') => void;
  setRemoteSessionId: (id: string | null) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'main' | 'controlled' | 'controlling'>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const { toast } = useToast();

  const handleStartControlledSession = useCallback(() => {
    setIsLoading(true);
    const newCode = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedCode(newCode);
    setRemoteSessionId(newCode);
    setRemoteControlMode('controlled'); // Set the mode, but don't enter view mode yet
    setIsLoading(false);
  }, [setRemoteControlMode, setRemoteSessionId]);

  const handleStartControllingSession = () => {
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
    setRemoteControlMode('controlling');
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
    // Automatically generate code when entering the 'controlled' view
    if (view === 'controlled' && isOpen && !generatedCode) {
      handleStartControlledSession();
    }
  }, [view, isOpen, generatedCode, handleStartControlledSession]);

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
            Controla la aplicación desde otro dispositivo o permite que este dispositivo sea controlado.
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && (
          <div className="grid gap-4 py-4">
            <Button onClick={() => setView('controlling')} size="lg">
              Controlar Otro Dispositivo
            </Button>
            <Button onClick={() => setView('controlled')} variant="outline" size="lg">
              Conectar control remoto
            </Button>
          </div>
        )}
        
        {view === 'controlled' && (
          <div className="grid gap-4 py-4 text-center">
             <DialogDescription>
                Introduce este código en el dispositivo que quieres usar como control:
            </DialogDescription>
            <div className="p-4 bg-muted rounded-lg">
                <p className="text-4xl font-bold tracking-widest text-primary">
                    {isLoading ? <Loader2 className="h-10 w-10 animate-spin mx-auto" /> : generatedCode}
                </p>
            </div>
             <p className="text-xs text-muted-foreground pt-2">
                Esperando conexión del control remoto...
            </p>
          </div>
        )}

        {view === 'controlling' && (
          <div className="grid gap-4 py-4">
            <Input
              placeholder="Introduce el código de 4 dígitos"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={4}
              className="text-center text-2xl h-14 tracking-widest font-mono"
            />
            <Button onClick={handleStartControllingSession} disabled={isLoading} size="lg">
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
  ablyChannel,
  onStop,
  allEvents,
  allChannels,
  updateAllEvents,
  initialEvents,
  initialOrder,
}: {
  ablyChannel: Ably.Types.RealtimeChannelPromise | null;
  onStop: () => void;
  allEvents: Event[];
  allChannels: Channel[];
  updateAllEvents: (events: Event[]) => void;
  initialEvents: (Event|null)[],
  initialOrder: number[],
}) {
    const [remoteEvents, setRemoteEvents] = useState<(Event | null)[]>(initialEvents);
    const [remoteOrder, setRemoteOrder] = useState<number[]>(initialOrder);
    const [addEventsOpen, setAddEventsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const { toast } = useToast();

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
    
    const handleEventsChange = (newEvents: (Event|null)[]) => {
      setRemoteEvents(newEvents);
      const newActiveIndexes = newEvents.map((e,i) => e ? i : -1).filter(i => i !== -1);
      const oldActiveIndexes = remoteOrder.filter(i => newActiveIndexes.includes(i));
      const fullOrder = Array.from({ length: 9 }, (_, i) => i);
      const finalNewOrder = [...oldActiveIndexes, ...fullOrder.filter(i => !oldActiveIndexes.includes(i))];

      setRemoteOrder(finalNewOrder);
      updateRemoteState(newEvents, finalNewOrder);
    }

    const handleRemove = (index: number) => {
        const newEvents = [...remoteEvents];
        newEvents[index] = null;
        handleEventsChange(newEvents);
    };

    const handleOrderChange = (newOrder: number[]) => {
      const fullNewOrder = [...newOrder];
      const presentIndexes = new Set(newOrder);
      for(let i=0; i<9; i++) {
        if(!presentIndexes.has(i)) {
            fullNewOrder.push(i);
        }
      }
      setRemoteOrder(fullNewOrder);
      updateRemoteState(remoteEvents, fullNewOrder);
    };

    const handleAddEvent = (event: Event, option: string) => {
        const newEvents = [...remoteEvents];
        const eventWithSelection = { ...event, selectedOption: option };
        const emptyIndex = newEvents.findIndex(e => e === null);
        if (emptyIndex !== -1) {
            newEvents[emptyIndex] = eventWithSelection;
            handleEventsChange(newEvents);
        } else {
            toast({ title: 'Info', description: 'All 9 slots are full.' });
        }
        setAddEventsOpen(false);
    };

    if (!ablyChannel) {
        return (
            <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="mt-4 text-muted-foreground">Conectando al servicio de control remoto...</p>
            </div>
        )
    }

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
        <div className="text-center">
          <h1 className="text-lg font-bold">Control Remoto</h1>
          <p className="text-sm text-muted-foreground">
            Sesión Conectada
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
