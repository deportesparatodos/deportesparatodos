
'use client';

import { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Image from 'next/image';

const AnimatedEllipsis = () => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        if (prev.length >= 3) {
          return '';
        }
        return prev + '.';
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return <span className="w-4 inline-block">{dots}</span>;
};

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center bg-background text-foreground p-4 overflow-hidden">
      <div className="w-full max-w-2xl text-center flex flex-col items-center">
        <div className="w-4/5 max-w-[200px] md:max-w-[300px] mb-6 md:mb-10">
          <Image
            src="https://i.ibb.co/gZKpR4fc/deportes-para-todos.png"
            alt="Deportes Para Todos Logo"
            width={300}
            height={75}
            priority
            data-ai-hint="logo"
            className="mx-auto h-auto w-full"
          />
        </div>

        <div className="space-y-6 md:space-y-8">
          <div className="space-y-2 md:space-y-4">
            <h1 className="text-2xl md:text-3xl font-bold text-primary">¡Bienvenidos a Deportes para Todos!</h1>
            <p className="text-sm md:text-base text-justify text-muted-foreground">
              ¡Te damos la bienvenida! En nuestra plataforma, podes explorar una gran variedad de eventos y canales en vivo. Solo selecciona la cantidad EVENTOS O CANALES QUE QUIERAS (hasta 9 selecciones) y combínalos en una única pantalla para no perderte nada. ¿Necesitas ayuda? Revisa el Tutorial en el el icono de menú <Menu className="inline-block h-4 w-4 align-middle" /> en la esquina superior izquierda del inicio.
            </p>
          </div>
          <div className="space-y-2 md:space-y-4 pt-2 md:pt-4">
            <h2 className="text-xl md:text-3xl font-bold text-primary">¿Qué hacer en caso de errores?</h2>
            <p className="text-sm md:text-base text-justify text-muted-foreground">
              Si durante la carga un video no funciona o ves una pantalla en negro, no te preocupes, suele tener fácil solución. 
              El paso más efectivo es probar con las diferentes opciones de transmisión disponibles para cada evento. 
              Si el problema continúa, te recomendamos consultar nuestra guía detallada de "Errores y Soluciones" 
              que encontras en el menú de ayuda para resolverlo.
            </p>
          </div>
        </div>
      </div>
      
      <div className="absolute bottom-4 right-4 text-base md:text-lg text-primary font-semibold flex items-center">
        Cargando<AnimatedEllipsis />
      </div>
    </div>
  );
}
