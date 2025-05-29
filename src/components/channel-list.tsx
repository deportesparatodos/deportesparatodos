"use client";

import { useState } from 'react';
import type { FC } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Copy, CheckCircle2 } from "lucide-react";

interface Channel {
  name: string;
  url: string;
}

const channels: Channel[] = [
  { name: "Sports Stream 1 (Example)", url: "https://playertest.longtailvideo.com/adaptive/bipbop/gear4/prog_index.m3u8" },
  { name: "Nature Vid (Example)", url: "https://playertest.longtailvideo.com/adaptive/oceans_aes/oceans_aes.m3u8" },
  { name: "Another Stream (Example)", url: "https://cph-p2p-msl.akamaized.net/hls/live/2000341/test/master.m3u8" },
];

interface CopiedStates {
  [key: string]: boolean;
}

export const ChannelListComponent: FC = () => {
  const { toast } = useToast();
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});

  const handleCopy = async (url: string, channelName: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({
        title: "Copied to clipboard!",
        description: `${channelName}'s link is ready to be pasted.`,
      });
      setCopiedStates(prev => ({ ...prev, [url]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [url]: false }));
      }, 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
      console.error("Failed to copy: ", err);
    }
  };

  return (
    <Card className="mb-6 shadow-lg">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-primary">Channel List</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {channels.map((channel) => (
            <li key={channel.url} className="flex items-center justify-between p-3 bg-secondary/50 rounded-md">
              <span className="text-foreground">{channel.name}</span>
              <Button
                variant={copiedStates[channel.url] ? "default" : "outline"}
                size="sm"
                onClick={() => handleCopy(channel.url, channel.name)}
                className={`transition-colors duration-300 ${copiedStates[channel.url] ? 'bg-green-500 hover:bg-green-600 text-white' : ''}`}
              >
                {copiedStates[channel.url] ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                {copiedStates[channel.url] ? "Copied!" : "Copy Link"}
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};
