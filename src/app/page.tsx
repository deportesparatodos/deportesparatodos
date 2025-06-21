"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomeMessage } from '@/components/welcome-message';
import { ChannelListComponent, channels } from '@/components/channel-list';
import { CameraConfigurationComponent } from '@/components/camera-configuration';
import Image from 'next/image';

export default function HomePage() {
  const [numCameras, setNumCameras] = useState<number>(1);
  const [cameraUrls, setCameraUrls] = useState<string[]>(Array(4).fill(''));
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const storedUrls = localStorage.getItem('cameraUrls');
    const storedNumCameras = localStorage.getItem('numCameras');
    if (storedUrls) {
      setCameraUrls(JSON.parse(storedUrls));
    }
    if (storedNumCameras) {
      setNumCameras(parseInt(storedNumCameras, 10));
    }
  }, []);

  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('cameraUrls', JSON.stringify(cameraUrls));
      localStorage.setItem('numCameras', numCameras.toString());
    }
  }, [cameraUrls, numCameras, isMounted]);

  const handleStartView = () => {
    setErrorMessage('');
    const activeUrls = cameraUrls.slice(0, numCameras);
    const allUrlsFilled = activeUrls.every(url => url && url.trim() !== '');

    if (!allUrlsFilled) {
      setErrorMessage(`Por favor, ingrese las URLs para ${numCameras === 1 ? 'la vista seleccionada' : `las ${numCameras} vistas seleccionadas`}.`);
      return;
    }

    const queryParams = new URLSearchParams();
    activeUrls.forEach(url => queryParams.append('urls', encodeURIComponent(url)));
    router.push(`/view?${queryParams.toString()}`);
  };
  
  if (!isMounted) {
    return null; 
  }

  const areUrlsComplete = cameraUrls.slice(0, numCameras).every(url => url && url.trim() !== '');

  return (
    <div className="flex h-screen w-screen bg-background text-foreground">
      {/* Left Column (1/3) */}
      <div className="w-1/3 flex flex-col border-r border-border">
        <ChannelListComponent />
      </div>

      {/* Middle Column (1/3) */}
      <div className="w-1/3 flex flex-col items-center p-4 overflow-y-auto">
        <WelcomeMessage areUrlsComplete={areUrlsComplete} />
        <div className="w-full max-w-lg mt-4">
          <CameraConfigurationComponent
            numCameras={numCameras}
            setNumCameras={setNumCameras}
            cameraUrls={cameraUrls}
            setCameraUrls={setCameraUrls}
            errorMessage={errorMessage}
            setErrorMessage={setErrorMessage}
            handleStartView={handleStartView}
            channels={channels}
          />
        </div>
      </div>

      {/* Right Column (1/3) */}
      <div className="w-1/3 border-l border-border">
        <iframe 
          src="https://bleacherreport.com" 
          title="Bleacher Report"
          className="w-full h-full border-0"
          sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
        />
      </div>
    </div>
  );
}
