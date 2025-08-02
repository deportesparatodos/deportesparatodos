
'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
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
import { Loader2, X, Airplay, MessageSquare, Play } from 'lucide-react';
import type { Event } from '@/components/event-carousel';
import type { Channel } from './channel-list';
import { useToast } from '@/hooks/use-toast';
import { LayoutConfigurator } from './layout-configurator';
import { AddEventsDialog } from '@/app/page';
import type Ably from 'ably';
import { cn } from '@/lib/utils';

// --- Main Dialog to start a remote session ---
export function RemoteControlDialog({
  remoteSessionId,
  setRemoteControlMode,
  setRemoteSessionId,
  onStartControlled,
}: {
  remoteSessionId: string | null;
  setRemoteControlMode: (mode: 'inactive' | 'controlling' | 'controlled') => void;
  setRemoteSessionId: (id: string | null) => void;
  onStartControlled: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'main' | 'controlled' | 'controlling'>('main');
  const [isLoading, setIsLoading] = useState(false);
  const [code, setCode] = useState('');
  const { toast } = useToast();

  const handleStartControllingSession = async () => {
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
    // Don't setIsLoading to false here, the parent component will unmount/change view
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
                    {remoteSessionId ? remoteSessionId : <Loader2 className="h-10 w-10 animate-spin mx-auto" />}
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
  onSessionEnd,
  allEvents,
  allChannels,
  updateAllEvents,
}: {
  ablyChannel: Ably.Types.RealtimeChannelPromise | null;
  onSessionEnd: (finalState: {selectedEvents: (Event|null)[]}) => void;
  allEvents: Event[];
  allChannels: Channel[];
  updateAllEvents: (events: Event[]) => void;
}) {
    const [remoteState, setRemoteState] = useState<RemoteControlViewState | null>(null);
    const [addEventsOpen, setAddEventsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isRemoteChatOpen, setIsRemoteChatOpen] = useState(false);
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!ablyChannel) return;

        const connectAndSync = async () => {
             try {
                // Ensure the channel is attached before doing anything.
                await ablyChannel.whenState('attached');

                // Subscribe to the initial state message from the controlled device.
                ablyChannel.subscribe('initialState', (message: any) => {
                    setRemoteState(message.data);
                    setIsLoading(false);
                });

                // Publish the 'connect' message to tell the controlled device we are ready.
                await ablyChannel.publish('connect', {});

            } catch (error: any) {
                console.error("Error during remote control sync:", error);
                toast({
                    variant: 'destructive',
                    title: 'Error de Conexión',
                    description: `No se pudo iniciar la conexión con el dispositivo. (${error.message})`,
                });
                onSessionEnd({ selectedEvents: remoteState?.selectedEvents || Array(9).fill(null) });
            }
        };

        connectAndSync();

        return () => {
            ablyChannel.unsubscribe();
        }
    }, [ablyChannel, onSessionEnd, remoteState, toast]);


    const updateRemoteState = useCallback((newState: Partial<RemoteControlViewState>) => {
        if (!remoteState || !ablyChannel) return;
        const updatedState = { ...remoteState, ...newState };
        setRemoteState(updatedState);
        ablyChannel.publish('updateState', updatedState);
    }, [ablyChannel, remoteState]);
    

    const handleStopAndPersist = () => {
        if(ablyChannel && remoteState){
            ablyChannel.publish('disconnect', { payload: remoteState });
        }
        onSessionEnd({ selectedEvents: remoteState?.selectedEvents || Array(9).fill(null) });
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
        if (ablyChannel) {
            ablyChannel.publish('playClick', { index });
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

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="mt-4 text-muted-foreground">Conectando al servicio de control remoto...</p>
            </div>
        )
    }
    
    if (!remoteState) {
        // This case can happen if connection fails and isLoading is set to false.
        // The error toast should have already been shown.
        return (
            <div className="fixed inset-0 bg-background z-50 flex flex-col items-center justify-center text-center p-4">
                 <X className="h-10 w-10 text-destructive mb-4" />
                <h1 className="text-lg font-bold">Conexión Fallida</h1>
                <p className="mt-2 text-muted-foreground">
                    No se pudo establecer la conexión. Por favor, verifica el código e inténtalo de nuevo.
                </p>
                <Button onClick={() => onSessionEnd({ selectedEvents: []})} className="mt-4">
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
            onModify={() =>
              toast({
                title: 'Info',
                description:
                  'La modificación debe hacerse eliminando y volviendo a añadir el evento.',
              })
            }
            onPlay={handlePlayClick}
            isViewPage={true}
            onAddEvent={() => setAddEventsOpen(true)}
            onSchedule={() =>
              toast({
                title: 'Info',
                description: 'La programación no está disponible en modo control remoto.',
              })
            }
            gridGap={remoteState.gridGap}
            onGridGapChange={handleGridGapChange}
            borderColor={remoteState.borderColor}
            onBorderColorChange={handleBorderColorChange}
            isChatEnabled={remoteState.isChatEnabled}
            onIsChatEnabledChange={handleIsChatEnabledChange}
            onOpenChat={() => setIsRemoteChatOpen(true)}
          />
        </div>
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

// This needs to be defined for the props of RemoteControlView
interface RemoteControlViewState {
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  gridGap: number;
  borderColor: string;
  isChatEnabled: boolean;
}
