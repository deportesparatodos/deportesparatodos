import LZString from 'lz-string';
import type { Event } from '@/components/event-carousel';

export interface SharedLayout {
    events: (Event | null)[];
    viewOrder: number[];
    gridGap: number;
    borderColor: string;
    isChatEnabled: boolean;
}

export function encodeLayout(layout: SharedLayout): string {
    const json = JSON.stringify(layout);
    return LZString.compressToEncodedURIComponent(json);
}

export function decodeLayout(encoded: string): SharedLayout | null {
    try {
        const json = LZString.decompressFromEncodedURIComponent(encoded);
        if (!json) return null;
        return JSON.parse(json) as SharedLayout;
    } catch (e) {
        console.error("Failed to decode layout", e);
        return null;
    }
}
