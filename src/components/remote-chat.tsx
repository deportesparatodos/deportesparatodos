
'use client';

import { Button } from './ui/button';
import { ArrowLeft } from 'lucide-react';

interface RemoteChatProps {
    onBack: () => void;
}

export function RemoteChat({ onBack }: RemoteChatProps) {
    return (
        <div className="fixed inset-0 bg-background z-[100] flex flex-col">
            <header className="p-4 border-b border-border flex-shrink-0 flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9">
                    <ArrowLeft />
                </Button>
                <h2 className="text-lg font-semibold">Chat en Vivo</h2>
            </header>
            <div className="flex-grow">
                <iframe
                    src="https://organizations.minnit.chat/626811533994618/c/Main?embed"
                    title="Chat en Vivo"
                    className="w-full h-full border-0"
                />
            </div>
        </div>
    );
}
