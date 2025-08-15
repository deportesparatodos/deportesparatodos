
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
import type { Event } from './event-carousel';
import type { Channel } from './channel-list';
import type { Schedule } from './schedule-manager';
import { HomePageContent } from '@/app/page';

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

// --- ABLY HOOK ---
function useAbly(
    mode: 'controlling' | 'controlled',
    sessionId: string | null,
    onMessage: (message: Ably.Types.Message) => void,
) {
    const ablyRef = useRef<{ client: Ably.Realtime | null; channel: Ably.Types.RealtimeChannelPromise | null }>({ client: null, channel: null });
    const { toast } = useToast();
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    const connect = useCallback(() => {
        if (!sessionId || ablyRef.current.client) return;

        const clientId = `${mode}-${Date.now()}`;
        const client = new Ably.Realtime({ authUrl: `/api/ably?clientId=${clientId}`, autoConnect: true });

        client.connection.on('connected', () => {
            if (!isMounted.current) {
                client.close();
                return;
            }
            const channelName = `remote-control:${sessionId}`;
            const channel = client.channels.get(channelName);
            ablyRef.current = { client, channel };
            channel.subscribe(onMessage);
            if (mode === 'controlling') {
                channel.presence.enter();
                channel.publish('requestInitialState', {});
            }
        });

        client.connection.on('failed', (error) => {
            toast({ variant: 'destructive', title: 'Error de Conexión', description: error.reason.message });
            disconnect();
        });
        
        client.connection.on('closed', () => {
             // Handled by disconnect
        });

        ablyRef.current.client = client;

    }, [sessionId, mode, onMessage, toast]);

    const disconnect = useCallback(() => {
        const { client } = ablyRef.current;
        if (client) {
            client.close();
            ablyRef.current = { client: null, channel: null };
        }
    }, []);

    const publish = useCallback((name: string, data: any) => {
        ablyRef.current.channel?.publish(name, data);
    }, []);

    return { connect, disconnect, publish };
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

    const handleMessage = useCallback((message: Ably.Types.Message) => {
        const { name, data } = message;
        if (name === 'requestInitialState') {
            publish('stateUpdate', viewState);
        } else if (name === 'updateState') {
            setViewState(data);
        } else if (name === 'reload') {
            onReload(data.index);
        } else if (name === 'toggleFullscreen') {
            onToggleFullscreen(data.index);
        }
    }, [viewState, setViewState, onReload, onToggleFullscreen]);
    
    const { connect, disconnect, publish } = useAbly('controlled', sessionId, handleMessage);
    
    useEffect(() => {
        const newCode = Math.floor(1000 + Math.random() * 9000).toString();
        setSessionId(newCode);
        onSessionStart(newCode);
    }, [onSessionStart]);
    
    useEffect(() => {
        if (sessionId) {
            connect();
        }
        return () => disconnect();
    }, [sessionId, connect, disconnect]);

    useEffect(() => {
      publish('stateUpdate', viewState);
    }, [viewState, publish]);
    
    return null;
}

function ControllingView({ initialRemoteSessionId, onSessionEnd, allEvents, allChannels, updateAllEvents }: Extract<RemoteControlManagerProps, { mode: 'controlling' }>) {
  const [remoteState, setRemoteState] = useState<RemoteControlViewState | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);

  const { toast } = useToast();

  const handleMessage = useCallback((message: Ably.Types.Message) => {
      if (message.name === 'stateUpdate') {
          setRemoteState(message.data);
          if(!isConnected) setIsConnected(true);
          if(isConnecting) setIsConnecting(false);
      }
  }, [isConnected, isConnecting]);

  const { connect, disconnect, publish } = useAbly('controlling', initialRemoteSessionId, handleMessage);

  useEffect(() => {
    connect();
    const timer = setTimeout(() => {
        if (isConnecting) {
            toast({ variant: 'destructive', title: 'Error de Conexión', description: 'No se pudo conectar. Verifica el código.' });
            disconnect();
            onSessionEnd();
        }
    }, 10000);

    return () => {
        clearTimeout(timer);
        disconnect();
    };
  }, [connect, disconnect, isConnecting, onSessionEnd, toast]);

  const updateAndPublish = (newState: Partial<RemoteControlViewState>) => {
    setRemoteState(prevState => {
      const updatedState = { ...(prevState || initialRemoteState), ...newState };
      publish('updateState', updatedState);
      return updatedState;
    });
  };

  if (isConnecting || !isConnected || !remoteState) {
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
      <Dialog open={true} onOpenChange={(open) => !open && onSessionEnd()}>
        <DialogContent className="w-full h-full max-w-none sm:max-w-none md:max-w-none lg:max-w-none xl:max-w-none flex flex-col p-0 border-0">
           <DialogHeader className="p-4 border-b border-border flex-row items-center justify-between flex-shrink-0">
            <div>
              <DialogTitle>Control Remoto</DialogTitle>
              <DialogDescription>Sesión: {initialRemoteSessionId}</DialogDescription>
            </div>
            <Button variant="destructive" onClick={onSessionEnd}>
              <X className="mr-2 h-4 w-4" /> Terminar
            </Button>
          </DialogHeader>
          <div className="flex-grow overflow-y-auto">
             <HomePageContent 
                isRemoteControlling={true}
                remoteState={remoteState}
                onRemoteStateChange={updateAndPublish}
                onRemoteReload={(index) => publish('reload', {index})}
                onRemoteToggleFullscreen={(index) => {
                    const newIndex = remoteState.fullscreenIndex === index ? null : index;
                    publish('toggleFullscreen', { index: newIndex });
                }}
                allEvents={allEvents}
                allChannels={allChannels}
             />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

    