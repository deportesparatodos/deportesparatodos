
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
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Loader2, X, Airplay, MessageSquare, Play, Pencil, Maximize, Minimize, RotateCw } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import type { Channel } from './channel-list';
import { useToast } from '@/hooks/use-toast';
import { LayoutConfigurator } from './layout-configurator';
import type Ably from 'ably';
import { cn } from '@/lib/utils';
import { EventSelectionDialog } from './event-selection-dialog';
import { AddEventsDialog } from './add-events-dialog';

// --- Main Dialog to start a remote session ---
export function RemoteControlDialog({
  remoteSessionId,
  setRemoteControlMode,
  onStartControlling,
  onActivateControlledMode,
  isViewMode
}: {
  remoteSessionId: string | null;
  setRemoteControlMode: (mode: 'inactive' | 'controlling' | 'controlled') => void;
  onStartControlling: (code: string) => void;
  onActivateControlledMode: () => Promise<void>;
  isViewMode: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'main' | 'controlling'>('main');
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
  
  const handleActivateControlled = async () => {
    setIsOpen(false);
    await onActivateControlledMode();
  };


  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setView('main');
        setCode('');
        setIsLoading(false);
      }, 200);
    }
  }, [isOpen]);

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
            {view === 'main'
              ? 'Controla la aplicación desde otro dispositivo o permite que este dispositivo sea controlado.'
              : 'Introduce el código de 4 dígitos que aparece en el otro dispositivo.'
            }
          </DialogDescription>
        </DialogHeader>

        {view === 'main' && (
          <div className="space-y-4 py-4">
              <Button onClick={handleActivateControlled} size="lg" className="w-full">
                Ser Controlado
              </Button>
              <Button onClick={() => setView('controlling')} variant="outline" size="lg" className="w-full">
                Controlar Otro Dispositivo
              </Button>
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
            <Button onClick={handleStartControllingSession} disabled={isLoading} size="lg" className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conectar
            </Button>
          </div>
        )}

        {view !== 'main' && (
          <DialogFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setView('main')}>
              Volver
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export interface RemoteControlViewState {
  sessionId: string;
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  gridGap: number;
  borderColor: string;
  isChatEnabled: boolean;
  fullscreenIndex: number | null;
}

// --- View for the "Controlling" device (e.g., phone) ---
export function RemoteControlView({
  ablyRef,
  initAbly,
  onSessionEnd,
  allEvents,
  allChannels,
  updateAllEvents,
  initialRemoteSessionId,
  isSessionEnded,
  setIsSessionEnded,
}: {
  ablyRef: React.MutableRefObject<{ client: Ably.Realtime | null; channel: Ably.Types.RealtimeChannelPromise | null; }>;
  initAbly: (clientIdSuffix: string) => Promise<Ably.Realtime>;
  onSessionEnd: (finalState: RemoteControlViewState) => void;
  allEvents: Event[];
  allChannels: Channel[];
  updateAllEvents: (events: Event[]) => void;
  initialRemoteSessionId: string | null;
  isSessionEnded: boolean;
  setIsSessionEnded: (isEnded: boolean) => void;
}) {
    const [remoteState, setRemoteState] = useState<RemoteControlViewState | null>(null);
    const [addEventsOpen, setAddEventsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isRemoteChatOpen, setIsRemoteChatOpen] = useState(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    const [modifyEvent, setModifyEvent] = useState<{ event: Event, index: number } | null>(null);
    const [modifyEventDialogOpen, setModifyEventDialogOpen] = useState(false);
    
    const handleStopAndPersist = useCallback(() => {
        if (remoteState) {
            onSessionEnd(remoteState);
        } else {
           // Fallback if remoteState is null for some reason
           onSessionEnd({sessionId: '', selectedEvents: [], viewOrder: [], gridGap: 0, borderColor: '', isChatEnabled: false, fullscreenIndex: null});
        }
    }, [remoteState, onSessionEnd]);

    // Connect to Ably and sync state
    useEffect(() => {
      let presence: Ably.Types.RealtimePresencePromise | undefined;
      let channel: Ably.Types.RealtimeChannelPromise | undefined;
      let connectionTimeout: NodeJS.Timeout;

      const connectAndSync = async () => {
        if (!initialRemoteSessionId) return;

        try {
          const client = await initAbly('controlling');
          channel = client.channels.get(`remote-control:${initialRemoteSessionId}`);
          ablyRef.current.channel = channel;
          
          presence = channel.presence;
          await presence.enter();

          connectionTimeout = setTimeout(() => {
            if (isLoading) {
              throw new Error("La conexión ha tardado demasiado. Verifica el código.");
            }
          }, 10000);

          channel.subscribe('control-action', (message: Ably.Types.Message) => {
            const { action, payload } = message.data;
            if (action === 'initialState' && payload.sessionId === initialRemoteSessionId) {
              clearTimeout(connectionTimeout);
              setRemoteState(payload);
              setIsLoading(false);
            }
             if (action === 'controlledViewClosed') {
                setIsSessionEnded(true);
             }
          });
          
          await channel.whenState('attached');
          channel.publish('control-action', { action: 'requestInitialState', payload: { sessionId: initialRemoteSessionId }});

        } catch (error: any) {
           console.error("Error connecting as controller:", error);
           clearTimeout(connectionTimeout);
           toast({ variant: 'destructive', title: 'Error de Conexión', description: error.message || 'No se pudo conectar.' });
           handleStopAndPersist();
        }
      };

      connectAndSync();

      return () => {
        clearTimeout(connectionTimeout);
        const { channel: currentChannel, client: currentClient } = ablyRef.current;
        if (currentChannel && initialRemoteSessionId) {
            currentChannel.publish('control-action', { action: 'disconnect', payload: { sessionId: initialRemoteSessionId } });
        }
        if (presence) presence.leave();
        if (currentChannel) currentChannel.detach();
        if (currentClient) currentClient.close();
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [initialRemoteSessionId, initAbly]);


    const publishAction = useCallback((action: string, payload: object) => {
        const { channel } = ablyRef.current;
        if (!channel || !initialRemoteSessionId) return;
        channel.publish('control-action', {
            action,
            payload: { ...payload, sessionId: initialRemoteSessionId }
        });
    }, [ablyRef, initialRemoteSessionId]);

    const handleEventsChange = (newEvents: (Event|null)[]) => {
      if (!remoteState) return;
      const updatedState = { ...remoteState, selectedEvents: newEvents };
      setRemoteState(updatedState);
      publishAction('updateState', updatedState);
    }

    const handleRemove = (index: number) => {
        if (!remoteState) return;
        const newEvents = [...remoteState.selectedEvents];
        newEvents[index] = null;
        handleEventsChange(newEvents);
    };
    
    const handleToggleFullscreen = (index: number) => {
        if (!remoteState) return;
        const newFullscreenIndex = remoteState.fullscreenIndex === index ? null : index;
        setRemoteState(s => s ? { ...s, fullscreenIndex: newFullscreenIndex } : null);
        publishAction('toggleFullscreen', { index });
    };
    
    const handleReload = (index: number) => {
        publishAction('reload', { index });
    };

    const handleOrderChange = (newOrder: number[]) => {
      if (!remoteState) return;
       const fullNewOrder = [...newOrder];
        const presentIndexes = new Set(newOrder);
        for(let i=0; i<9; i++) {
          if(!presentIndexes.has(i)) {
            fullNewOrder.push(i);
          }
        }
      setRemoteState(s => s ? { ...s, viewOrder: fullNewOrder } : null);
      publishAction('reorder', { newOrder: fullNewOrder });
    };
  
    const handleGridGapChange = (value: number) => {
        setRemoteState(s => s ? { ...s, gridGap: value } : null);
        publishAction('updateState', { gridGap: value });
    };

    const handleBorderColorChange = (value: string) => {
        setRemoteState(s => s ? { ...s, borderColor: value } : null);
        publishAction('updateState', { borderColor: value });
    };

    const handleIsChatEnabledChange = (value: boolean) => {
        setRemoteState(s => s ? { ...s, isChatEnabled: value } : null);
        publishAction('updateState', { isChatEnabled: value });
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
    
    if (!remoteState && !isLoading) {
        return (
            <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center p-4">
                 <X className="h-10 w-10 text-destructive mb-4" />
                <h1 className="text-lg font-bold">Conexión Fallida</h1>
                <p className="mt-2 text-muted-foreground">
                    No se pudo establecer la conexión. Por favor, verifica el código e inténtalo de nuevo.
                </p>
                <Button onClick={handleStopAndPersist} className="mt-4">
                    Cerrar
                </Button>
            </div>
        );
    }
    
    if (!remoteState) return null;

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
                onReload={handleReload}
                onModify={handleModifyEvent}
                onToggleFullscreen={handleToggleFullscreen}
                fullscreenIndex={remoteState.fullscreenIndex}
                isViewPage={true}
                onAddEvent={() => setAddEventsOpen(true)}
                gridGap={remoteState.gridGap}
                onGridGapChange={handleGridGapChange}
                borderColor={remoteState.borderColor}
                onBorderColorChange={handleBorderColorChange}
                onRestoreGridSettings={() => {}}
                isChatEnabled={remoteState.isChatEnabled}
                onIsChatEnabledChange={handleIsChatEnabledChange}
                categories={[]}
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

        <Dialog open={isSessionEnded} onOpenChange={(open) => { if(!open) handleStopAndPersist()}}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sesión Terminada</DialogTitle>
                    <DialogDescription>
                        La sesión en el otro dispositivo ha terminado.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button onClick={handleStopAndPersist}>Cerrar</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </>
  );
}
