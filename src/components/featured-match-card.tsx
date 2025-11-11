
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

const CountdownTimer = ({ targetDate, className }: { targetDate: number, className?: string }) => {
    const [timeLeft, setTimeLeft] = useState<Countdown>({
        days: 0, hours: 0, minutes: 0, seconds: 0
    });

    useEffect(() => {
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            if (distance < 0) {
                clearInterval(interval);
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds });
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

const SplitVSText = ({ className }: { className?: string }) => {
    return (
        <div className={`relative flex justify-center items-center ${className}`}>
            <div className="absolute left-0 top-0 w-1/2 h-full overflow-hidden">
                <p className="w-[200%] text-center text-primary-foreground font-black">V</p>
            </div>
            <div className="absolute right-0 top-0 w-1/2 h-full overflow-hidden">
                <p className="w-[200%] text-center text-secondary-foreground font-black -ml-[100%]">S</p>
            </div>
            <p className="opacity-0 font-black">VS</p>
        </div>
    );
};

export const FeaturedMatchCard = ({ match, onClick }: { match: APIMatch, onClick: () => void }) => {
    const isMobile = useIsMobile();
    const timeZone = 'America/Argentina/Buenos_Aires';
    const matchDate = new Date(match.date);
    
    const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

    const rawFormattedDate = format(matchDate, "EEEE, d 'de' MMMM 'a las' HH:mm'hs'", { locale: es, timeZone });
    
    const dateParts = rawFormattedDate.split(' ');
    const formattedDate = dateParts.map(part => {
        if (['lunes,', 'martes,', 'miércoles,', 'jueves,', 'viernes,', 'sábado,', 'domingo,', 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'].includes(part.toLowerCase())) {
            return capitalize(part);
        }
        return part;
    }).join(' ');

    const hasTeams = match.teams?.home && match.teams?.away;

    if (isMobile) {
        return (
            <div 
              className="bg-card text-foreground rounded-lg p-3 relative font-sans min-h-[350px] flex flex-col justify-between border border-secondary cursor-pointer overflow-hidden bg-gradient-to-b from-primary from-50% to-secondary to-50%"
              onClick={onClick}
            >
                {/* Top Section (White Background) */}
                <div className="relative z-10 h-1/2 flex flex-col justify-start items-center pt-2">
                    <div className="text-center space-y-1">
                        <p className="font-semibold capitalize text-secondary-foreground">{capitalize(match.category)}</p>
                        <p className="text-xs text-secondary-foreground">Evento Destacado</p>
                    </div>

                    {hasTeams ? (
                        <div className="flex-grow flex flex-col items-center justify-center gap-2 text-center w-full">
                            {match.teams?.home?.badge && (
                                <Image
                                    className="w-16 h-16 object-contain"
                                    src={`https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`}
                                    alt={match.teams.home.name || 'Escudo Local'}
                                    width={64}
                                    height={64}
                                />
                            )}
                            <span className="text-lg font-bold text-secondary-foreground">{match.teams?.home?.name || 'Equipo Local'}</span>
                        </div>
                    ) : (
                        <div className="flex-grow flex items-center justify-center">
                            <p className="text-2xl font-bold text-center text-secondary-foreground">{match.title}</p>
                        </div>
                    )}
                </div>

                {/* Bottom Section (Black Background) */}
                <div className="relative z-10 h-1/2 flex flex-col justify-end items-center pb-2">
                    {hasTeams ? (
                        <div className="flex-grow flex flex-col items-center justify-center gap-2 text-center w-full">
                            {match.teams?.away?.badge && (
                                <Image
                                    className="w-16 h-16 object-contain"
                                    src={`https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`}
                                    alt={match.teams.away.name || 'Escudo Visitante'}
                                    width={64}
                                    height={64}
                                />
                            )}
                            <span className="text-lg font-bold text-primary-foreground">{match.teams?.away?.name || 'Equipo Visitante'}</span>
                        </div>
                    ) : null}
                    
                    <div className="text-center mb-3">
                        <CountdownTimer targetDate={match.date} className="text-primary-foreground" />
                    </div>
                    
                    <p className="text-center text-sm text-primary-foreground">{formattedDate}</p>
                </div>
            </div>
        );
    }
    
    return (
        <div 
          className="bg-card text-foreground rounded-lg p-3 relative font-sans min-h-[320px] sm:min-h-[350px] flex flex-col justify-center border border-secondary cursor-pointer overflow-hidden bg-gradient-to-r from-primary from-50% to-secondary to-50%"
          onClick={onClick}
        >
            <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-2 space-y-1">
                    <p className="font-semibold capitalize text-secondary-foreground">{capitalize(match.category)}</p>
                    <p className="text-xs text-secondary-foreground">Evento Destacado</p>
                </div>
                
                {hasTeams ? (
                     <div className="flex items-center justify-center text-lg sm:text-2xl font-bold my-4 flex-grow">
                        <div className="w-full sm:flex-1 flex flex-col items-center justify-center gap-2 p-3">
                             {match.teams?.home?.badge && (
                               <Image
                                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                                    src={`https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`}
                                    alt={match.teams.home.name || 'Escudo Local'}
                                    width={96}
                                    height={96}
                                    style={{filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))'}}
                                />
                            )}
                            <span className="text-center text-secondary-foreground">{match.teams?.home?.name || 'Equipo Local'}</span>
                        </div>

                        <div className="p-3 text-2xl hidden sm:block">
                           <SplitVSText />
                        </div>

                        <div className="w-full sm:flex-1 flex flex-col items-center justify-center gap-2 p-3">
                            {match.teams?.away?.badge && (
                                <Image
                                    className="w-20 h-20 sm:w-24 sm:h-24 object-contain"
                                    src={`https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`}
                                    alt={match.teams.away.name || 'Escudo Visitante'}
                                    width={96}
                                    height={96}
                                    style={{filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.4))'}}
                                />
                            )}
                            <span className="text-center text-primary-foreground">{match.teams?.away?.name || 'Equipo Visitante'}</span>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-lg sm:text-2xl font-bold my-4 flex-grow">
                        <p className="text-2xl font-bold text-center text-primary-foreground">{match.title}</p>
                    </div>
                )}

                <div className="text-center mb-3">
                     <CountdownTimer targetDate={match.date} className="text-primary-foreground" />
                </div>
                
                 <p className="text-center text-sm text-primary-foreground">{formattedDate}</p>
            </div>
        </div>
    );
};

    