

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
      onModeChange: (mode: 'controlling' | 'controlled') => void;
      onStartControlling: (code: string) => void;
      onActivateControlledMode: () => void;
      remoteSessionId: string | null;
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


export function RemoteControlManager(props: RemoteControlManagerProps) {
  const { toast } = useToast();
  const ablyRef = useRef<{ client: Ably.Realtime | null; channel: Ably.Types.RealtimeChannelPromise | null }>({ client: null, channel: null });

  const cleanupAbly = useCallback(() => {
    const { client, channel } = ablyRef.current;
    if (channel) channel.detach();
    if (client && client.connection.state === 'connected') client.close();
    ablyRef.current = { client: null, channel: null };
  }, []);

  useEffect(() => {
    return () => cleanupAbly();
  }, [cleanupAbly]);

  if (props.mode === 'inactive') {
    return <InactiveView {...props} />;
  }
  if (props.mode === 'controlling') {
    return <ControllingView {...props} ablyRef={ablyRef} cleanupAbly={cleanupAbly} />;
  }
  if (props.mode === 'controlled') {
    return <ControlledView {...props} ablyRef={ablyRef} cleanupAbly={cleanupAbly} />;
  }

  return null;
}

function InactiveView({ onActivateControlledMode, onStartControlling, remoteSessionId }: Extract<RemoteControlManagerProps, { mode: 'inactive' }>) {
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

      {dialogView === 'main' && (
        <div className="space-y-4 py-4">
          {remoteSessionId ? (
              <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Sesión de control activa. Código:</p>
                  <div className="p-3 bg-muted rounded-lg">
                      <p className="text-3xl font-bold tracking-widest text-primary">
                          {remoteSessionId}
                      </p>
                  </div>
              </div>
          ) : (
            <>
              <Button onClick={onActivateControlledMode} size="lg" className="w-full">Ser Controlado</Button>
              <Button onClick={() => setDialogView('controlling')} variant="outline" size="lg" className="w-full">Controlar Otro Dispositivo</Button>
            </>
          )}
        </div>
      )}
      
      {dialogView === 'controlling' && (
        <>
          <div className="grid gap-4 py-4">
            <Input
              placeholder="1234"
              value={code}
              onChange={(e) => setCode(e.target.value.trim())}
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

function ControlledView({ ablyRef, cleanupAbly, ...props }: Extract<RemoteControlManagerProps, { mode: 'controlled' }> & { ablyRef: any, cleanupAbly: () => void }) {
    useEffect(() => {
        let isMounted = true;
        const startSession = async () => {
            const client = new Ably.Realtime({ authUrl: `/api/ably?clientId=controlled-${Date.now()}` });
            await client.connection.once('connected');
            
            if (!isMounted) {
                client.close();
                return;
            }

            const newCode = Math.floor(1000 + Math.random() * 9000).toString();
            const channel = client.channels.get(`remote-control:${newCode}`);
            
            ablyRef.current = { client, channel };
            props.onSessionStart(newCode);

            channel.subscribe('control-action', (message: Ably.Types.Message) => {
                const { action, payload } = message.data;
                if (action === 'requestInitialState') {
                    channel.publish('control-action', { action: 'initialState', payload: props.viewState });
                }
                if (action === 'updateState') {
                    props.setViewState(payload);
                }
                 if (action === 'reload') {
                    props.onReload(payload.index);
                }
                 if (action === 'toggleFullscreen') {
                    props.onToggleFullscreen(payload.index);
                }
            });

            channel.presence.subscribe('leave', () => {
                props.onSessionEnd();
            });
        };

        startSession();

        return () => {
            isMounted = false;
            props.onSessionEnd();
            cleanupAbly();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return null; // This component has no UI, it only manages the connection
}


function ControllingView({ ablyRef, cleanupAbly, ...props }: Extract<RemoteControlManagerProps, { mode: 'controlling' }> & { ablyRef: any, cleanupAbly: () => void }) {
  const [remoteState, setRemoteState] = useState<RemoteControlViewState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSessionEnded, setIsSessionEnded] = useState(false);
  const [addEventsOpen, setAddEventsOpen] = useState(false);
  const [scheduleManagerOpen, setScheduleManagerOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [modifyEvent, setModifyEvent] = useState<{ event: Event, index: number } | null>(null);
  const { toast } = useToast();

  const publishAction = useCallback((action: string, payload: any) => {
    const { channel } = ablyRef.current;
    if (channel) {
      channel.publish('control-action', { action, payload });
    }
  }, [ablyRef]);

  useEffect(() => {
    let isMounted = true;
    let connectionTimeout: NodeJS.Timeout;

    const connectAndSync = async () => {
        if (!props.initialRemoteSessionId) {
            toast({ variant: "destructive", title: "Error", description: "No se proporcionó un código de sesión." });
            props.onSessionEnd();
            return;
        }

        try {
            const client = new Ably.Realtime({ authUrl: `/api/ably?clientId=controlling-${Date.now()}` });
            await client.connection.once('connected');
            if (!isMounted) { client.close(); return; }

            const channel = client.channels.get(`remote-control:${props.initialRemoteSessionId}`);
            ablyRef.current = { client, channel };

            connectionTimeout = setTimeout(() => {
                if (isLoading) {
                    toast({ variant: 'destructive', title: 'Error de Conexión', description: 'No se pudo conectar. Verifica el código e inténtalo de nuevo.' });
                    props.onSessionEnd();
                }
            }, 10000);

            channel.subscribe('control-action', (message: Ably.Types.Message) => {
                if (message.data.action === 'initialState') {
                    clearTimeout(connectionTimeout);
                    setRemoteState(message.data.payload);
                    setIsLoading(false);
                }
            });
            
            await channel.presence.enter();
            await channel.whenState('attached');
            publishAction('requestInitialState', {});

        } catch (error) {
            console.error(error);
            clearTimeout(connectionTimeout);
            toast({ variant: 'destructive', title: 'Error de Conexión', description: 'No se pudo iniciar la conexión con Ably.' });
            props.onSessionEnd();
        }
    };
    
    connectAndSync();

    return () => {
        isMounted = false;
        clearTimeout(connectionTimeout);
        cleanupAbly();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.initialRemoteSessionId]);

  const updateAndPublish = (newState: Partial<RemoteControlViewState>) => {
    setRemoteState(prevState => {
      const updatedState = { ...(prevState || initialRemoteState), ...newState };
      publishAction('updateState', updatedState);
      return updatedState;
    });
  };

  if (isLoading) return <div className="fixed inset-0 bg-background/80 z-50 flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin" /></div>;

  if (!remoteState) return <div className="fixed inset-0 bg-background z-50 p-4 text-center flex flex-col justify-center items-center"><p className='text-destructive'>No se pudo cargar el estado remoto.</p><Button onClick={props.onSessionEnd} className='mt-4'>Cerrar</Button></div>;

  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <header className="p-4 border-b border-border flex justify-between items-center">
        <div>
          <h1 className="text-lg font-bold">Control Remoto</h1>
          <p className="text-sm text-muted-foreground">Sesión: {props.initialRemoteSessionId}</p>
        </div>
        <Button variant="destructive" onClick={props.onSessionEnd}>
          <X className="mr-2 h-4 w-4" /> Terminar
        </Button>
      </header>

      <div className="flex-grow overflow-y-auto p-4">
        <LayoutConfigurator
          remoteControlMode="controlling"
          order={remoteState.viewOrder.filter(i => remoteState.selectedEvents[i] !== null)}
          onOrderChange={(newOrder) => {
              const fullOrder = [...newOrder];
              const presentIndexes = new Set(newOrder);
              for (let i = 0; i < 9; i++) {
                if (!presentIndexes.has(i)) {
                  fullOrder.push(i);
                }
              }
              updateAndPublish({ viewOrder: fullOrder });
          }}
          eventDetails={remoteState.selectedEvents}
          onRemove={(index) => {
              const newEvents = [...remoteState.selectedEvents];
              newEvents[index] = null;
              updateAndPublish({ selectedEvents: newEvents });
          }}
          onReload={(index) => publishAction('reload', { index })}
          onModify={(event, index) => setModifyEvent({ event, index })}
          onToggleFullscreen={(index) => {
              const newIndex = remoteState.fullscreenIndex === index ? null : index;
              updateAndPublish({ fullscreenIndex: newIndex });
          }}
          fullscreenIndex={remoteState.fullscreenIndex}
          isViewPage={true}
          onAddEvent={() => setAddEventsOpen(true)}
          onSchedule={() => setScheduleManagerOpen(true)}
          gridGap={remoteState.gridGap}
          onGridGapChange={(value) => updateAndPublish({ gridGap: value })}
          borderColor={remoteState.borderColor}
          onBorderColorChange={(value) => updateAndPublish({ borderColor: value })}
          onRestoreGridSettings={() => updateAndPublish({ gridGap: 0, borderColor: '#000000'})}
          isChatEnabled={remoteState.isChatEnabled}
          onIsChatEnabledChange={(value) => updateAndPublish({ isChatEnabled: value })}
          categories={[]}
        />
      </div>

      {modifyEvent && (
        <Dialog open={!!modifyEvent} onOpenChange={() => setModifyEvent(null)}>
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
                onRemove={()=>{}}
                isLoading={false}
                setIsLoading={()=>{}}
                setEventForDialog={()=>{}}
            />
        </Dialog>
      )}

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
        allEvents={props.allEvents}
        allChannels={props.allChannels}
        onFetchEvents={async () => {}}
        updateAllEvents={props.updateAllEvents}
        isFullScreen={isFullScreen}
        setIsFullScreen={setIsFullScreen}
      />

       <ScheduleManager 
          open={scheduleManagerOpen}
          onOpenChange={setScheduleManagerOpen}
          currentSelection={remoteState.selectedEvents}
          currentOrder={remoteState.viewOrder}
          schedules={remoteState.schedules}
          onSchedulesChange={(newSchedules) => updateAndPublish({ schedules: newSchedules })}
          onModifyEventInView={(event, index) => setModifyEvent({ event, index })}
          isLoading={false}
          onAddEvent={() => setAddEventsOpen(true)}
          initialSelection={remoteState.selectedEvents}
          initialOrder={remoteState.viewOrder}
          setFutureSelection={(s) => updateAndPublish({ selectedEvents: s})}
          setFutureOrder={(o) => updateAndPublish({ viewOrder: o })}
        />

        <Dialog open={isSessionEnded} onOpenChange={props.onSessionEnd}>
             <DialogContent>
                <DialogHeader>
                    <DialogTitle>Sesión Terminada</DialogTitle>
                    <DialogDescription>La sesión en el otro dispositivo ha finalizado.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DialogClose asChild><Button onClick={props.onSessionEnd}>Cerrar</Button></DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
}
