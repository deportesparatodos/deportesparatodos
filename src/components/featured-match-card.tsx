
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
    
    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-center">
            <div>
                <div className="text-xl sm:text-3xl font-bold">{timeLeft.days}</div>
                <div className="text-xs text-muted-foreground">Días</div>
            </div>
            <div>
                <div className="text-xl sm:text-3xl font-bold">{timeLeft.hours}</div>
                <div className="text-xs text-muted-foreground">Horas</div>
            </div>
            <div>
                <div className="text-xl sm:text-3xl font-bold">{timeLeft.minutes}</div>
                <div className="text-xs text-muted-foreground">Minutos</div>
            </div>
            <div>
                <div className="text-xl sm:text-3xl font-bold">{timeLeft.seconds}</div>
                <div className="text-xs text-muted-foreground">Segundos</div>
            </div>
        </div>
    );
};

export const FeaturedMatchCard = ({ match, onClick }: { match: APIMatch, onClick: () => void }) => {
    const timeZone = 'America/Argentina/Buenos_Aires';
    const matchDate = new Date(match.date);
    const formattedDate = format(matchDate, 'EEEE, d MMM \'a las\' p', { timeZone });

    return (
        <div 
          className="bg-card text-foreground rounded-lg p-2 sm:p-3 relative font-sans min-h-[300px] sm:min-h-[380px] flex flex-col justify-center border border-secondary cursor-pointer"
          onClick={onClick}
        >
            <Badge className="absolute top-3 right-3">Partido Destacado</Badge>
            <div className="text-center mb-3">
                <div className="flex items-center justify-center gap-2 text-muted-foreground capitalize">
                    <span>{match.category}</span>
                </div>
                <CountdownTimer targetDate={match.date} />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center text-lg sm:text-2xl font-bold my-3">
                <div className="w-full sm:flex-1 flex items-center justify-end gap-4 bg-primary p-3 rounded-md sm:rounded-l-md text-primary-foreground">
                    <span className="text-right">{match.teams?.home?.name || 'Equipo Local'}</span>
                    {match.teams?.home?.badge && (
                       <Image
                            className="w-16 h-16 object-contain"
                            src={`https://streamed.pk/api/images/badge/${match.teams.home.badge}.webp`}
                            alt={match.teams.home.name || 'Escudo Local'}
                            width={64}
                            height={64}
                        />
                    )}
                </div>

                <div className="bg-muted/50 p-3 text-lg text-muted-foreground">VS</div>

                <div className="w-full sm:flex-1 flex items-center gap-4 bg-secondary p-3 rounded-md sm:rounded-r-md text-secondary-foreground">
                    {match.teams?.away?.badge && (
                        <Image
                            className="w-16 h-16 object-contain"
                            src={`https://streamed.pk/api/images/badge/${match.teams.away.badge}.webp`}
                            alt={match.teams.away.name || 'Escudo Visitante'}
                            width={64}
                            height={64}
                        />
                    )}
                    <span>{match.teams?.away?.name || 'Equipo Visitante'}</span>
                </div>
            </div>

            <div className="text-center text-muted-foreground mb-4">
                <span>{formattedDate}</span>
            </div>
        </div>
    );
};

    