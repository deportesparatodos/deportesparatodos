
'use client';

import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export default function EventListPage() {
  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 border-b border-border flex justify-between items-center sticky top-0 bg-background z-10">
        <h1 className="text-xl font-semibold text-primary">Lista de Eventos</h1>
        <Link href="/" passHref legacyBehavior>
          <Button variant="outline" size="sm">
            <XCircle className="mr-2 h-4 w-4" /> Cerrar Eventos
          </Button>
        </Link>
      </header>
      <main className="flex-grow">
        <iframe
          src="https://agenda-dpt.vercel.app"
          title="Lista de Eventos"
          className="w-full h-full border-0"
        />
      </main>
    </div>
  );
}
