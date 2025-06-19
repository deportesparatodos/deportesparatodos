
"use client";

import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import Image from 'next/image'; // Importar Next Image
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, ListVideo, List, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Channel {
  name: string;
  url: string;
  logoUrl?: string;
}

const EVENT_LIST_URL = "https://agendadeportiva-alpha.vercel.app/";

const getAiHintForChannel = (channelName: string): string => {
  const words = channelName.replace(/[^\w\s]/gi, '').split(' ').filter(Boolean);
  if (words.length === 0) return "logo";
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[1]}`.substring(0, 50);
};

const channelsData: Channel[] = [
    { name: 'A24', url: 'https://www.youtube.com/embed/QGpHLgRnrx4?si=NBFgu_PSRDMaOdr1', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8yfXBuQmon9WVy3ETX9fuq0w4U8Hvq391YA&s' },
    { name: 'ATV', url: 'https://elcanaldeportivo.com/atv.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/ATV_logo_2020.png' },
    { name: 'AZTECA 7', url: 'https://elcanaldeportivo.com/azteca7.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Logo_Azteca_7_2011.svg/1930px-Logo_Azteca_7_2011.svg.png' },
    { name: 'Adult Swim', url: 'https://tvlibreonline.org/html/fl/?get=QWR1bHRfU3dpbQ==', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Adult_Swim_2003_logo.svg/2560px-Adult_Swim_2003_logo.svg.png' },
    { name: 'Animal Planet', url: 'https://tvlibreonline.org/html/fl/?get=QW5pbWFsUGxhbmV0', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/2018_Animal_Planet_logo.svg' },
    { name: 'Azteca Deportes MX', url: 'https://streamtpglobal.com/global1.php?stream=azteca_deportes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Aztecadeporteslogo.png/500px-Aztecadeporteslogo.png' },
    { name: 'C5N', url: 'https://www.youtube.com/embed/jTDk5CswBVk?si=1j2k7zbPW2d1wPRs', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/C5N_Logo_2015.PNG/640px-C5N_Logo_2015.PNG' },
    { name: 'CRONICA', url: 'https://www.youtube.com/embed/avly0uwZzOE?si=QoqQYotYxpJxAZyO', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Crónica_TV_logotipo_%282016%29.png' },
    { name: 'Caliente TV', url: 'https://streamtpglobal.com/global1.php?stream=calientetvmx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Caliente_TV_Logo.png' },
    { name: 'Canal 11 PT', url: 'https://streamtpglobal.com/global1.php?stream=canal11_pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Logo_Canal_11_FPF.svg/1053px-Logo_Canal_11_FPF.svg.png' },
    { name: 'Canal 5 MX', url: 'https://streamtpglobal.com/global1.php?stream=canal5mx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Canal_5_Mexico_logo_2014.svg' },
    { name: 'Caracol TV', url: 'https://streamtpglobal.com/global1.php?stream=caracoltv', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Logotipo_de_Caracol_Televisi%C3%B3n_Corporativo.png' },
    { name: 'Comedy Central', url: 'https://tvlibreonline.org/html/fl/?get=Q29tZWR5Q2VudHJhbA', logoUrl: 'https://1000marcas.net/wp-content/uploads/2022/01/Comedy-Central-Productions-Logo.png' },
    { name: 'DAZN 1 ES', url: 'https://streamtpglobal.com/global1.php?stream=dazn1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/DAZN_1_Logo.svg' },
    { name: 'DAZN 2 ES', url: 'https://streamtpglobal.com/global1.php?stream=dazn2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/DAZN_2.svg/2560px-DAZN_2.svg.png' },
    { name: 'DAZN F1', url: 'https://elcanaldeportivo.com/daznf1.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/70/DAZN_F1_logo.png' },
    { name: 'DAZN LaLiga', url: 'https://streamtpglobal.com/global1.php?stream=dazn_laliga', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDZqHtFwkPR8CyxP8MPc2_El0YqtCFF4zzng&s' },
    { name: 'Dsports', url: 'https://streamtpglobal.com/global1.php?stream=dsports', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DSports.png' },
    { name: 'Dsports +', url: 'https://streamtpglobal.com/global1.php?stream=dsportsplus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DSports.png' },
    { name: 'Dsports 2', url: 'https://streamtpglobal.com/global1.php?stream=dsports2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/83/DSports2.png' },
    { name: 'ESPN 1', url: 'https://streamtpglobal.com/global1.php?stream=espn', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png' },
    { name: 'ESPN 1 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn1br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Logo_espnbrasil.png' },
    { name: 'ESPN 1 NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png' },
    { name: 'ESPN 2', url: 'https://streamtpglobal.com/global1.php?stream=espn2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/1280px-ESPN2_logo.svg.png' },
    { name: 'ESPN 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn2br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/1280px-ESPN2_logo.svg.png' },
    { name: 'ESPN 2 MX', url: 'https://streamtpglobal.com/global1.php?stream=espn2mx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/1280px-ESPN2_logo.svg.png' },
    { name: 'ESPN 2 NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/1280px-ESPN2_logo.svg.png' },
    { name: 'ESPN 3', url: 'https://streamtpglobal.com/global1.php?stream=espn3', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/ESPN3_Logo.png' },
    { name: 'ESPN 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn3br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/ESPN3_Logo.png' },
    { name: 'ESPN 3 MX', url: 'https://streamtpglobal.com/global1.php?stream=espn3mx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/ESPN3_Logo.png' },
    { name: 'ESPN 3 NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl3', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/ESPN3_Logo.png' },
    { name: 'ESPN 4', url: 'https://streamtpglobal.com/global1.php?stream=espn4', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/ESPN_4_logo.svg/2560px-ESPN_4_logo.svg.png' },
    { name: 'ESPN 4 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn4br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/ESPN_4_logo.svg/2560px-ESPN_4_logo.svg.png' },
    { name: 'ESPN 5', url: 'https://streamtpglobal.com/global1.php?stream=espn5', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/ESPN_5_logo.png' },
    { name: 'ESPN 6', url: 'https://streamtpglobal.com/global1.php?stream=espn6', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/69/ESPN_6_logo.png' },
    { name: 'ESPN 7', url: 'https://streamtpglobal.com/global1.php?stream=espn7', logoUrl: 'https://i.pinimg.com/originals/8b/0c/f5/8b0cf58c20955810b857c0ef70933180.png' },
    { name: 'ESPN ARGENTINA', url: 'https://streamtpglobal.com/global1.php?stream=eventos8', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/ESPN_Premium_logo.svg/1200px-ESPN_Premium_logo.svg.png' },
    { name: 'ESPN Deportes USA', url: 'https://streamtpglobal.com/global1.php?stream=espndeportes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e4/ESPN_Deportes.svg' },
    { name: 'ESPN MX', url: 'https://streamtpglobal.com/global1.php?stream=espnmx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/ESPN_wordmark.svg/1200px-ESPN_wordmark.svg.png' },
    { name: 'ESPN Premium Argentina', url: 'https://streamtpglobal.com/global1.php?stream=espnpremium', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a4/ESPN_Premium_logo.svg' },
    { name: 'El canal del Futbol', url: 'https://elcanaldeportivo.com/ecfutbol.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/El_Canal_del_F%C3%BAtbol.png' },
    { name: 'Eleven Sports 1 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven1_pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/pt/e/e1/Eleven_Sports_1_logo.jpg' },
    { name: 'Eleven Sports 2 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven2_pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/b1/ElevenSports2.png' },
    { name: 'Eleven Sports 3 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven3_pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/ElevenSports3.png' },
    { name: 'Eleven Sports 4 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven4_pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a5/ElevenSports4.png' },
    { name: 'Eleven Sports 5 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven5_pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/ElevenSports5.png' },
    { name: 'Eurosport 1', url: 'https://elcanaldeportivo.com/eurosports1.php', logoUrl: 'https://brandfetch.io/_next/image?url=https%3A%2F%2Fasset.brandfetch.io%2FidT80w0W91%2FidJG6gECsg.svg&w=1920&q=75' },
    { name: 'Eurosport 2', url: 'https://elcanaldeportivo.com/eurosports2.php', logoUrl: 'https://logosandtypes.com/wp-content/uploads/2021/07/Eurosport.png' },
    { name: 'FUTV (EV)', url: 'https://streamtpglobal.com/global1.php?stream=futv', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Logo_de_FUTV.svg/1200px-Logo_de_FUTV.svg.png' },
    { name: 'Flow Music', url: 'https://tvlibreonline.org/html/fl/?get=Rmxvd19NdXNpY19YUA==', logoUrl: 'https://www.shutterstock.com/image-vector/flow-music-logotype-brand-logo-design-2348821693' },
    { name: 'Fox Deportes TUBI', url: 'https://streamtpglobal.com/global1.php?stream=tubitv1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/FOX_Deportes_logo.png/800px-FOX_Deportes_logo.png' },
    { name: 'Fox Deportes USA', url: 'https://streamtpglobal.com/global1.php?stream=fox_deportes_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/FOX_Deportes_logo.png/800px-FOX_Deportes_logo.png' },
    { name: 'Fox Sports 1 (Argentina)', url: 'https://streamtpglobal.com/global1.php?stream=fox1ar', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/2a/Logo_Fox_Sports_Argentina_2023.png' },
    { name: 'Fox Sports 1 MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsportsmx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/91/Fox_sports_premium_mx.png' },
    { name: 'Fox Sports 1 USA', url: 'https://streamtpglobal.com/global1.php?stream=fox_1_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Fox_Sports_1_logo.svg/1200px-Fox_Sports_1_logo.svg.png' },
    { name: 'Fox Sports 2 (Argentina)', url: 'https://streamtpglobal.com/global1.php?stream=fox2ar', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_Fox_Sports_2_Argentina_2023.png' },
    { name: 'Fox Sports 2 MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsports2mx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Fox_sports_2_mx.png/800px-Fox_sports_2_mx.png' },
    { name: 'Fox Sports 2 USA', url: 'https://streamtpglobal.com/global1.php?stream=fox_2_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Fox_Sports_2_Logo_2022.png/1200px-Fox_Sports_2_Logo_2022.png' },
    { name: 'Fox Sports 3 (Argentina)', url: 'https://streamtpglobal.com/global1.php?stream=fox3ar', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/27/Logo_Fox_Sports_3_Argentina_2023.png' },
    { name: 'Fox Sports 3 MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsports3mx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Fox_sports_2_mx.png/800px-Fox_sports_2_mx.png' },
    { name: 'Fox Sports Premium', url: 'https://streamtpglobal.com/global1.php?stream=foxsportspremium', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ab/Fox_Sports_Logos_%28Basico%2C_Premium%2C_HD%29.png' },
    { name: 'Garage TV', url: 'https://tvlibreonline.org/html/fl/?get=RWxfR2FyYWdl', logoUrl: 'https://forounivers.com/uploads/monthly_2020_07/GarageTV.png.a037caf09ae5334c450a876966113140.png' },
    { name: 'GolPeru', url: 'https://streamtpglobal.com/global1.php?stream=golperu', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Logo-golperu-1.png/800px-Logo-golperu-1.png' },
    { name: 'GolTV', url: 'https://streamtpglobal.com/global1.php?stream=goltv', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/7/77/GOLTV.png/220px-GOLTV.png' },
    { name: 'Gran Hermano CAM 1', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam1', logoUrl: 'https://i.pinimg.com/736x/07/2a/3b/072a3b87f6c39d962c9155a8452e08a6.jpg' },
    { name: 'Gran Hermano CAM 2', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam2', logoUrl: 'https://i.pinimg.com/736x/07/2a/3b/072a3b87f6c39d962c9155a8452e08a6.jpg' },
    { name: 'Gran Hermano CAM 3', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam3', logoUrl: 'https://i.pinimg.com/736x/07/2a/3b/072a3b87f6c39d962c9155a8452e08a6.jpg' },
    { name: 'Gran Hermano CAM 24H', url: 'https://streamtpglobal.com/global1.php?stream=granhermanocamara24horas', logoUrl: 'https://i.pinimg.com/736x/07/2a/3b/072a3b87f6c39d962c9155a8452e08a6.jpg' },
    { name: 'Gran Hermano MultiCAM', url: 'https://streamtpglobal.com/global1.php?stream=granhermanomulticam', logoUrl: 'https://i.pinimg.com/736x/07/2a/3b/072a3b87f6c39d962c9155a8452e08a6.jpg' },
    { name: 'HI! Sports MX', url: 'https://streamtpglobal.com/global1.php?stream=hisports', logoUrl: 'https://placehold.co/24x24.png' },
    { name: 'History 1', url: 'https://tvlibreonline.org/html/fl/?get=SGlzdG9yeUhE', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/History_Logo.svg/1200px-History_Logo.svg.png' },
    { name: 'History 2', url: 'https://tvlibreonline.org/html/fl/?get=SGlzdG9yeV8y', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/History2_logo_%282022%29.svg/1200px-History2_logo_%282022%29.svg.png' },
    { name: 'LN+', url: 'https://www.youtube.com/embed/OR9MH16MKrg?si=DIfW0Kw81r6pmy3s', logoUrl: 'https://resizer.glanacion.com/resizer/v2/logo-NXKF436PYFDRLJJB77LJU7JVQA.png?auth=488ab06bdc404368ff6d748c0a6349c1766ffb7e6650a305e2f3f8cc5043ac3d&width=161&quality=70&smart=false' },
    { name: 'LaLiga Hypermotion', url: 'https://streamtpglobal.com/global1.php?stream=laligahypermotion', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/29/LaLiga_Hypermotion_2023_Vertical_Logo.svg' },
    { name: 'Liga 1 MAX', url: 'https://streamtpglobal.com/global1.php?stream=liga1max', logoUrl: 'https://asset.brandfetch.io/idQxH7kBCc/id_d3sVHzY.png' },
    { name: 'MTV', url: 'https://tvlibreonline.org/html/fl/?get=TVRWX0hE', logoUrl: 'https://www.mtv.com/svg/mtv.svg' },
    { name: 'Movistar Liga de Campeones', url: 'https://streamtpglobal.com/global1.php?stream=movistarligadecampeones', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Liga_de_Campeones_por_Movistar_Plus%2B_2022_logo.svg/1200px-Liga_de_Campeones_por_Movistar_Plus%2B_2022_logo.svg.png' },
    { name: 'National Geographic', url: 'https://tvlibreonline.org/html/fl/?get=TmF0R2VvSEQ=', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b6/Nat_Geo_HD.png/220px-Nat_Geo_HD.png' },
    { name: 'OnBoard Colapinto (SI HAY F1)', url: 'https://streamtpglobal.com/global1.php?stream=disney16', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/New_era_F1_logo.png/800px-New_era_F1_logo.png' },
    { name: 'OnBoard General (SI HAY F1)', url: 'https://streamtpglobal.com/global1.php?stream=disney18', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/New_era_F1_logo.png/800px-New_era_F1_logo.png' },
    { name: 'Playboy (+18)', url: 'https://tvlibreonline.org/html/fl/?get=UGxheWJveQ', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/81/Play_Boy_TV_logo.svg/1200px-Play_Boy_TV_logo.svg.png' },
    { name: 'Premiere 1 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Premiere_FC_logo.png/800px-Premiere_FC_logo.png' },
    { name: 'Premiere 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Premiere_FC_logo.png/800px-Premiere_FC_logo.png' },
    { name: 'Premiere 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere3', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/17/Premiere_FC_logo.png/800px-Premiere_FC_logo.png' },
    { name: 'SSC 1', url: 'https://elcanaldeportivo.com/ssc1.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/ar/a/a7/Saudi_Sports_Company_logo_20210721.png' },
    { name: 'SSC 2', url: 'https://elcanaldeportivo.com/ssc2.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/ar/a/a7/Saudi_Sports_Company_logo_20210721.png' },
    { name: 'SSC EXTRA 1', url: 'https://elcanaldeportivo.com/sscextra1.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/ar/a/a7/Saudi_Sports_Company_logo_20210721.png' },
    { name: 'SSC EXTRA 2', url: 'https://elcanaldeportivo.com/sscextra2.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/ar/a/a7/Saudi_Sports_Company_logo_20210721.png' },
    { name: 'SSC NEWS', url: 'https://elcanaldeportivo.com/sscnews.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/ar/a/a7/Saudi_Sports_Company_logo_20210721.png' },
    { name: 'Sextreme (+18)', url: 'https://tvlibreonline.org/html/fl/?get=U2V4dHJlbWU', logoUrl: 'https://placehold.co/24x24.png' },
    { name: 'Sky Sports Bundesliga 1', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/SKY_SPORT_1_HD.png/800px-SKY_SPORT_1_HD.png' },
    { name: 'Sky Sports Bundesliga 2', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Sky_Sport_2_DE_Logo_2020.svg/1200px-Sky_Sport_2_DE_Logo_2020.svg.png' },
    { name: 'Sky Sports Bundesliga 3', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga3', logoUrl: 'https://upload.wikimedia.org/wikipedia/de/c/c6/Sky_Sport_Bundesliga_3_Logo_2020.png' },
    { name: 'Sky Sports Bundesliga 4', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga4', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c0/Logo_Sky_Bundesliga_HD4.png/800px-Logo_Sky_Bundesliga_HD4.png' },
    { name: 'Sky Sports Bundesliga 5', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga5', logoUrl: 'https://upload.wikimedia.org/wikipedia/de/1/17/Sky_Sport_Bundesliga_5_Logo_2020.png' },
    { name: 'Sport TV 1 BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/SporTV_1_logotipo.png/800px-SporTV_1_logotipo.png' },
    { name: 'Sport TV 1 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_1pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Sport_TV1_%282023%29.svg/1200px-Sport_TV1_%282023%29.svg.png' },
    { name: 'Sport TV 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/SporTV2_logotipo.PNG/800px-SporTV2_logotipo.PNG' },
    { name: 'Sport TV 2 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_2pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/Sport_TV2_%282023%29.svg/1200px-Sport_TV2_%282023%29.svg.png' },
    { name: 'Sport TV 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr3', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/SporTV3_2021.png/800px-SporTV3_2021.png' },
    { name: 'Sport TV 3 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_3pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Sport_TV3_%282023%29.svg/1200px-Sport_TV3_%282023%29.svg.png' },
    { name: 'Sport TV 4 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_4pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Sport_TV4_%282023%29.svg/1200px-Sport_TV4_%282023%29.svg.png' },
    { name: 'Sport TV 5 PT', url: 'https://streamtpglobal.com/global1.php?stream=sporttv5', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Sport_TV5.png/800px-Sport_TV5.png' },
    { name: 'Sport TV 6 PT', url: 'https://streamtpglobal.com/global1.php?stream=sporttv6', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sport_TV6_%282023%29.svg/1200px-Sport_TV6_%282023%29.svg.png' },
    { name: 'TLC', url: 'https://tvlibreonline.org/html/fl/?get=VExD', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/TLC_Logo.svg/1200px-TLC_Logo.svg.png' },
    { name: 'TN', url: 'https://www.youtube.com/embed/cb12KmMMDJA?si=CsUytnnQFJxMs8fL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/TN_todo_noticias_logo.svg/1200px-TN_todo_noticias_logo.svg.png' },
    { name: 'TNT', url: 'https://tvlibreonline.org/html/fl/?get=VE5UX0hEX0FyZw==', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/82/TNT_TV_logo.PNG/653px-TNT_TV_logo.PNG' },
    { name: 'TNT 1 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_1_gb', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Logo_tnt.png/800px-Logo_tnt.png' },
    { name: 'TNT 2 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_2_gb', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/TNT_TV_logo.svg/1200px-TNT_TV_logo.svg.png' },
    { name: 'TNT UK 2', url: 'https://alangulotv2.com/?channel=tntuk2', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/TNT_Sports_%282023%29.svg/1200px-TNT_Sports_%282023%29.svg.png'},
    { name: 'TNT 3 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_3_gb', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/4/44/TNT_Sports_%282023%29.svg/1200px-TNT_Sports_%282023%29.svg.png' },
    { name: 'TNT 4 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_4_gb', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/TNT_Sports_4_logo.png/800px-TNT_Sports_4_logo.png' },
    { name: 'TNT Sports Argentina', url: 'https://streamtpglobal.com/global1.php?stream=tntsports', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/TNT_Sports_2024_vector_logo.svg/1200px-TNT_Sports_2024_vector_logo.svg.png' },
    { name: 'TNT Sports Chile', url: 'https://streamtpglobal.com/global1.php?stream=tntsportschile', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/TNT_Sports_Chile.svg/1200px-TNT_Sports_Chile.svg.png' },
    { name: 'TSN 1', url: 'https://streamtpglobal.com/global1.php?stream=tsn1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/TSN_Logo.svg/1200px-TSN_Logo.svg.png' },
    { name: 'TSN 2', url: 'https://streamtpglobal.com/global1.php?stream=tsn2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Tsn2_logo-93x35.gif/93px-Tsn2_logo-93x35.gif' },
    { name: 'TSN 3', url: 'https://streamtpglobal.com/global1.php?stream=tsn3', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/TSN3.svg/1200px-TSN3.svg.png' },
    { name: 'TSN 4', url: 'https://streamtpglobal.com/global1.php?stream=tsn4', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/TSN4.svg/1200px-TSN4.svg.png' },
    { name: 'TSN 5', url: 'https://streamtpglobal.com/global1.php?stream=tsn5', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/TSN5.svg/1200px-TSN5.svg.png' },
    { name: 'TV Pública', url: 'https://streamtpglobal.com/global1.php?stream=tv_publica', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fc/Television-Publica-Argentina-Logo.svg/1200px-Television-Publica-Argentina-Logo.svg.png' },
    { name: 'TVC Deportes MX', url: 'https://streamtpglobal.com/global1.php?stream=tvc_deportes', logoUrl: 'https://placehold.co/24x24.png' },
    { name: 'TUDN MX', url: 'https://streamtpglobal.com/global1.php?stream=TUDNMX', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/TUDN_Logo.svg/1200px-TUDN_Logo.svg.png' },
    { name: 'TUDN USA', url: 'https://streamtpglobal.com/global1.php?stream=tudn_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/TUDN_Logo.svg/1200px-TUDN_Logo.svg.png' },
    { name: 'Telefe', url: 'https://streamtpglobal.com/global1.php?stream=telefe', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Telefe_%28nuevo_logo%29.png/1200px-Telefe_%28nuevo_logo%29.png' },
    { name: 'Telemundo', url: 'https://tvlibreonline.org/html/fl/?get=VGVsZW11bmRvX0hE', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Telemundo-nuevo-logo.png/1200px-Telemundo-nuevo-logo.png' },
    { name: 'Telemetria F1 (SI HAY F1)', url: 'https://alangulo-dashboard-f1.vercel.app', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/New_era_F1_logo.png/800px-New_era_F1_logo.png' },
    { name: 'TyC Sports', url: 'https://streamtpglobal.com/global1.php?stream=tycsports', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/TyCSp.png/800px-TyCSp.png' },
    { name: 'TyC Sports Internacional', url: 'https://streamtpglobal.com/global1.php?stream=tycinternacional', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/TyCSp.png/800px-TyCSp.png' },
    { name: 'USA Network', url: 'https://streamtpglobal.com/global1.php?stream=usa_network', logoUrl: 'https://brandfetch.io/_next/image?url=https%3A%2F%2Fasset.brandfetch.io%2Fidmisk25aM%2Fid22k0jsgG.svg&w=1920&q=75' },
    { name: 'Universo USA', url: 'https://streamtpglobal.com/global1.php?stream=universo_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/NBCUniverso_logo.png/800px-NBCUniverso_logo.png' },
    { name: 'Univisíon USA', url: 'https://streamtpglobal.com/global1.php?stream=univision_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/02/Univision_logo.svg/1200px-Univision_logo.svg.png' },
    { name: 'VENUS (+18)', url: 'https://tvlibreonline.org/html/fl/?get=VmVudXM=', logoUrl: 'https://placehold.co/24x24.png' },
    { name: 'VTV +', url: 'https://streamtpglobal.com/global1.php?stream=vtvplus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/71/Logo_VTV_Plus_nuevo.png/800px-Logo_VTV_Plus_nuevo.png' },
    { name: 'Vamos ES', url: 'https://streamtpglobal.com/global1.php?stream=vamoses', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Vamos_por_Movistar_Plus%2B_2022_logo.svg/1200px-Vamos_por_Movistar_Plus%2B_2022_logo.svg.png' },
    { name: 'Win Play +', url: 'https://streamtpglobal.com/global1.php?stream=winplusonline1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Win_Sport_logo.png/800px-Win_Sport_logo.png' },
    { name: 'Win Sports', url: 'https://streamtpglobal.com/global1.php?stream=winsports', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Win_Sport_logo.png/800px-Win_Sport_logo.png' },
    { name: 'Win Sports +', url: 'https://streamtpglobal.com/global1.php?stream=winplus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Win_Sport_logo.png/800px-Win_Sport_logo.png' },
    { name: 'Win Sports + (Op2)', url: 'https://streamtpglobal.com/global1.php?stream=winplus2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/Win_Sport_logo.png/800px-Win_Sport_logo.png' },
];

const uniqueChannelsMap = new Map<string, Channel>();
channelsData.forEach(channel => {
  if (!uniqueChannelsMap.has(channel.url)) {
    // Ensure logoUrl has a default if not provided
    uniqueChannelsMap.set(channel.url, { ...channel, logoUrl: channel.logoUrl || 'https://placehold.co/24x24.png' });
  }
});
const channels: Channel[] = Array.from(uniqueChannelsMap.values())
  .sort((a, b) => a.name.localeCompare(b.name));


interface CopiedStates {
  [key: string]: boolean;
}

export const ChannelListComponent: FC = () => {
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});
  const [activeAccordionItems, setActiveAccordionItems] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleAccordionChange = (value: string[]) => {
    if (!value.includes('channel-list-content') && activeAccordionItems.includes('channel-list-content')) {
       setSearchTerm('');
    }
    setActiveAccordionItems(value);
  };

  const handleCopy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedStates(prev => ({ ...prev, [url]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [url]: false }));
      }, 1000);
    } catch (err) {
      console.error("Error al copiar: ", err);
    }
  };

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="mb-6 shadow-lg w-full h-full flex flex-col">
      <Accordion
        type="multiple"
        value={activeAccordionItems}
        onValueChange={handleAccordionChange}
        className="w-full flex flex-col flex-grow"
      >
        <AccordionItem value="channel-list-content" className="border-b-0">
          <AccordionTrigger className="px-6 py-4 hover:no-underline">
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center text-xl font-semibold text-primary">
                <List className="mr-2 h-5 w-5 flex-shrink-0" />
                <span className="truncate">Lista de Canales</span>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 min-h-0">
            <div className="px-6 pb-4">
              <div className="relative flex flex-1 items-center w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Buscar canal..."
                  className="h-9 w-full pl-10 pr-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                {searchTerm && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
                    onClick={() => setSearchTerm('')}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="max-h-96 overflow-y-auto px-6 pb-4">
              {filteredChannels.length > 0 ? (
                <ul className="space-y-3">
                  {filteredChannels.map((channel) => (
                    <li key={channel.url} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                      <div className="flex items-center flex-1 truncate mr-2">
                        {channel.logoUrl && (
                          <Image
                            src={channel.logoUrl}
                            alt={`${channel.name} logo`}
                            width={24}
                            height={24}
                            data-ai-hint={getAiHintForChannel(channel.name)}
                            className="mr-2 rounded-sm object-contain flex-shrink-0"
                            unoptimized 
                          />
                        )}
                        <span className="text-foreground truncate" title={channel.name}>{channel.name}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleCopy(channel.url)}
                        className={cn(
                          "transition-colors duration-300 w-[140px]",
                          copiedStates[channel.url]
                            ? "bg-green-500 hover:bg-green-600 text-white border border-green-500 hover:border-green-600"
                            : "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground"
                        )}
                      >
                        {copiedStates[channel.url] ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                        {copiedStates[channel.url] ? "¡Copiado!" : "Copiar Enlace"}
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground">
                  {searchTerm ? `No se encontraron canales para "${searchTerm}".` : "No hay canales disponibles."}
                </p>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="event-list" className="border-b-0">
          <AccordionTrigger className="px-6 py-4 text-xl font-semibold text-primary hover:no-underline">
            <div className="flex items-center">
              <ListVideo className="mr-2 h-5 w-5" />
              Lista de Eventos
            </div>
          </AccordionTrigger>
          <AccordionContent className="pt-0 min-h-0">
            <div className="px-6 pb-4">
              <div className="h-[500px] w-full rounded-md overflow-hidden border border-border shadow">
                <iframe
                    src={EVENT_LIST_URL}
                    title="Lista de Eventos"
                    className="w-full h-full border-0"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-clipboard-write"
                    allow="clipboard-write"
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
};

