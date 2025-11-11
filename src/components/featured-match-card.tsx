

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { format } from 'date-fns-tz';
import { es } from 'date-fns/locale';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { cn } from '@/lib/utils';


export interface APIMatch {
    id: string;
    title: string;
    category: string;
    date: number;
    poster?: string;
    popular: boolean;
    teams?: {
        home?: { name: string; badge: string };
        away?: { name: string; badge: string };
    };
    sources: { source: string; id: string }[];
}

interface Countdown {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

const CountdownTimer = ({ targetDate, className, isMobile }: { targetDate: number, className?: string, isMobile: boolean }) => {
    const [timeLeft, setTimeLeft] = useState<Countdown>({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });

    useEffect(() => {
        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                return { days: 0, hours: 0, minutes: 0, seconds: 0 };
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            return { days, hours, minutes, seconds };
        };

        setTimeLeft(calculateTimeLeft());

        const interval = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(interval);
    }, [targetDate]);

    const renderTimeUnit = (value: number, label: string) => (
        <div>
            <div className="text-2xl sm:text-3xl font-bold">{String(value).padStart(2, '0')}</div>
            <div className="text-xs">{label}</div>
        </div>
    );
    
    return (
        <div className={cn("grid grid-cols-4 gap-1 text-center w-full max-w-xs mx-auto", className)}>
            {renderTimeUnit(timeLeft.days, 'Días')}
            {renderTimeUnit(timeLeft.hours, 'Horas')}
            {renderTimeUnit(timeLeft.minutes, 'Minutos')}
            {renderTimeUnit(timeLeft.seconds, 'Segundos')}
        </div>
    );
};

export const FeaturedMatchCard = ({ match, onClick, color = '#000000' }: { match: APIMatch, onClick: () => void, color: string }) => {
    const isMobile = useIsMobile();
    const timeZone = 'America/Argentina/Buenos_Aires';
    const matchDate = new Date(match.date);
    
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const rawFormattedDate = format(matchDate, "EEEE, d 'de' MMMM 'a las' HH:mm'hs'", { locale: es, timeZone });
    
    const dateParts = rawFormattedDate.split(' ');
    const formattedDate = dateParts.map(part => {
        const lowerPart = part.toLowerCase();
        // The comma is important for days of the week
        if (['lunes,', 'martes,', 'miércoles,', 'jueves,', 'viernes,', 'sábado,', 'domingo,'].includes(lowerPart)) {
            return capitalize(part);
        }
        if (['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'].includes(lowerPart)) {
             return capitalize(part);
        }
        return part;
    }).join(' ');

    const hasTeams = match.teams?.home && match.teams?.away;
    
    const backgroundStyle = {
      background: `linear-gradient(to top right, white 50%, ${color} 50%)`,
    };

    if (isMobile) {
        return (
            <div 
              className="bg-card rounded-lg p-4 relative font-sans min-h-[350px] flex flex-col justify-between border border-secondary cursor-pointer overflow-hidden"
              style={{ background: `linear-gradient(to top right, ${color} 50%, white 50.5%)` }}
              onClick={onClick}
            >
                <div className="relative z-10 text-center -mt-1">
                    <p className="font-semibold capitalize text-black">{capitalize(match.category)}</p>
                    <p className="text-xs text-black">Evento Destacado</p>
                </div>
                
                {hasTeams ? (
                    <div className="relative flex-grow flex flex-col items-center justify-center text-lg font-bold text-black gap-2">
                        {/* Home Team */}
                        <div className="flex flex-col items-center justify-center gap-1 text-center">
                             {match.teams?.home?.badge && (
                               <Image
                                    className="w-16 h-16 object-contain drop-shadow-2xl"
                                    src={`https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`}
                                    alt={match.teams.home.name || 'Escudo Local'}
                                    width={64}
                                    height={64}
                                />
                            )}
                            <span className="text-center text-black">{match.teams?.home?.name || 'Equipo Local'}</span>
                        </div>

                        {/* VS */}
                        <div className="text-4xl font-black text-black">
                            VS
                        </div>
                        
                        {/* Away Team */}
                        <div className="flex flex-col items-center justify-center gap-1 text-center">
                            {match.teams?.away?.badge && (
                                <Image
                                    className="w-16 h-16 object-contain drop-shadow-2xl"
                                    src={`https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`}
                                    alt={match.teams.away.name || 'Escudo Visitante'}
                                    width={64}
                                    height={64}
                                />
                            )}
                            <span className="text-center text-black">{match.teams?.away?.name || 'Equipo Visitante'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex-grow flex items-center justify-center">
                         <p className="text-2xl font-bold text-center text-black">{match.title}</p>
                    </div>
                )}
                
                <div className="relative z-10 text-center mt-3">
                     <CountdownTimer targetDate={match.date} className="text-black" isMobile={isMobile}/>
                     <p className="text-center text-sm mt-2 text-black">{formattedDate}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div 
          className="bg-card rounded-lg p-4 relative font-sans min-h-[320px] sm:min-h-[350px] flex flex-col justify-center border border-secondary cursor-pointer overflow-hidden"
          style={{ background: `linear-gradient(to top right, white 50%, ${color} 50%)` }}
          onClick={onClick}
        >
            {/* Top titles */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-full text-center z-10">
                <p className="font-semibold capitalize text-black">{capitalize(match.category)}</p>
                <p className="text-xs text-black">Evento Destacado</p>
            </div>

            {hasTeams ? (
                <div className="relative flex items-center justify-center flex-grow text-black">
                    {/* Home Team */}
                    <div className="w-full sm:flex-1 flex flex-col items-center justify-center gap-2 p-3">
                         {match.teams?.home?.badge && (
                           <Image
                                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-2xl"
                                src={`https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`}
                                alt={match.teams.home.name || 'Escudo Local'}
                                width={96}
                                height={96}
                            />
                        )}
                        <span className="text-lg sm:text-2xl font-bold text-center text-black">{match.teams?.home?.name || 'Equipo Local'}</span>
                    </div>

                    {/* VS centered */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl font-black text-black z-20">
                       VS
                    </div>

                    {/* Away Team */}
                    <div className="w-full sm:flex-1 flex flex-col items-center justify-center gap-2 p-3">
                        {match.teams?.away?.badge && (
                            <Image
                                className="w-20 h-20 sm:w-24 sm:h-24 object-contain drop-shadow-2xl"
                                src={`https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`}
                                alt={match.teams.away.name || 'Escudo Visitante'}
                                width={96}
                                height={96}
                            />
                        )}
                        <span className="text-lg sm:text-2xl font-bold text-center text-black">{match.teams?.away?.name || 'Equipo Visitante'}</span>
                    </div>
                </div>
            ) : (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-2xl font-bold text-center text-black">{match.title}</p>
                </div>
            )}
            
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-full z-10 text-center space-y-1">
                 <CountdownTimer targetDate={match.date} className="text-black" isMobile={isMobile}/>
                 <p className="text-center text-sm text-black">{formattedDate}</p>
            </div>
        </div>
    );
};
