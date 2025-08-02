

'use client';

import { useState, useEffect, useCallback, Suspense, useRef } from 'react';
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
import { Loader2, X, Airplay, MessageSquare, Play, Pencil } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import type { Channel } from './channel-list';
import { useToast } from '@/hooks/use-toast';
import { LayoutConfigurator } from './layout-configurator';
import { AddEventsDialog } from '@/app/page';
import type Ably from 'ably';
import { cn } from '@/lib/utils';
import { EventSelectionDialog } from './event-selection-dialog';

// --- Main Dialog to start a remote session ---
export function RemoteControlDialog({
  remoteSessionId,
  setRemoteControlMode,
  onStartControlling,
  onStartControlled,
}: {
  remoteSessionId: string | null;
  setRemoteControlMode: (mode: 'inactive' | 'controlling' | 'controlled') => void;
  onStartControlling: (code: string) => void;
  onStartControlled: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'main' | 'controlled' | 'controlling'>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const { toast } = useToast();

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
    onStartControlling(code);
    setIsOpen(false);
  };
  
  const handleSetControlledView = () => {
    setView('controlled');
    onStartControlled();
  }

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('main');
        setCode('');
        setIsLoading(false);
      }, 200);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && view === 'controlled' && !remoteSessionId) {
      // The session ID might not be available immediately, show loading
      setIsLoading(true);
    } else {
      setIsLoading(false);
    }
  }, [isOpen, view, remoteSessionId]);
  

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
            <Button onClick={handleSetControlledView} variant="outline" size="lg">
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
                    {isLoading || !remoteSessionId ? <Loader2 className="h-10 w-10 animate-spin mx-auto" /> : remoteSessionId}
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

interface RemoteControlViewState {
  sessionId: string;
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  gridGap: number;
  borderColor: string;
  isChatEnabled: boolean;
}

// --- View for the "Controlling" device (e.g., phone) ---
export function RemoteControlView({
  ablyRef,
  initAbly,
  onSessionEnd,
  allEvents,
  allChannels,
  updateAllEvents,
  initialRemoteSessionId
}: {
  ablyRef: React.MutableRefObject<{ client: Ably.Realtime | null; channel: Ably.Types.RealtimeChannelPromise | null; }>;
  initAbly: (clientIdSuffix: string) => Promise<Ably.Realtime>;
  onSessionEnd: () => void;
  allEvents: Event[];
  allChannels: Channel[];
  updateAllEvents: (events: Event[]) => void;
  initialRemoteSessionId: string | null;
}) {
    const [remoteState, setRemoteState] = useState<RemoteControlViewState | null>(null);
    const [addEventsOpen, setAddEventsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isRemoteChatOpen, setIsRemoteChatOpen] = useState(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const [modifyEvent, setModifyEvent] = useState<{ event: Event, index: number } | null>(null);
    const [modifyEventDialogOpen, setModifyEventDialogOpen] = useState(false);

    useEffect(() => {
      const connectAndSync = async () => {
        if (!initialRemoteSessionId) return;

        try {
          const client = await initAbly('controlling');
          const channel = client.channels.get(`remote-control:${initialRemoteSessionId}`);
          ablyRef.current.channel = channel;

          // 1. Subscribe first
          channel.subscribe('remote-control', (message: Ably.Types.Message) => {
            const { action, payload } = message.data;
            if (payload.sessionId !== initialRemoteSessionId) return;

            if (action === 'initialState') {
              setRemoteState(payload);
              setIsLoading(false);
            }
          });
          
          // 2. Wait for channel to be attached
          await channel.whenState('attached');
          
          // 3. Publish connect message
          channel.publish('remote-control', { action: 'connect', payload: { sessionId: initialRemoteSessionId }});

        } catch (error) {
           console.error("Error connecting as controller:", error);
           toast({ variant: 'destructive', title: 'Error de Conexión', description: 'No se pudo conectar con el dispositivo. Verifica el código.' });
           onSessionEnd();
        }
      };

      connectAndSync();

      return () => {
        const { channel } = ablyRef.current;
        if (channel && initialRemoteSessionId) {
          channel.publish('remote-control', { action: 'disconnect', payload: { sessionId: initialRemoteSessionId, selectedEvents: remoteState?.selectedEvents } });
        }
        onSessionEnd();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialRemoteSessionId, initAbly, onSessionEnd, toast]);


    const updateRemoteState = useCallback((newState: Partial<RemoteControlViewState>) => {
        const { channel } = ablyRef.current;
        if (!remoteState || !channel || !initialRemoteSessionId) return;
        const updatedState = { ...remoteState, ...newState };
        setRemoteState(updatedState as RemoteControlViewState);
        channel.publish('remote-control', { action: 'updateState', payload: { ...updatedState, sessionId: initialRemoteSessionId }});
    }, [ablyRef, remoteState, initialRemoteSessionId]);
    

    const handleStopAndPersist = () => {
        onSessionEnd();
    };

    const handleEventsChange = (newEvents: (Event|null)[]) => {
      if (!remoteState) return;
      const newActiveIndexes = newEvents.map((e,i) => e ? i : -1).filter(i => i !== -1);
      const oldActiveIndexes = remoteState.viewOrder.filter(i => newActiveIndexes.includes(i));
      const fullOrder = Array.from({ length: 9 }, (_, i) => i);
      const finalNewOrder = [...oldActiveIndexes, ...fullOrder.filter(i => !oldActiveIndexes.includes(i))];

      updateRemoteState({ 
          selectedEvents: newEvents, 
          viewOrder: finalNewOrder,
      });
    }

    const handleRemove = (index: number) => {
        if (!remoteState) return;
        const newEvents = [...remoteState.selectedEvents];
        newEvents[index] = null;
        handleEventsChange(newEvents);
    };
    
    const handlePlayClick = (index: number) => {
        const { channel } = ablyRef.current;
        if (channel && initialRemoteSessionId) {
            channel.publish('remote-control', { action: 'playClick', payload: { index, sessionId: initialRemoteSessionId } });
        }
    };

    const handleOrderChange = (newOrder: number[]) => {
      const fullNewOrder = [...newOrder];
      const presentIndexes = new Set(newOrder);
      for(let i=0; i<9; i++) {
        if(!presentIndexes.has(i)) {
            fullNewOrder.push(i);
        }
      }
      updateRemoteState({ viewOrder: fullNewOrder });
    };
  
    const handleGridGapChange = (value: number) => {
        updateRemoteState({ gridGap: value });
    };

    const handleBorderColorChange = (value: string) => {
        updateRemoteState({ borderColor: value });
    };

    const handleIsChatEnabledChange = (value: boolean) => {
        updateRemoteState({ isChatEnabled: value });
    };

    const handleAddEvent = (event: Event, option: string) => {
        if (!remoteState) return;
        const newEvents = [...remoteState.selectedEvents];
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

     const handleModifyEvent = (event: Event, index: number) => {
        if (!remoteState) return;
        const eventFromState = remoteState.selectedEvents[index];
        if (eventFromState) {
            const eventWithCurrentSelection = { ...event, selectedOption: eventFromState.selectedOption };
            setModifyEvent({ event: eventWithCurrentSelection, index: index });
            setModifyEventDialogOpen(true);
        }
    };

    const handleModifyEventSelect = (event: Event, option: string) => {
        if (!remoteState || modifyEvent === null) return;
        const newEvents = [...remoteState.selectedEvents];
        const eventWithSelection = { ...event, selectedOption: option };
        newEvents[modifyEvent.index] = eventWithSelection;
        
        handleEventsChange(newEvents);

        setModifyEvent(null);
        setModifyEventDialogOpen(false);
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="mt-4 text-muted-foreground">Conectando y esperando estado...</p>
            </div>
        )
    }
    
    if (!remoteState) {
        return (
            <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center p-4">
                 <X className="h-10 w-10 text-destructive mb-4" />
                <h1 className="text-lg font-bold">Conexión Fallida</h1>
                <p className="mt-2 text-muted-foreground">
                    No se pudo establecer la conexión. Por favor, verifica el código e inténtalo de nuevo.
                </p>
                <Button onClick={onSessionEnd} className="mt-4">
                    Cerrar
                </Button>
            </div>
        );
    }

  return (
    <>
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
          <div className="text-left">
            <h1 className="text-lg font-bold">Control Remoto</h1>
            <p className="text-sm text-muted-foreground">
              Sesión Conectada
            </p>
          </div>
          <Button variant="destructive" onClick={handleStopAndPersist}>
            <X className="mr-2 h-4 w-4" /> Terminar
          </Button>
        </header>
        <div className="flex-grow overflow-y-auto p-4">
            <LayoutConfigurator
                remoteControlMode="controlling"
                order={remoteState.viewOrder.filter((i) => remoteState.selectedEvents[i] !== null)}
                onOrderChange={handleOrderChange}
                eventDetails={remoteState.selectedEvents}
                onRemove={handleRemove}
                onModify={handleModifyEvent}
                onPlay={handlePlayClick}
                isViewPage={true}
                onAddEvent={() => setAddEventsOpen(true)}
                gridGap={remoteState.gridGap}
                onGridGapChange={handleGridGapChange}
                borderColor={remoteState.borderColor}
                onBorderColorChange={handleBorderColorChange}
                isChatEnabled={remoteState.isChatEnabled}
                onIsChatEnabledChange={handleIsChatEnabledChange}
                onOpenChat={() => setIsRemoteChatOpen(true)}
             />
        </div>
        
        {modifyEvent && (
            <EventSelectionDialog
                isOpen={modifyEventDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setModifyEvent(null);
                        setModifyEventDialogOpen(false);
                    } else {
                        setModifyEventDialogOpen(true);
                    }
                }}
                event={modifyEvent.event}
                onSelect={handleModifyEventSelect}
                isModification={true}
                onRemove={() => {}} // Remove is handled by main remote view
                windowNumber={modifyEvent.index + 1}
                isLoading={false}
                setIsLoading={() => {}}
                setEventForDialog={(event) => setModifyEvent(prev => prev ? {...prev, event} : null)}
            />
        )}
        
        <AddEventsDialog
          open={addEventsOpen}
          onOpenChange={setAddEventsOpen}
          onSelect={handleAddEvent}
          selectedEvents={remoteState.selectedEvents}
          allEvents={allEvents}
          allChannels={allChannels}
          onFetchEvents={async () => {}} // No fetching in remote
          updateAllEvents={updateAllEvents}
          isFullScreen={isFullScreen}
          setIsFullScreen={setIsFullScreen}
        />
      </div>
       <Dialog open={isRemoteChatOpen} onOpenChange={setIsRemoteChatOpen}>
            <DialogContent className="p-0 border-0 w-[90vw] h-[80vh] flex flex-col">
              <DialogHeader className="p-4 border-b">
                <DialogTitle>Chat en Vivo</DialogTitle>
                <DialogDescription className="sr-only">Contenedor del chat en vivo de Minnit.</DialogDescription>
              </DialogHeader>
                <iframe
                    src="https://organizations.minnit.chat/626811533994618/c/Main?embed"
                    title="Chat en Vivo"
                    className="w-full flex-grow border-0"
                />
            </DialogContent>
        </Dialog>
    </>
  );
}

