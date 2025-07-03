
"use client";

import { useState, useRef } from 'react';
import type { FC } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy, CheckCircle2, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Channel {
  name: string;
  url: string;
  logoUrl?: string;
}

const getAiHintForChannel = (channelName: string): string => {
  const words = channelName.replace(/[^\w\s]/gi, '').split(' ').filter(Boolean);
  if (words.length === 0) return "logo";
  if (words.length === 1) return words[0];
  return `${words[0]} ${words[1]}`.substring(0, 50);
};

const channelsData: Channel[] = [
    { name: 'A24', url: 'https://www.youtube.com/embed/QGpHLgRnrx4?si=NBFgu_PSRDMaOdr1', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8yfXBuQmon9WVy3ETX9fuq0w4U8Hvq391YA&s' },
    { name: 'A3SERIES', url: 'https://embed.ksdjugfsddeports.fun/embed/a3series.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQnbtKSukxgLre37kBp2mHcm6FyWnotLCxKfA&s' },
    { name: 'AMC', url: 'https://embed.ksdjugfsddeports.fun/embed/amc.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/01/AMC_logo_2016.png' },
    { name: 'AMERICA TV', url: 'https://embed.ksdjugfsddeports.fun/embed/americatv.html', logoUrl: 'https://yt3.googleusercontent.com/KRDAxhSJVhhRP7SACB06iIg7xczMDUur1iGWVlvAJ4XkxRCkY1qFOVqVo02bsnh7W1c9HjNA=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'ANTENA 3', url: 'https://embed.ksdjugfsddeports.fun/embed/antena3.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ6dtC1BvPcFHYtA9Z3EtmZffEYR8RSs1Xq-w&s' },
    { name: 'ATV', url: 'https://elcanaldeportivo.com/atv.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/ATV_logo_2020.png' },
    { name: 'AXN', url: 'https://embed.ksdjugfsddeports.fun/embed/axn.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTzMpELJrYH7D81zVpTgT7T96pw0EQCfsgD7A&s' },
    { name: 'AZ CINEMA', url: 'https://embed.ksdjugfsddeports.fun/embed/azcinema.html', logoUrl: 'https://logowik.com/content/uploads/images/tv-azteca-cinema2219.logowik.com.webp' },
    { name: 'AZ CLICK', url: 'https://embed.ksdjugfsddeports.fun/embed/azclick.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSs-6Dgz43MDgis4FMaUDdbDdgpYAhmUmkLCw&s' },
    { name: 'AZ CORAZON', url: 'https://embed.ksdjugfsddeports.fun/embed/azcorazon.html', logoUrl: 'https://cdn.mitvstatic.com/channels/ar_az-corazon_m.png' },
    { name: 'AZTECA 7', url: 'https://elcanaldeportivo.com/azteca7.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Logo_Azteca_7_2011.svg/1930px-Logo_Azteca_7_2011.svg.png' },
    { name: 'AZTECA INTERNACIONAL', url: 'https://embed.ksdjugfsddeports.fun/embed/aztecainternacional.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRezmNp_pFeJAxqdswiFwYTX8KOmAjITMKm8w&s' },
    { name: 'AZTECA UNO', url: 'https://embed.ksdjugfsddeports.fun/embed/aztecauno.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7d/Azteca_Uno.png/1200px-Azteca_Uno.png' },
    { name: 'Adult Swim', url: 'https://tvlibreonline.org/html/fl/?get=QWR1bHRfU3dpbQ==', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Adult_Swim_2003_logo.svg/2560px-Adult_Swim_2003_logo.svg.png' },
    { name: 'Animal Planet', url: 'https://tvlibreonline.org/html/fl/?get=QW5pbWFsUGxhbmV0', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/2018_Animal_Planet_logo.svg' },
    { name: 'Azteca Deportes', url: 'https://streamtpglobal.com/global1.php?stream=azteca_deportes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Aztecadeporteslogo.png/500px-Aztecadeporteslogo.png' },
    { name: 'BEIN SPORTS XTRA', url: 'https://embed.ksdjugfsddeports.fun/embed/beinsportsxtra.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRo8XMdf5W36gGOa4rhhzCYQoakNbrgrcr0g&s' },
    { name: 'C5N', url: 'https://www.youtube.com/embed/jTDk5CswBVk?si=1j2k7zbPW2d1wPRs', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/C5N_Logo_2015.PNG/640px-C5N_Logo_2015.PNG' },
    { name: 'CANAL SONY', url: 'https://embed.ksdjugfsddeports.fun/embed/sony.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ8g4pgtD9NRV7Q3SMRX1XUcxAkSyd3qR23Mw&s' },
    { name: 'CRONICA', url: 'https://www.youtube.com/embed/avly0uwZzOE?si=QoqQYotYxpJxAZyO', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Crónica_TV_logotipo_%282016%29.png' },
    { name: 'CARTOON NETWORK', url: 'https://embed.ksdjugfsddeports.fun/embed/cartoonnetwork.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/80/Cartoon_Network_2010_logo.svg' },
    { name: 'CARTOONITO', url: 'https://embed.ksdjugfsddeports.fun/embed/cartoonito.html', logoUrl: 'https://cloudfront-us-east-1.images.arcpublishing.com/elespectador/Q5GZ2WZL6VHNVCFVJK72P7UIHA.jpg' },
    { name: 'CINECANAL', url: 'https://embed.ksdjugfsddeports.fun/embed/cinecanal.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/e/e6/CinecanalLA.png' },
    { name: 'CINEMAX', url: 'https://embed.ksdjugfsddeports.fun/embed/cinemax.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/11/Cinemax_%28Yellow%29.svg/640px-Cinemax_%28Yellow%29.svg.png' },
    { name: 'Caliente TV', url: 'https://streamtpglobal.com/global1.php?stream=calientetvmx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Caliente_TV_Logo.png' },
    { name: 'Canal 11 PT', url: 'https://streamtpglobal.com/global1.php?stream=canal11_pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Logo_Canal_11_FPF.svg/1053px-Logo_Canal_11_FPF.svg.png' },
    { name: 'Canal 5', url: 'https://streamtpglobal.com/global1.php?stream=canal5mx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Canal_5_Mexico_logo_2014.svg' },
    { name: 'Caracol TV', url: 'https://streamtpglobal.com/global1.php?stream=caracoltv', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Logotipo_de_Caracol_Televisi%C3%B3n_Corporativo.png' },
    { name: 'Comedy Central', url: 'https://tvlibreonline.org/html/fl/?get=Q29tZWR5Q2VudHJhbA', logoUrl: 'https://1000marcas.net/wp-content/uploads/2022/01/Comedy-Central-Productions-Logo.png' },
    { name: 'DAZN 1 ES', url: 'https://streamtpglobal.com/global1.php?stream=dazn1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/DAZN_1_Logo.svg' },
    { name: 'DAZN 2 ES', url: 'https://streamtpglobal.com/global1.php?stream=dazn2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/DAZN_2.svg/2560px-DAZN_2.svg.png' },
    { name: 'DAZN F1', url: 'https://elcanaldeportivo.com/daznf1.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/70/DAZN_F1_logo.png' },
    { name: 'DAZN LaLiga', url: 'https://streamtpglobal.com/global1.php?stream=dazn_laliga', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDZqHtFwkPR8CyxP8MPc2_El0YqtCFF4zzng&s' },
    { name: 'DIRECTV SPORTS', url: 'https://streamtpglobal.com/global1.php?stream=dsports', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DSports.png' },
    { name: 'DIRECTV SPORTS +', url: 'https://streamtpglobal.com/global1.php?stream=dsportsplus', logoUrl: 'https://d18o29lhcg4kda.cloudfront.net/fit-in/360x270/Y2gwMTAwMDAwMDAwMTM5X2xpbmVhcl9jaGFubmVsX3NzbGE_11002_LOGO_360x270.png?timestamp=1750317237946' },
    { name: 'DIRECTV SPORTS 2', url: 'https://streamtpglobal.com/global1.php?stream=dsports2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/83/DSports2.png' },
    { name: 'DISCOVERY A&E', url: 'https://embed.ksdjugfsddeports.fun/embed/discoveryaye.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQvr-HEzPT6Im-07iGS_JQGyMITM5DvbzcMrA&s' },
    { name: 'DISCOVERY CHANNEL', url: 'https://embed.ksdjugfsddeports.fun/embed/discoverychannel.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS11Iy_ATgio5GEiiEl1eAqwNjHEght0CL-Cw&s' },
    { name: 'DISCOVERY H&H', url: 'https://embed.ksdjugfsddeports.fun/embed/discoveryhyh.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/Discovery_Home_%26_Health_logo.svg' },
    { name: 'DISCOVERY KIDS', url: 'https://embed.ksdjugfsddeports.fun/embed/discoverykids.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Discovery_Kids_Logo_%282021%29.webp/215px-Discovery_Kids_Logo_%282021%29.webp.png' },
    { name: 'DISCOVERY THEATER', url: 'https://embed.ksdjugfsddeports.fun/embed/discoverytheater.html', logoUrl: 'https://cdn.mitvstatic.com/channels/ar_discovery-hd-theater_m.png' },
    { name: 'DISCOVERY TLC', url: 'https://embed.ksdjugfsddeports.fun/embed/discoverytlc.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/TLC_logo_%282023%29.svg' },
    { name: 'DISCOVERY TURBO', url: 'https://embed.ksdjugfsddeports.fun/embed/discoveryturbo.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Discovery_Turbo_logo.svg/1200px-Discovery_Turbo_logo.svg.png' },
    { name: 'DISCOVERY WORLD', url: 'https://embed.ksdjugfsddeports.fun/embed/discoveryworld.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/World_Discovery_HD_logo.svg/1200px-World_Discovery_HD_logo.svg.png' },
    { name: 'DISNEY CHANNEL', url: 'https://embed.ksdjugfsddeports.fun/embed/disneychannel.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d2/2019_Disney_Channel_logo.svg' },
    { name: 'DISNEY JUNIOR', url: 'https://embed.ksdjugfsddeports.fun/embed/disneyjr.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTZWyVcgbta5_RL2K2EPgrPiK-DrW7icmSCNQ&s' },
    { name: 'DISTRITO COMEDIA', url: 'https://embed.ksdjugfsddeports.fun/embed/distritocomedia.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/09/Logo_Distrito_Comedia.png' },
    { name: 'DPELICULA', url: 'https://embed.ksdjugfsddeports.fun/embed/dpelicula.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/30/De_Pel%C3%ADcula_Cl%C3%A1sico.png' },
    { name: 'ESPN', url: 'https://streamtpglobal.com/global1.php?stream=espn', logoUrl: 'https://themenschonabench.com/wp-content/uploads/2014/05/ESPN-Logo.png' },
    { name: 'ESPN BR', url: 'https://streamtpglobal.com/global1.php?stream=espn1br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Logo_espnbrasil.png' },
    { name: 'ESPN NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl1', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/wc8dnt1660760493.png' },
    { name: 'ESPN 2', url: 'https://streamtpglobal.com/global1.php?stream=espn2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/1280px-ESPN2_logo.svg.png' },
    { name: 'ESPN 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn2br', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/b0n0mh1660763068.png' },
    { name: 'ESPN 2 MX', url: 'https://streamtpglobal.com/global1.php?stream=espn2mx', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/f6gq9s1660760610.png' },
    { name: 'ESPN 2 NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl2', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/keezdj1660760512.png' },
    { name: 'ESPN 3', url: 'https://streamtpglobal.com/global1.php?stream=espn3', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/ESPN3_Logo.png' },
    { name: 'ESPN 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn3br', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/3uym3u1660763049.png' },
    { name: 'ESPN 3 MX', url: 'https://streamtpglobal.com/global1.php?stream=espn3mx', logoUrl: 'https://img2.sport-tv-guide.live/images/tv-station-espn-3-939.png' },
    { name: 'ESPN 3 NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl3', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/x8t6yd1660760523.png' },
    { name: 'ESPN 4', url: 'https://streamtpglobal.com/global1.php?stream=espn4', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/ESPN_4_logo.svg/2560px-ESPN_4_logo.svg.png' },
    { name: 'ESPN 4 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn4br', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/ESPN_4_logo.svg/1280px-ESPN_4_logo.svg.png' },
    { name: 'ESPN 5', url: 'https://streamtpglobal.com/global1.php?stream=espn5', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/ESPN_5_logo.svg/2560px-ESPN_5_logo.svg.png' },
    { name: 'ESPN 6', url: 'https://streamtpglobal.com/global1.php?stream=espn6', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/ESPN_6_logo.svg/2560px-ESPN_6_logo.svg.png' },
    { name: 'ESPN 7', url: 'https://streamtpglobal.com/global1.php?stream=espn7', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/ESPN_7_logo.svg/1280px-ESPN_7_logo.svg.png' },
    { name: 'ESPN ARGENTINA', url: 'https://streamtpglobal.com/global1.php?stream=eventos8', logoUrl: 'https://a1.espncdn.com/combiner/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png' },
    { name: 'ESPN Deportes USA', url: 'https://streamtpglobal.com/global1.php?stream=espndeportes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ESPN_Deportes.svg/1200px-ESPN_Deportes.svg.png' },
    { name: 'ESPN MX', url: 'https://streamtpglobal.com/global1.php?stream=espnmx', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/fysmne1660760631.png' },
    { name: 'ESPN Premium', url: 'https://streamtpglobal.com/global1.php?stream=espnpremium', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/ESPN_Premium_logo.svg' },
    { name: 'EL GOURMET', url: 'https://embed.ksdjugfsddeports.fun/embed/elgourmet.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSK6F1LJE-_HEEQbOTGu8X1Zqa6Fs3udromNQ&s' },
    { name: 'EL TRECE', url: 'https://embed.ksdjugfsddeports.fun/embed/eltrece.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/8d/Isotipo_eltrece_2016.png' },
    { name: 'EVERYTHING', url: 'https://embed.ksdjugfsddeports.fun/embed/everything.html', logoUrl: 'https://e7.pngegg.com/pngimages/15/632/png-clipart-e-television-channel-entertainment-logo-channel-miscellaneous-television-thumbnail.png' },
    { name: 'El canal del Futbol', url: 'https://elcanaldeportivo.com/ecfutbol.php', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQIkdi0tMnj4tej1cemfhhYuzT6woZTrTIQw&s' },
    { name: 'Eleven Sports 1 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven1_pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Eleven_Sports.png' },
    { name: 'Eleven Sports 2 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven2_pt', logoUrl: 'https://tvprofil.com/img/kanali-logo/Eleven_Sports_2_PL_logo.png?1609415475' },
    { name: 'Eleven Sports 3 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven3_pt', logoUrl: 'https://archive.org/download/eleven-sports-3_202305/Eleven_Sports_3.png' },
    { name: 'Eleven Sports 4 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven4_pt', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6LFknDlsTHhFJbEe_mqO5VgqH1Wz2JeqkTQ&s' },
    { name: 'Eleven Sports 5 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven5_pt', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiGRVIPkw4P0uMFbMhjsawmMbroF8ztMaPpg&s' },
    { name: 'Eurosport 1', url: 'https://elcanaldeportivo.com/eurosports1.php', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRa02LLWr8M_-Yu6Q6vr_TRHRe6Y-h5vJYj7A&s' },
    { name: 'Eurosport 2', url: 'https://elcanaldeportivo.com/eurosports2.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Eurosport_2_Logo_2015.svg/2560px-Eurosport_2_Logo_2015.svg.png' },
    { name: 'FUTV (EV)', url: 'https://streamtpglobal.com/global1.php?stream=futv', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgErhsHjLvKGwZd_6Qfkw3iR1lFl9lNC2smA&s' },
    { name: 'FLOW 1', url: 'https://play.alangulotv.cloud/?channel=flow1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Flow_2021.jpg' },
    { name: 'FLOW 2', url: 'https://play.alangulotv.cloud/?channel=flow2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Flow_2021.jpg' },
    { name: 'FX', url: 'https://embed.ksdjugfsddeports.fun/embed/fx.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4d/FX_International_logo.svg' },
    { name: 'Flow Music', url: 'https://tvlibreonline.org/html/fl/?get=Rmxvd19NdXNpY19YUA==', logoUrl: 'https://pbs.twimg.com/profile_images/1445057259780837378/kpDGDIyl_400x400.png' },
    { name: 'Fox Deportes', url: 'https://streamtpglobal.com/global1.php?stream=tubitv1', logoUrl: 'https://assets.goal.com/images/v3/blt38c232d013be3b9f/unnamed.jpg' },
    { name: 'Fox Deportes', url: 'https://streamtpglobal.com/global1.php?stream=fox_deportes_usa', logoUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kRD_CzEE876U_cVjUDaMF-hFzDQB906eoYWLq1JT0u99Q=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'Fox Sports', url: 'https://streamtpglobal.com/global1.php?stream=fox1ar', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/FOX_Sports_logo.svg/1200px-FOX_Sports_logo.svg.png' },
    { name: 'Fox Sports MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsportsmx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/FOX_Sports_logo.svg/1200px-FOX_Sports_logo.svg.png' },
    { name: 'Fox Sports USA', url: 'https://streamtpglobal.com/global1.php?stream=fox_1_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/FOX_Sports_logo.svg/1200px-FOX_Sports_logo.svg.png' },
    { name: 'Fox Sports 2', url: 'https://streamtpglobal.com/global1.php?stream=fox2ar', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Fox_Sports_2_Argentina_2023.svg/1200px-Fox_Sports_2_Argentina_2023.svg.png' },
    { name: 'Fox Sports 2 MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsports2mx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Fox_Sports_2_Argentina_2023.svg/1200px-Fox_Sports_2_Argentina_2023.svg.png' },
    { name: 'Fox Sports 2 USA', url: 'https://streamtpglobal.com/global1.php?stream=fox_2_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Fox_Sports_2_Argentina_2023.svg/1200px-Fox_Sports_2_Argentina_2023.svg.png' },
    { name: 'Fox Sports 3', url: 'https://streamtpglobal.com/global1.php?stream=fox3ar', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Fox_Sports_3_Argentina_2023.svg/800px-Fox_Sports_3_Argentina_2023.svg.png' },
    { name: 'Fox Sports 3 MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsports3mx', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Fox_Sports_3_Argentina_2023.svg/800px-Fox_Sports_3_Argentina_2023.svg.png' },
    { name: 'Fox Sports Premium', url: 'https://streamtpglobal.com/global1.php?stream=foxsportspremium', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Fox_Sports_Premium_Argentina_2020.png' },
    { name: 'GALAVISION', url: 'https://embed.ksdjugfsddeports.fun/embed/galavision.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Galavision_Logo_2024.svg' },
    { name: 'GLOBAL TV PERU', url: 'https://embed.ksdjugfsddeports.fun/embed/globaltv.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/b/bd/Global_logo_2019.png' },
    { name: 'GOLDEN EDGE', url: 'https://embed.ksdjugfsddeports.fun/embed/goldenedge.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/Golden_Edge_Logo_2020.png' },
    { name: 'GOLDEN PLUS', url: 'https://embed.ksdjugfsddeports.fun/embed/goldenplus.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5F0aqp2753KU8sHrNHjxRrCuI4xXyd_UnnA&s' },
    { name: 'GOLDEN PREMIERE', url: 'https://embed.ksdjugfsddeports.fun/embed/goldenpremier.html', logoUrl: 'https://cdn.storage.foromedios.com/monthly_2022_11/large.large.1689826971_GoldenPremier2020.png.55867f88ed97ec1141ed81ba0f75a494.png.926c708c6f8ba665429c99b39b760a32.png' },
    { name: 'GOLDEN PREMIERE 2', url: 'https://embed.ksdjugfsddeports.fun/embed/goldenpremier2.html', logoUrl: 'https://claroperupoc.vtexassets.com/arquivos/golden-premier-2hd-v2.png' },
    { name: 'Garage TV', url: 'https://tvlibreonline.org/html/fl/?get=RWxfR2FyYWdl', logoUrl: 'https://elgarage.com/wp-content/uploads/2021/04/elgaragetv_WEB.png' },
    { name: 'GolPeru', url: 'https://streamtpglobal.com/global1.php?stream=golperu', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU5NdVG4od9akIwHShMdl92aQzAqGS_V95vA&s' },
    { name: 'GolTV', url: 'https://streamtpglobal.com/global1.php?stream=goltv', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/GOLTV.png' },
    { name: 'Gran Hermano CAM 1', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam1', logoUrl: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'Gran Hermano CAM 2', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam2', logoUrl: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'Gran Hermano CAM 3', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam3', logoUrl: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'Gran Hermano CAM 24H', url: 'https://streamtpglobal.com/global1.php?stream=granhermanocamara24horas', logoUrl: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'Gran Hermano MultiCAM', url: 'https://streamtpglobal.com/global1.php?stream=granhermanomulticam', logoUrl: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'HI! Sports MX', url: 'https://streamtpglobal.com/global1.php?stream=hisports', logoUrl: 'https://yt3.googleusercontent.com/Fjgx6A157keMvkL44bXj2IATT2c8oBvP0UzL4KKKuZYtDB0tx0rUYxwyIjloNch-yzqJd3KhSw=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'History', url: 'https://tvlibreonline.org/html/fl/?get=SGlzdG9yeUhE', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/The_History_Channel_logo.png/250px-The_History_Channel_logo.png' },
    { name: 'History 2', url: 'https://tvlibreonline.org/html/fl/?get=SGlzdG9yeV8y', logoUrl: 'https://cdn.mitvstatic.com/channels/ar_h2_m.png' },
    { name: 'ID INVESTIGATION', url: 'https://embed.ksdjugfsddeports.fun/embed/idinvestigation.html', logoUrl: 'https://cdn.mitvstatic.com/channels/ar_investigation-discovery_m.png' },
    { name: 'LN+', url: 'https://www.youtube.com/embed/OR9MH16MKrg?si=DIfW0Kw81r6pmy3s', logoUrl: 'https://resizer.glanacion.com/resizer/v2/logo-NXKF436PYFDRLJJB77LJU7JVQA.png?auth=488ab06bdc404368ff6d748c0a6349c1766ffb7e6650a305e2f3f8cc5043ac3d&width=161&quality=70&smart=false' },
    { name: 'LAS ESTRELLAS', url: 'https://embed.ksdjugfsddeports.fun/embed/lasestrellas.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Las_Estrellas_logo_%282016%29.svg/1200px-Las_Estrellas_logo_%282016%29.svg.png' },
    { name: 'LATINA', url: 'https://embed.ksdjugfsddeports.fun/embed/latina.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Latina_Television_-_Logotipo.png' },
    { name: 'LIFETIME', url: 'https://embed.ksdjugfsddeports.fun/embed/lifetime.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQlzhF3e8RMJSa--VuME5MVRlPqytmzkekmOA&s' },
    { name: 'LIGA 1', url: 'https://embed.ksdjugfsddeports.fun/embed/liga1.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQV-PjZuQbdSQ4bl6tiT5CKtU3ZUvz1R16fJg&s' },
    { name: 'LaLiga Hypermotion', url: 'https://streamtpglobal.com/global1.php?stream=laligahypermotion', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/LaLiga_TV_Hypermotion_2023_Logo.svg/1200px-LaLiga_TV_Hypermotion_2023_Logo.svg.png' },
    { name: 'Liga 1 MAX', url: 'https://streamtpglobal.com/global1.php?stream=liga1max', logoUrl: 'https://play-lh.googleusercontent.com/utRBgwflE7hqjt4UvWeNO_AA1MHdP4l9dVD1V38DdRM9GGzxD5xK1iyXRPcnOXV9d6M' },
    { name: 'MLB NETWORK', url: 'https://embed.ksdjugfsddeports.fun/embed/mlbnetwork.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/a/ac/MLBNetworkLogo.svg/1200px-MLBNetworkLogo.svg.png' },
    { name: 'MOVISTAR ACCION', url: 'https://embed.ksdjugfsddeports.fun/embed/movistaraccion.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQwQpf3bK8lcZBW6dNMJs5kZ2o-4mpMEdmUXQ&s' },
    { name: 'MOVISTAR DEPORTES ES', url: 'https://embed.ksdjugfsddeports.fun/embed/movistardeporteses.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQSALZ31CSIyN4JwWpMwCiyFw_3-zY_hdxuQQ&s' },
    { name: 'MOVISTAR DEPORTES PE', url: 'https://embed.ksdjugfsddeports.fun/embed/movistardeportes.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS5Oqp6agg3aiMkjX4JLmhpJ9Ue_My7KZfVLQ&s' },
    { name: 'MOVISTAR LA LIGA', url: 'https://embed.ksdjugfsddeports.fun/embed/movistarlaliga.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/LaLiga_por_Movistar_Plus%2B_2022_logo.svg/1200px-LaLiga_por_Movistar_Plus%2B_2022_logo.svg.png' },
    { name: 'MULTIPREMIER', url: 'https://embed.ksdjugfsddeports.fun/embed/multipremier.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Multipremier_logo.svg/1200px-Multipremier_logo.svg.png' },
    { name: 'MTV', url: 'https://tvlibreonline.org/html/fl/?get=TVRWX0hE', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/MTV_2021_%28brand_version%29.svg/1200px-MTV_2021_%28brand_version%29.svg.png' },
    { name: 'Movistar Liga de Campeones', url: 'https://streamtpglobal.com/global1.php?stream=movistarligadecampeones', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Movistar_Liga_de_Campeones.svg/2560px-Movistar_Liga_de_Campeones.svg.png' },
    { name: 'NAT GEO MUNDO', url: 'https://embed.ksdjugfsddeports.fun/embed/natgeomundo.html', logoUrl: 'https://pbs.twimg.com/profile_images/496293907886403584/yQYuZTjL_400x400.png' },
    { name: 'NBA', url: 'https://embed.ksdjugfsddeports.fun/embed/nba.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/en/thumb/d/d2/NBA_TV.svg/1200px-NBA_TV.svg.png' },
    { name: 'NICK', url: 'https://embed.ksdjugfsddeports.fun/embed/nick.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTudsGNYzWPsnCOKE7v5BGeH6QswRB8oYkQ_A&s' },
    { name: 'NICK JR', url: 'https://embed.ksdjugfsddeports.fun/embed/nickjr.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/c5/Nick_Jr._logo_2023_%28outline%29.svg' },
    { name: 'National Geographic', url: 'https://tvlibreonline.org/html/fl/?get=TmF0R2VvSEQ=', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Nat_Geo_HD.png' },
    { name: 'ODISEA', url: 'https://embed.ksdjugfsddeports.fun/embed/odisea.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQfDwGoMS1UNrB2Fk1kJwDUO7k9cb48MaIHDQ&s' },
    { name: 'PARAMOUNT CHANNEL', url: 'https://embed.ksdjugfsddeports.fun/embed/paramountchannel.html', logoUrl: 'https://cdn.mitvstatic.com/channels/co_paramount-channel_m.png' },
    { name: 'PASIONES', url: 'https://embed.ksdjugfsddeports.fun/embed/pasiones.html', logoUrl: 'https://yt3.googleusercontent.com/czxQxYU7hERMABPcpl6ayjo5NvzNcWjj9bKRdr6UbMZqdbF0QR998JZoO63y_hSHR7eb3B1PGw=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'Premiere 1 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere1', logoUrl: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png' },
    { name: 'Premiere 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere2', logoUrl: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png' },
    { name: 'Premiere 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere3', logoUrl: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png' },
    { name: 'RCN', url: 'https://embed.ksdjugfsddeports.fun/embed/rcn.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a3/CanalRCN2023.png' },
    { name: 'SSC 1', url: 'https://elcanaldeportivo.com/ssc1.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SSC 2', url: 'https://elcanaldeportivo.com/ssc2.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SSC EXTRA 1', url: 'https://elcanaldeportivo.com/sscextra1.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SSC EXTRA 2', url: 'https://elcanaldeportivo.com/sscextra2.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SSC NEWS', url: 'https://elcanaldeportivo.com/sscnews.php', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SKY SPORTS F1', url: 'https://embed.ksdjugfsddeports.fun/embed/skysportsf1.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQg9vzqbU-z482DKPxItcBGSto52zbdHqP5Mg&s' },
    { name: 'SKY SPORTS MX', url: 'https://embed.ksdjugfsddeports.fun/embed/skysportsmexico.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYnu2ryqkehHLadv1xgLWuJLw47ApBiFtGGA&s' },
    { name: 'SPACE', url: 'https://embed.ksdjugfsddeports.fun/embed/space.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQYycUTk0VyZoRmq_axU94RnRSASnGZ4ypDIg&s' },
    { name: 'STAR CHANNEL', url: 'https://embed.ksdjugfsddeports.fun/embed/starchannel.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Star_Channel_2020.svg' },
    { name: 'STUDIO UNIVERSAL', url: 'https://embed.ksdjugfsddeports.fun/embed/studiouniversal.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/StudioUniversal2016.png/330px-StudioUniversal2016.png' },
    { name: 'SYFY USA', url: 'https://embed.ksdjugfsddeports.fun/embed/syfy.html', logoUrl: 'https://deadline.com/wp-content/uploads/2016/05/usa-syfy-3.jpg?w=630&h=383&crop=1' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga1', logoUrl: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga2', logoUrl: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga3', logoUrl: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga4', logoUrl: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga5', logoUrl: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sport TV BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_1pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 2 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_2pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr3', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 3 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_3pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 4 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_4pt', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 5 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv5', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 6 PT', url: 'https://streamtpglobal.com/global1.php?stream=sporttv6', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'TLC', url: 'https://tvlibreonline.org/html/fl/?get=VExD', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/TLC_logo_%282023%29.svg' },
    { name: 'TN', url: 'https://www.youtube.com/embed/cb12KmMMDJA?si=CsUytnnQFJxMs8fL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/TN_todo_noticias_logo.svg/1200px-TN_todo_noticias_logo.svg.png' },
    { name: 'TNT', url: 'https://tvlibreonline.org/html/fl/?get=VE5UX0hEX0FyZw==', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_1_gb', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT 2 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_2_gb', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT UK 2', url: 'https://alangulotv2.com/?channel=tntuk2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg'},
    { name: 'TNT 3 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_3_gb', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT 4 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_4_gb', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT NOVELAS', url: 'https://embed.ksdjugfsddeports.fun/embed/tntnovelas.html', logoUrl: 'https://yt3.googleusercontent.com/2pBZT2JWbwv3wA8JdzUnO8fiwLEHejjg1n4p9LOskGK2xC4urk7npXE5_eMzJihILaJnLiKF=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'TNT SERIES', url: 'https://embed.ksdjugfsddeports.fun/embed/tntseries.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRcaZcOuQ2RUzccqDiDcis9EMV5jtNRY0pCVQ&s' },
    { name: 'TNT Sports', url: 'https://streamtpglobal.com/global1.php?stream=tntsports', logoUrl: 'https://yt3.googleusercontent.com/nv5OCOIRHGSuTpTqhUrSJlfgZkBxicFbTY_8uXsjLMNrsZ7-TmJSFIvBJdhpxRTOky9kDvRuXJU=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'TNT Sports Chile', url: 'https://streamtpglobal.com/global1.php?stream=tntsportschile', logoUrl: 'https://yt3.googleusercontent.com/nv5OCOIRHGSuTpTqhUrSJlfgZkBxicFbTY_8uXsjLMNrsZ7-TmJSFIvBJdhpxRTOky9kDvRuXJU=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'TSN 1', url: 'https://streamtpglobal.com/global1.php?stream=tsn1', logoUrl: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TSN 2', url: 'https://streamtpglobal.com/global1.php?stream=tsn2', logoUrl: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TSN 3', url: 'https://streamtpglobal.com/global1.php?stream=tsn3', logoUrl: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TSN 4', url: 'https://streamtpglobal.com/global1.php?stream=tsn4', logoUrl: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TSN 5', url: 'https://streamtpglobal.com/global1.php?stream=tsn5', logoUrl: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TV Pública', url: 'https://streamtpglobal.com/global1.php?stream=tv_publica', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/TVP_-_Televisi%C3%B3n_P%C3%BAblica_%282021%29.svg/1200px-TVP_-_Televisi%C3%B3n_P%C3%BAblica_%282021%29.svg.png' },
    { name: 'TVC Deportes', url: 'https://streamtpglobal.com/global1.php?stream=tvc_deportes', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Tvc_2003.png' },
    { name: 'TUDN', url: 'https://streamtpglobal.com/global1.php?stream=TUDNMX', logoUrl: 'https://corporate.univision.com/newco/wp-content/uploads/2019/05/TUDN_LOGO_COLOR.png' },
    { name: 'TUDN USA', url: 'https://streamtpglobal.com/global1.php?stream=tudn_usa', logoUrl: 'https://corporate.univision.com/newco/wp-content/uploads/2019/05/TUDN_LOGO_COLOR.png' },
    { name: 'TELEFE', url: 'https://streamtpglobal.com/global1.php?stream=telefe', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Telefe_%28nuevo_logo%29.png' },
    { name: 'TELEHIT', url: 'https://embed.ksdjugfsddeports.fun/embed/telehit.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/ae/Telehit_logo_2020.png' },
    { name: 'TELEMUNDO', url: 'https://tvlibreonline.org/html/fl/?get=VGVsZW11bmRvX0hE', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Telemundo_logo_2018.svg' },
    { name: 'TELEMUNDO 51 FLORIDA', url: 'https://embed.ksdjugfsddeports.fun/embed/telemundo51florida.html', logoUrl: 'https://media.telemundo31.com/2022/11/Telemundo-Noticias-Florida.jpg?quality=85&strip=all&resize=850%2C478' },
    { name: 'TELEMUNDO MIAMI', url: 'https://embed.ksdjugfsddeports.fun/embed/telemundo51.html', logoUrl: 'https://media.telemundo51.com/2022/01/WSCV-51.png?resize=850%2C478&quality=85&strip=all' },
    { name: 'TELEMUNDO PUERTO RICO', url: 'https://embed.ksdjugfsddeports.fun/embed/telemundopuertorico.html', logoUrl: 'https://media.telemundopr.com/2020/12/Telemundo-Puerto-Rico-Julio-2020.png?resize=850%2C478&quality=85&strip=all' },
    { name: 'TLNOVELAS', url: 'https://embed.ksdjugfsddeports.fun/embed/tlnovelas.html', logoUrl: 'https://cdn.mitvstatic.com/channels/ar_tlnovelas_m.png' },
    { name: 'TOONCAST', url: 'https://embed.ksdjugfsddeports.fun/embed/tooncast.html', logoUrl: 'https://cdn.mitvstatic.com/channels/ar_tooncast_m.png' },
    { name: 'Telemetria F1 (SI HAY F1)', url: 'https://alangulo-dashboard-f1.vercel.app', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1280px-F1.svg.png' },
    { name: 'TyC Sports', url: 'https://streamtpglobal.com/global1.php?stream=tycsports', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/54/TyC_Sports_logo.svg' },
    { name: 'TyC Sports Internacional', url: 'https://streamtpglobal.com/global1.php?stream=tycinternacional', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/54/TyC_Sports_logo.svg' },
    { name: 'USA Network', url: 'https://streamtpglobal.com/global1.php?stream=usa_network', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/USA_Network_logo_%282016%29.svg' },
    { name: 'UNICABLE', url: 'https://embed.ksdjugfsddeports.fun/embed/unicable.html', logoUrl: 'https://yt3.googleusercontent.com/Qavdx7MHCieEgzmIZ2QhbdYKzfELtxCP3BUvMMCbrtLt0M2WWYDCD8NkTD150f_0bibG8Ko=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'UNIVERSAL CINEMA', url: 'https://embed.ksdjugfsddeports.fun/embed/universalcinema.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS3ED1lg2jESq3qcELJS23H5T2RBJhUj6aB5g&s' },
    { name: 'UNIVERSAL TV', url: 'https://embed.ksdjugfsddeports.fun/embed/universalchannel.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Universal_TV_logo.svg/1200px-Universal_TV_logo.svg.png' },
    { name: 'Universo USA', url: 'https://streamtpglobal.com/global1.php?stream=universo_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Universo_2017.svg' },
    { name: 'Univisíon', url: 'https://streamtpglobal.com/global1.php?stream=univision_usa', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Logo_Univision_2019.svg' },
    { name: 'VTV +', url: 'https://streamtpglobal.com/global1.php?stream=vtvplus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Logo_VTV_nuevo.png' },
    { name: 'Vamos ES', url: 'https://streamtpglobal.com/global1.php?stream=vamoses', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Vamos_por_Movistar_Plus%2B_2023_Logo.svg/800px-Vamos_por_Movistar_Plus%2B_2023_Logo.svg.png' },
    { name: 'WARNER BROS TV', url: 'https://embed.ksdjugfsddeports.fun/embed/warnerchannel.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5e/Warner2018LA.png' },
    { name: 'WILLAX TV', url: 'https://embed.ksdjugfsddeports.fun/embed/willax.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Willax_Televisi%C3%B3n.png' },
    { name: 'Win Sports', url: 'https://streamtpglobal.com/global1.php?stream=winplusonline1', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'Win Sports', url: 'https://streamtpglobal.com/global1.php?stream=winsports', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'Win Sports +', url: 'https://streamtpglobal.com/global1.php?stream=winplus', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'Win Sports +', url: 'https://streamtpglobal.com/global1.php?stream=winplus2', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'TUDN', url: 'https://embed.ksdjugfsddeports.fun/embed/tudn.html', logoUrl: 'https://corporate.univision.com/newco/wp-content/uploads/2019/05/TUDN_LOGO_COLOR.png' },
    { name: 'GolPeru', url: 'https://embed.ksdjugfsddeports.fun/embed/golperu.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU5NdVG4od9akIwHShMdl92aQzAqGS_V95vA&s' },
    { name: 'TNT Sports', url: 'https://embed.ksdjugfsddeports.fun/embed/tntsports.html', logoUrl: 'https://yt3.googleusercontent.com/nv5OCOIRHGSuTpTqhUrSJlfgZkBxicFbTY_8uXsjLMNrsZ7-TmJSFIvBJdhpxRTOky9kDvRuXJU=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'ESPN Premium', url: 'https://embed.ksdjugfsddeports.fun/embed/espnpremium.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/ESPN_Premium_logo.svg' },
    { name: 'ESPN Premium', url: 'https://embed.ksdjugfsddeports.fun/embed/espnpremiumargentina.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/ESPN_Premium_logo.svg' },
    { name: 'TyC Sports', url: 'https://embed.ksdjugfsddeports.fun/embed/tycsports.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/54/TyC_Sports_logo.svg' },
    { name: 'Fox Sports', url: 'https://embed.ksdjugfsddeports.fun/embed/foxsports.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/FOX_Sports_logo.svg/1200px-FOX_Sports_logo.svg.png' },
    { name: 'Fox Sports 2', url: 'https://embed.ksdjugfsddeports.fun/embed/foxsports2.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Fox_Sports_2_Argentina_2023.svg/1200px-Fox_Sports_2_Argentina_2023.svg.png' },
    { name: 'Fox Sports 3', url: 'https://embed.ksdjugfsddeports.fun/embed/foxsports3.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Fox_Sports_3_Argentina_2023.svg/800px-Fox_Sports_3_Argentina_2023.svg.png' },
    { name: 'Fox Deportes', url: 'https://embed.ksdjugfsddeports.fun/embed/foxdeportes.html', logoUrl: 'https://yt3.googleusercontent.com/ytc/AIdro_kRD_CzEE876U_cVjUDaMF-hFzDQB906eoYWLq1JT0u99Q=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'ESPN', url: 'https://embed.ksdjugfsddeports.fun/embed/espn.html', logoUrl: 'https://themenschonabench.com/wp-content/uploads/2014/05/ESPN-Logo.png' },
    { name: 'ESPN ARGENTINA', url: 'https://embed.ksdjugfsddeports.fun/embed/espnar.html', logoUrl: 'https://a1.espncdn.com/combiner/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png' },
    { name: 'ESPN Colombia', url: 'https://embed.ksdjugfsddeports.fun/embed/espncol.html', logoUrl: 'https://themenschonabench.com/wp-content/uploads/2014/05/ESPN-Logo.png' },
    { name: 'ESPN 2', url: 'https://embed.ksdjugfsddeports.fun/embed/espn2.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/1280px-ESPN2_logo.svg.png' },
    { name: 'ESPN 3', url: 'https://embed.ksdjugfsddeports.fun/embed/espn3.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/51/ESPN3_Logo.png' },
    { name: 'ESPN 4', url: 'https://embed.ksdjugfsddeports.fun/embed/espn4.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/ESPN_4_logo.svg/2560px-ESPN_4_logo.svg.png' },
    { name: 'ESPN 5', url: 'https://embed.ksdjugfsddeports.fun/embed/espn5.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/ESPN_5_logo.svg/2560px-ESPN_5_logo.svg.png' },
    { name: 'ESPN 6', url: 'https://embed.ksdjugfsddeports.fun/embed/espn6.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/ESPN_6_logo.svg/2560px-ESPN_6_logo.svg.png' },
    { name: 'ESPN 7', url: 'https://embed.ksdjugfsddeports.fun/embed/espn7.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/ESPN_7_logo.svg/1280px-ESPN_7_logo.svg.png' },
    { name: 'DIRECTV SPORTS', url: 'https://embed.ksdjugfsddeports.fun/embed/directvsports.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DSports.png' },
    { name: 'DIRECTV SPORTS 2', url: 'https://embed.ksdjugfsddeports.fun/embed/directvsports2.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/8/83/DSports2.png' },
    { name: 'DIRECTV SPORTS +', url: 'https://embed.ksdjugfsddeports.fun/embed/directvsportsplus.html', logoUrl: 'https://d18o29lhcg4kda.cloudfront.net/fit-in/360x270/Y2gwMTAwMDAwMDAwMTM5X2xpbmVhcl9jaGFubmVsX3NzbGE_11002_LOGO_360x270.png?timestamp=1750317237946' },
    { name: 'Fox Sports MX', url: 'https://embed.ksdjugfsddeports.fun/embed/foxsportsmexico.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/FOX_Sports_logo.svg/1200px-FOX_Sports_logo.svg.png' },
    { name: 'Fox Sports 2 MX', url: 'https://embed.ksdjugfsddeports.fun/embed/foxsports2mexico.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Fox_Sports_2_Argentina_2023.svg/1200px-Fox_Sports_2_Argentina_2023.svg.png' },
    { name: 'Fox Sports 3 MX', url: 'https://embed.ksdjugfsddeports.fun/embed/foxsports3mexico.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Fox_Sports_3_Argentina_2023.svg/800px-Fox_Sports_3_Argentina_2023.svg.png' },
    { name: 'ESPN MX', url: 'https://embed.ksdjugfsddeports.fun/embed/espnmexico.html', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/fysmne1660760631.png' },
    { name: 'ESPN 2 MX', url: 'https://embed.ksdjugfsddeports.fun/embed/espn2mexico.html', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/f6gq9s1660760610.png' },
    { name: 'ESPN 3 MX', url: 'https://embed.ksdjugfsddeports.fun/embed/espn3mexico.html', logoUrl: 'https://img2.sport-tv-guide.live/images/tv-station-espn-3-939.png' },
    { name: 'ESPN 4 MX', url: 'https://embed.ksdjugfsddeports.fun/embed/espn4mexico.html', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/fysmne1660760631.png' },
    { name: 'ESPN 5 MX', url: 'https://embed.ksdjugfsddeports.fun/embed/espn5mexico.html', logoUrl: 'https://r2.thesportsdb.com/images/media/channel/logo/fysmne1660760631.png' },
    { name: 'TVC Deportes', url: 'https://embed.ksdjugfsddeports.fun/embed/tvcdeportes.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Tvc_2003.png' },
    { name: 'LIGA 1 MAX', url: 'https://embed.ksdjugfsddeports.fun/embed/liga1max.html', logoUrl: 'https://play-lh.googleusercontent.com/utRBgwflE7hqjt4UvWeNO_AA1MHdP4l9dVD1V38DdRM9GGzxD5xK1iyXRPcnOXV9d6M' },
    { name: 'Fox Sports Premium', url: 'https://embed.ksdjugfsddeports.fun/embed/foxsportspremium.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Fox_Sports_Premium_Argentina_2020.png' },
    { name: 'DAZN F1', url: 'https://embed.ksdjugfsddeports.fun/embed/daznf1.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/7/70/DAZN_F1_logo.png' },
    { name: 'DAZN LaLiga', url: 'https://embed.ksdjugfsddeports.fun/embed/daznlaliga.html', logoUrl: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDZqHtFwkPR8CyxP8MPc2_El0YqtCFF4zzng&s' },
    { name: 'Movistar Liga de Campeones', url: 'https://embed.ksdjugfsddeports.fun/embed/movistarligadecampeones.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Movistar_Liga_de_Campeones.svg/2560px-Movistar_Liga_de_Campeones.svg.png' },
    { name: 'Win Sports', url: 'https://embed.ksdjugfsddeports.fun/embed/winsports.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'Win Sports +', url: 'https://embed.ksdjugfsddeports.fun/embed/winsportsplus.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'Azteca Deportes', url: 'https://embed.ksdjugfsddeports.fun/embed/aztecadeportes.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Aztecadeporteslogo.png/500px-Aztecadeporteslogo.png' },
    { name: 'TNT Sports Chile', url: 'https://embed.ksdjugfsddeports.fun/embed/tntsportschile.html', logoUrl: 'https://yt3.googleusercontent.com/nv5OCOIRHGSuTpTqhUrSJlfgZkBxicFbTY_8uXsjLMNrsZ7-TmJSFIvBJdhpxRTOky9kDvRuXJU=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'Sky Sports Bundesliga', url: 'https://embed.ksdjugfsddeports.fun/embed/skysportsbundesliga.html', logoUrl: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'AZTECA 7', url: 'https://embed.ksdjugfsddeports.fun/embed/azteca7.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/Logo_Azteca_7_2011.svg/1930px-Logo_Azteca_7_2011.svg.png' },
    { name: 'Canal 5', url: 'https://embed.ksdjugfsddeports.fun/embed/canal5.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Canal_5_Mexico_logo_2014.svg' },
    { name: 'TNT', url: 'https://embed.ksdjugfsddeports.fun/embed/tnt.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'Telefe', url: 'https://embed.ksdjugfsddeports.fun/embed/telefe.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Telefe_%28nuevo_logo%29.png' },
    { name: 'History', url: 'https://embed.ksdjugfsddeports.fun/embed/history.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/The_History_Channel_logo.png/250px-The_History_Channel_logo.png' },
    { name: 'History 2', url: 'https://embed.ksdjugfsddeports.fun/embed/history2.html', logoUrl: 'https://cdn.mitvstatic.com/channels/ar_h2_m.png' },
    { name: 'Caracol TV', url: 'https://embed.ksdjugfsddeports.fun/embed/caracol.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Logotipo_de_Caracol_Televisi%C3%B3n_Corporativo.png' },
    { name: 'ATV', url: 'https://embed.ksdjugfsddeports.fun/embed/atv.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/ATV_logo_2020.png' },
    { name: 'Univisíon', url: 'https://embed.ksdjugfsddeports.fun/embed/univision.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Logo_Univision_2019.svg' },
    { name: 'MTV', url: 'https://embed.ksdjugfsddeports.fun/embed/mtv.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/MTV_2021_%28brand_version%29.svg/1200px-MTV_2021_%28brand_version%29.svg.png' },
    { name: 'Comedy Central', url: 'https://embed.ksdjugfsddeports.fun/embed/comedycentral.html', logoUrl: 'https://1000marcas.net/wp-content/uploads/2022/01/Comedy-Central-Productions-Logo.png' },
    { name: 'Nat Geo', url: 'https://embed.ksdjugfsddeports.fun/embed/natgeo.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Nat_Geo_HD.png' },
    { name: 'Animal Planet', url: 'https://embed.ksdjugfsddeports.fun/embed/animalplanet.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/2/20/2018_Animal_Planet_logo.svg' },
    { name: 'TV Pública', url: 'https://embed.ksdjugfsddeports.fun/embed/tvpublica.html', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/TVP_-_Televisi%C3%B3n_P%C3%BAblica_%282021%29.svg/1200px-TVP_-_Televisi%C3%B3n_P%C3%BAblica_%282021%29.svg.png' },
];

const processedChannels: Channel[] = [];
const nameLogoMap = new Map<string, string>();

channelsData.forEach(channel => {
    let normalizedName = channel.name
        .replace(/LATINOAMERICA|ARGENTINA|CHILE|COLOMBIA|USA|MX|PE|ES|GB|BR|NL/g, '')
        .replace(/PLUS|\+/g, '+')
        .replace(/\s+/g, ' ')
        .trim();
    if (normalizedName.startsWith('DIRECTV SPORTS')) {
        normalizedName = 'DIRECTV SPORTS';
    }
    if (normalizedName.startsWith('ESPN PREMIUM')) {
        normalizedName = 'ESPN PREMIUM';
    }
    if (normalizedName === 'M. LIGA DE CAMPEONES'){
      normalizedName = 'Movistar Liga de Campeones';
    }
    if (normalizedName === 'CARACOL'){
      normalizedName = 'Caracol TV';
    }
    if (normalizedName === 'UNIVISION'){
      normalizedName = 'Univisíon';
    }

    if (channel.logoUrl && !channel.logoUrl.includes('placehold.co')) {
        if (!nameLogoMap.has(normalizedName)) {
            nameLogoMap.set(normalizedName, channel.logoUrl);
        }
    }
});

const uniqueChannelsMap = new Map<string, Channel>();
channelsData.forEach(channel => {
  let normalizedName = channel.name
      .replace(/LATINOAMERICA|ARGENTINA|CHILE|COLOMBIA|USA|MX|PE|ES|GB|BR|NL/g, '')
      .replace(/PLUS|\+/g, '+')
      .replace(/\s+/g, ' ')
      .trim();

  if (normalizedName.startsWith('DIRECTV SPORTS')) {
        normalizedName = 'DIRECTV SPORTS';
  }
   if (normalizedName.startsWith('ESPN PREMIUM')) {
        normalizedName = 'ESPN PREMIUM';
  }
  if (normalizedName === 'M. LIGA DE CAMPEONES'){
    normalizedName = 'Movistar Liga de Campeones';
  }
    if (normalizedName === 'CARACOL'){
      normalizedName = 'Caracol TV';
    }
   if (normalizedName === 'UNIVISION'){
      normalizedName = 'Univisíon';
    }

  const finalName = channel.name.trim();
  const logo = nameLogoMap.get(normalizedName) || channel.logoUrl || 'https://placehold.co/24x24.png';
  
  if (!uniqueChannelsMap.has(channel.url)) {
    uniqueChannelsMap.set(channel.url, { ...channel, name: finalName.toUpperCase(), logoUrl: logo });
  }
});

export const channels: Channel[] = Array.from(uniqueChannelsMap.values())
  .sort((a, b) => a.name.localeCompare(b.name));

interface CopiedStates {
  [key: string]: boolean;
}

type ChannelStatus = 'active' | 'inactive' | 'unknown';

interface ChannelListProps {
  channelStatuses: Record<string, 'online' | 'offline'>;
  isLoading: boolean;
  onSelectChannel?: (url: string) => void;
}

export const ChannelListComponent: FC<ChannelListProps> = ({ channelStatuses, isLoading, onSelectChannel }) => {
  const [copiedStates, setCopiedStates] = useState<CopiedStates>({});
  const [searchTerm, setSearchTerm] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const isSelectMode = !!onSelectChannel;

  const getStreamStatus = (url: string): ChannelStatus => {
    if (url.includes('ksdjugfsddeports.fun')) {
      return 'active';
    }

    let streamName: string | null = null;
    try {
        const urlObject = new URL(url);
        if (urlObject.hostname.includes('streamtpglobal.com')) {
            streamName = urlObject.searchParams.get('stream');
        }
    } catch (e) {
        const match = url.match(/[?&]stream=([^&]+)/);
        if (match && match[1]) {
            streamName = match[1];
        }
    }

    if (streamName && channelStatuses[streamName]) {
        return channelStatuses[streamName] === 'online' ? 'active' : 'inactive';
    }

    return 'unknown';
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
    <div className="flex flex-col h-full w-full bg-card text-card-foreground">
      <div className="px-4 py-5 flex-shrink-0 border-b border-border">
        <div className="relative">
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
      <div className="overflow-y-auto flex-grow p-4">
        {filteredChannels.length > 0 ? (
          <ul className="space-y-3">
            {filteredChannels.map((channel) => {
              const status = getStreamStatus(channel.url);
              return (
              <li key={channel.url} className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center flex-1 truncate mr-2">
                  {!isLoading && (
                    <span
                      title={status === 'active' ? 'Activo' : status === 'inactive' ? 'Inactivo' : 'Desconocido'}
                      className={cn("h-2.5 w-2.5 rounded-full mr-3 flex-shrink-0", {
                        'bg-green-500': status === 'active',
                        'bg-red-500': status === 'inactive',
                        'bg-gray-400': status === 'unknown',
                      })}
                    />
                  )}
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
                  onClick={isSelectMode && onSelectChannel ? () => onSelectChannel(channel.url) : () => handleCopy(channel.url)}
                  className={cn(
                    "transition-colors duration-300 w-[140px]",
                    !isSelectMode && copiedStates[channel.url]
                      ? "bg-green-500 hover:bg-green-600 text-white border border-green-500 hover:border-green-600"
                      : "border border-input bg-background hover:bg-accent hover:text-accent-foreground text-foreground"
                  )}
                >
                  {isSelectMode ? (
                    "Seleccionar"
                  ) : (
                    <>
                      {copiedStates[channel.url] ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
                      {copiedStates[channel.url] ? "¡Copiado!" : "Copiar Enlace"}
                    </>
                  )}
                </Button>
              </li>
            )})}
          </ul>
        ) : (
          <p className="text-muted-foreground p-3">
            {searchTerm ? `No se encontraron canales para "${searchTerm}".` : "No hay canales disponibles."}
          </p>
        )}
      </div>
    </div>
  );
};
