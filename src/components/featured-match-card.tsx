
'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns-tz';

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

const CountdownTimer = ({ targetDate }: { targetDate: number }) => {
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
        <div className="grid grid-cols-4 gap-1 text-center w-full max-w-xs mx-auto">
            {/* Left side (on primary bg) */}
            <div className="col-span-2 grid grid-cols-2 gap-1 text-primary-foreground">
                {renderTimeUnit(timeLeft.days, 'Días')}
                {renderTimeUnit(timeLeft.hours, 'Horas')}
            </div>
            {/* Right side (on secondary bg) */}
            <div className="col-span-2 grid grid-cols-2 gap-1 text-secondary-foreground">
                {renderTimeUnit(timeLeft.minutes, 'Minutos')}
                {renderTimeUnit(timeLeft.seconds, 'Segundos')}
            </div>
        </div>
    );
};

export const FeaturedMatchCard = ({ match, onClick }: { match: APIMatch, onClick: () => void }) => {
    const timeZone = 'America/Argentina/Buenos_Aires';
    const matchDate = new Date(match.date);
    const formattedDate = format(matchDate, 'EEEE, d MMM \'a las\' p', { timeZone });
    
    const backgroundStyle = { background: 'linear-gradient(to right, hsl(var(--primary)) 50%, hsl(var(--secondary)) 50%)' };

    return (
        <div 
          className="bg-card text-foreground rounded-lg p-3 relative font-sans min-h-[320px] sm:min-h-[350px] flex flex-col justify-center border border-secondary cursor-pointer overflow-hidden"
          onClick={onClick}
          style={backgroundStyle}
        >
            <div className="relative z-10 flex flex-col h-full">
                <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 capitalize">
                        <span className="font-semibold text-primary-foreground">{match.category}</span>
                    </div>
                    <Badge variant="outline" className="border-border/50 bg-background/20 backdrop-blur-sm text-primary-foreground">Partido Destacado</Badge>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center text-lg sm:text-2xl font-bold my-4 flex-grow">
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
                        <span className="text-center text-primary-foreground">{match.teams?.home?.name || 'Equipo Local'}</span>
                    </div>

                    <div className="p-3 text-lg text-primary-foreground font-black">VS</div>

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
                        <span className="text-center text-secondary-foreground">{match.teams?.away?.name || 'Equipo Visitante'}</span>
                    </div>
                </div>

                <div className="text-center mb-3">
                    <CountdownTimer targetDate={match.date} />
                </div>
                
                <div className="text-center text-sm relative">
                    <div className="absolute left-0 top-0 w-1/2 h-full flex items-center justify-center text-primary-foreground">
                        <span className="w-full truncate">{formattedDate.split(' a las ')[0]} a las</span>
                    </div>
                     <div className="absolute right-0 top-0 w-1/2 h-full flex items-center justify-center text-secondary-foreground">
                        <span className="w-full truncate">{formattedDate.split(' a las ')[1]}</span>
                    </div>
                    {/* This is for layout spacing, it will be invisible */}
                    <span className="opacity-0">{formattedDate}</span>
                </div>
            </div>
        </div>
    );
};
