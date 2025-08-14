
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Ably from 'ably';
import { Button } from './ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from './ui/dialog';
import { Input } from './ui/input';
import { Loader2, X, Airplay } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LayoutConfigurator } from './layout-configurator';
import { EventSelectionDialog } from './event-selection-dialog';
import { AddEventsDialog } from './add-events-dialog';
import { ScheduleManager } from './schedule-manager';
import type { Event } from './event-carousel';
import type { Channel } from './channel-list';
import type { Schedule } from './schedule-manager';

// --- TYPE DEFINITIONS ---
interface RemoteControlViewState {
  selectedEvents: (Event | null)[];
  viewOrder: number[];
  gridGap: number;
  borderColor: string;
  isChatEnabled: boolean;
  fullscreenIndex: number | null;
  schedules: Schedule[];
}

const initialRemoteState: RemoteControlViewState = {
  selectedEvents: Array(9).fill(null),
  viewOrder: Array.from({ length: 9 }, (_, i) => i),
  gridGap: 0,
  borderColor: '#000000',
  isChatEnabled: true,
  fullscreenIndex: null,
  schedules: [],
};

type RemoteControlManagerProps = 
  | {
      mode: 'inactive';
      onStartControlling: (code: string) => void;
      onActivateControlledMode: () => void;
    }
  | {
      mode: 'controlling';
      initialRemoteSessionId: string | null;
      onSessionEnd: () => void;
      allEvents: Event[];
      allChannels: Channel[];
      updateAllEvents: (events: Event[]) => void;
    }
  | {
      mode: 'controlled';
      viewState: RemoteControlViewState;
      setViewState: (newState: RemoteControlViewState) => void;
      onSessionStart: (sessionId: string) => void;
      onSessionEnd: () => void;
      onReload: (index: number) => void;
      onToggleFullscreen: (index: number) => void;
    };

// --- ABLY HOOK ---
function useAbly(
    mode: 'controlling' | 'controlled',
    sessionId: string | null,
    onMessage: (message: Ably.Types.Message) => void,
    onConnectionChange: (state: Ably.Types.ConnectionState) => void
) {
    const ablyRef = useRef<{ client: Ably.Realtime | null; channel: Ably.Types.RealtimeChannelPromise | null }>({ client: null, channel: null });

    const cleanup = useCallback(() => {
        const { client } = ablyRef.current;
        if (client && client.connection.state !== 'closed') {
            client.close();
            console.log("Ably connection closed.");
        }
        ablyRef.current = { client: null, channel: null };
    }, []);

    useEffect(() => {
        let isMounted = true;
        if (!sessionId && mode === 'controlling') {
            console.error("No session ID provided for controlling mode.");
            return;
        }

        const clientId = `${mode}-${Date.now()}`;
        const client = new Ably.Realtime({ authUrl: `/api/ably?clientId=${clientId}` });

        client.connection.on((stateChange) => {
            if (isMounted) onConnectionChange(stateChange.current);
        });

        const channelName = `remote-control:${sessionId}`;
        const channel = client.channels.get(channelName);
        
        ablyRef.current = { client, channel };

        channel.subscribe(onMessage);

        if (mode === 'controlling') {
            channel.presence.enter();
        }
        
        return () => {
            isMounted = false;
            cleanup();
        };
    }, [sessionId, mode, onMessage, onConnectionChange, cleanup]);

    const publish = useCallback((name: string, data: any) => {
        ablyRef.current.channel?.publish(name, data);
    }, []);

    return { publish, cleanup };
}


// --- MAIN COMPONENT ---
export function RemoteControlManager(props: RemoteControlManagerProps) {
  switch (props.mode) {
    case 'inactive':
      return <InactiveView {...props} />;
    case 'controlling':
      return <ControllingView {...props} />;
    case 'controlled':
      return <ControlledView {...props} />;
    default:
      return null;
  }
}

// --- VIEWS ---

function InactiveView({ onActivateControlledMode, onStartControlling }: Extract<RemoteControlManagerProps, { mode: 'inactive' }>) {
  const [dialogView, setDialogView] = useState<'main' | 'controlling'>('main');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleStartControlling = () => {
    if (!code || code.length !== 4) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un código de 4 dígitos válido.' });
      return;
    }
    setIsLoading(true);
    onStartControlling(code);
  };
  
  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{dialogView === 'main' ? 'Control Remoto' : 'Controlar Dispositivo'}</DialogTitle>
        <DialogDescription>
          {dialogView === 'main' 
            ? 'Controla la aplicación desde otro dispositivo o permite que este dispositivo sea controlado.'
            : 'Introduce el código de 4 dígitos que aparece en el otro dispositivo.'}
        </DialogDescription>
      </DialogHeader>

      {dialogView === 'main' ? (
        <div className="space-y-4 py-4">
          <Button onClick={onActivateControlledMode} size="lg" className="w-full">Ser Controlado</Button>
          <Button onClick={() => setDialogView('controlling')} variant="outline" size="lg" className="w-full">Controlar Otro Dispositivo</Button>
        </div>
      ) : (
        <>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="1234"
              value={code}
              onChange={(e) => setCode(e.target.value.trim().toUpperCase())}
              maxLength={4}
              className="text-center text-2xl h-14 tracking-widest font-mono"
            />
            <Button onClick={handleStartControlling} disabled={isLoading} size="lg" className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Conectar
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" className="w-full" onClick={() => setDialogView('main')}>Volver</Button>
          </DialogFooter>
        </>
      )}
    </DialogContent>
  );
}

function ControlledView({ viewState, setViewState, onSessionStart, onSessionEnd, onReload, onToggleFullscreen }: Extract<RemoteControlManagerProps, { mode: 'controlled' }>) {
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        setSessionId(newCode);
        onSessionStart(newCode);
    }, [onSessionStart]);

    const handleMessage = useCallback((message: Ably.Types.Message) => {
        const { action, payload } = message.data;
        if (action === 'requestInitialState') {
            publish('stateUpdate', viewState);
        } else if (action === 'updateState') {
            setViewState(payload);
        } else if (action === 'reload') {
            onReload(payload.index);
        } else if (action === 'toggleFullscreen') {
            onToggleFullscreen(payload.index);
        }
    }, [viewState, setViewState, onReload, onToggleFullscreen]);
    
    const { publish } = useAbly('controlled', sessionId, handleMessage, (state) => {
        if (state === 'closed' || state === 'failed' || state === 'suspended') {
            onSessionEnd();
        }
    });

    useEffect(() => {
      publish('stateUpdate', viewState);
    }, [viewState, publish]);
    
    return null;
}

function ControllingView({ initialRemoteSessionId, onSessionEnd, allEvents, allChannels, updateAllEvents }: Extract<RemoteControlManagerProps, { mode: 'controlling' }>) {
  const [remoteState, setRemoteState] = useState<RemoteControlViewState | null>(null);
  const [connectionState, setConnectionState] = useState<Ably.Types.ConnectionState>('connecting');
  const { toast } = useToast();

  const [addEventsOpen, setAddEventsOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [modifyEvent, setModifyEvent] = useState<{ event: Event, index: number } | null>(null);

  const handleMessage = useCallback((message: Ably.Types.Message) => {
      if (message.name === 'stateUpdate') {
          setRemoteState(message.data);
          if (connectionState !== 'connected') {
            setConnectionState('connected');
          }
      }
  }, [connectionState]);

  const { publish, cleanup } = useAbly('controlling', initialRemoteSessionId, handleMessage, (state) => {
      setConnectionState(state);
      if (state === 'closed' || state === 'failed') {
          toast({ variant: 'destructive', title: 'Conexión Perdida', description: 'La sesión de control remoto ha terminado.' });
          onSessionEnd();
      }
  });

  useEffect(() => {
      const timeout = setTimeout(() => {
          if (connectionState === 'connecting') {
              toast({ variant: 'destructive', title: 'Error de Conexión', description: 'No se pudo conectar. Verifica el código e inténtalo de nuevo.' });
              cleanup();
              onSessionEnd();
          }
      }, 10000);

      if (connectionState === 'connected') {
        clearTimeout(timeout);
        publish('requestInitialState', {});
      }

      return () => clearTimeout(timeout);
  }, [connectionState, publish, onSessionEnd, toast, cleanup]);


  const updateAndPublish = (newState: Partial<RemoteControlViewState>) => {
    setRemoteState(prevState => {
      const updatedState = { ...(prevState || initialRemoteState), ...newState };
      publish('updateState', updatedState);
      return updatedState;
    });
  };

  if (connectionState !== 'connected' || !remoteState) {
    return (
        <div className="fixed inset-0 bg-background/80 z-50 flex flex-col items-center justify-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin" />
            <p className="text-muted-foreground">Conectando a la sesión {initialRemoteSessionId}...</p>
            <Button variant="destructive" onClick={onSessionEnd}>Cancelar</Button>
        </div>
    );
  }
  
  return (
    <>
      <div className="fixed inset-0 bg-background z-50 flex flex-col">
        <header className="p-4 border-b border-border flex justify-between items-center flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold">Control Remoto</h1>
            <p className="text-sm text-muted-foreground">Sesión: {initialRemoteSessionId}</p>
          </div>
          <Button variant="destructive" onClick={onSessionEnd}>
            <X className="mr-2 h-4 w-4" /> Terminar
          </Button>
        </header>

        <LayoutConfigurator
            remoteControlMode="controlling"
            order={remoteState.viewOrder.filter(i => remoteState.selectedEvents[i] !== null)}
            onOrderChange={(newOrder) => {
                const fullOrder = [...newOrder];
                const presentIndexes = new Set(newOrder);
                for (let i = 0; i < 9; i++) { if (!presentIndexes.has(i)) fullOrder.push(i); }
                updateAndPublish({ viewOrder: fullOrder });
            }}
            eventDetails={remoteState.selectedEvents}
            onRemove={(index) => {
                const newEvents = [...remoteState.selectedEvents]; newEvents[index] = null;
                updateAndPublish({ selectedEvents: newEvents });
            }}
            onReload={(index) => publish('reload', { index })}
            onModify={(event, index) => setModifyEvent({ event, index })}
            onToggleFullscreen={(index) => {
                const newIndex = remoteState.fullscreenIndex === index ? null : index;
                publish('toggleFullscreen', { index: newIndex });
            }}
            fullscreenIndex={remoteState.fullscreenIndex}
            isViewPage={true}
            onAddEvent={() => setAddEventsOpen(true)}
            gridGap={remoteState.gridGap}
            onGridGapChange={(value) => updateAndPublish({ gridGap: value })}
            borderColor={remoteState.borderColor}
            onBorderColorChange={(value) => updateAndPublish({ borderColor: value })}
            onRestoreGridSettings={() => updateAndPublish({ gridGap: 0, borderColor: '#000000' })}
            isChatEnabled={remoteState.isChatEnabled}
            onIsChatEnabledChange={(value) => updateAndPublish({ isChatEnabled: value })}
            categories={[]}
            onActivateControlledMode={() => {}}
            onSchedule={() => setScheduleOpen(true)}
            onOpenCalendar={()=>{}} onOpenErrors={()=>{}} onOpenTutorial={()=>{}}
            isErrorsOpen={false} isTutorialOpen={false}
            onIsErrorsOpenChange={()=>{}} onIsTutorialOpenChange={()=>{}}
            onNotificationManager={()=>{}}
          />
      </div>
      
      <Dialog open={!!modifyEvent} onOpenChange={(open) => !open && setModifyEvent(null)}>
        {modifyEvent && (
            <EventSelectionDialog
                isOpen={!!modifyEvent}
                onOpenChange={() => setModifyEvent(null)}
                event={modifyEvent.event}
                onSelect={(event, option) => {
                    const newEvents = [...remoteState.selectedEvents];
                    newEvents[modifyEvent.index] = { ...event, selectedOption: option };
                    updateAndPublish({ selectedEvents: newEvents });
                    setModifyEvent(null);
                }}
                isModification={true}
                onRemove={() => {
                    const newEvents = [...remoteState.selectedEvents];
                    newEvents[modifyEvent.index] = null;
                    updateAndPublish({ selectedEvents: newEvents });
                    setModifyEvent(null);
                }}
                isLoading={false} setIsLoading={()=>{}} setEventForDialog={()=>{}}
            />
        )}
      </Dialog>
      
      <Dialog open={addEventsOpen} onOpenChange={setAddEventsOpen}>
        <AddEventsDialog
            open={addEventsOpen}
            onOpenChange={setAddEventsOpen}
            onSelect={(event, option) => {
                const newEvents = [...remoteState.selectedEvents];
                const emptyIndex = newEvents.findIndex(e => e === null);
                if (emptyIndex !== -1) {
                    newEvents[emptyIndex] = { ...event, selectedOption: option };
                    updateAndPublish({ selectedEvents: newEvents });
                } else {
                    toast({ title: "Máximo alcanzado", description: "No se pueden añadir más de 9 eventos."});
                }
                setAddEventsOpen(false);
            }}
            onRemove={(event) => {
                const newEvents = remoteState.selectedEvents.map(se => se?.id === event.id ? null : se);
                updateAndPublish({ selectedEvents: newEvents });
            }}
            selectedEvents={remoteState.selectedEvents}
            allEvents={allEvents}
            allChannels={allChannels}
            onFetchEvents={async () => {}} 
            updateAllEvents={updateAllEvents}
            isFullScreen={false}
            setIsFullScreen={() => {}}
        />
      </Dialog>
      
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <ScheduleManager 
            open={scheduleOpen}
            onOpenChange={setScheduleOpen}
            currentSelection={remoteState.selectedEvents}
            currentOrder={remoteState.viewOrder}
            schedules={remoteState.schedules}
            onSchedulesChange={(newSchedules) => updateAndPublish({ schedules: newSchedules })}
            onModifyEventInView={(event, index) => setModifyEvent({event, index})}
            isLoading={false}
            onAddEvent={() => { setScheduleOpen(false); setAddEventsOpen(true); }}
            initialSelection={remoteState.selectedEvents}
            initialOrder={remoteState.viewOrder}
            setFutureSelection={(s) => updateAndPublish({ selectedEvents: s})}
            setFutureOrder={(o) => updateAndPublish({ viewOrder: o })}
        />
      </Dialog>
    </>
  );
}
