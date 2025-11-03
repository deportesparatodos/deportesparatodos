
export interface Channel {
  name: string;
  urls: { url: string; label: string }[];
  logo: string;
}

const originalChannels: { name: string; url: string; logo: string }[] = [
    { name: "Enlace Propio", url: "clipboard", logo: "https://cdn-icons-png.flaticon.com/512/1168/1168706.png" },
    { name: 'A24', url: 'https://www.youtube-nocookie.com/embed/ArKbAx1K-2U?si=dva3TfB5wNsOERMl', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT8yfXBuQmon9WVy3ETX9fuq0w4U8Hvq391YA&s' },
    { name: 'ATV', url: 'https://elcanaldeportivo.com/atv.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/0/0e/ATV_logo_2020.png' },
    { name: 'Adult Swim', url: 'https://tvlibreonline.org/html/fl/?get=QWR1bHRfU3dpbQ==', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Adult_Swim_2003_logo.svg/2560px-Adult_Swim_2003_logo.svg.png' },
    { name: 'Animal Planet', url: 'https://tvlibreonline.org/html/fl/?get=QW5pbWFsUGxhbmV0', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/20/2018_Animal_Planet_logo.svg' },
    { name: 'Azteca Deportes', url: 'https://streamtpglobal.com/global1.php?stream=azteca_deportes', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Aztecadeporteslogo.png/500px-Aztecadeporteslogo.png' },
    { name: 'C5N', url: 'https://www.youtube-nocookie.com/embed/Uo-ziJhrTvI?si=eZuKm4mlQhiHKAWN', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/C5N_Logo_2015.PNG/640px-C5N_Logo_2015.PNG' },
    { name: 'CRONICA', url: 'https://www.youtube-nocookie.com/embed/avly0uwZzOE', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fb/Crónica_TV_logotipo_%282016%29.png' },
    { name: 'Caliente TV', url: 'https://streamtpglobal.com/global1.php?stream=calientetvmx', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/c8/Caliente_TV_Logo.png' },
    { name: 'Canal 11 PT', url: 'https://streamtpglobal.com/global1.php?stream=canal11_pt', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Logo_Canal_11_FPF.svg/1053px-Logo_Canal_11_FPF.svg.png' },
    { name: 'Canal 5', url: 'https://streamtpglobal.com/global1.php?stream=canal5mx', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1d/Canal_5_Mexico_logo_2014.svg' },
    { name: 'Caracol TV', url: 'https://streamtpglobal.com/global1.php?stream=caracoltv', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/65/Logotipo_de_Caracol_Televisi%C3%B3n_Corporativo.png' },
    { name: 'Comedy Central', url: 'https://tvlibreonline.org/html/fl/?get=Q29tZWR5Q2VudHJhbA', logo: 'https://1000marcas.net/wp-content/uploads/2022/01/Comedy-Central-Productions-Logo.png' },
    { name: 'DAZN 1 ES', url: 'https://streamtpglobal.com/global1.php?stream=dazn1', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a2/DAZN_1_Logo.svg' },
    { name: 'DAZN 2 ES', url: 'https://streamtpglobal.com/global1.php?stream=dazn2', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/DAZN_2.svg/2560px-DAZN_2.svg.png' },
    { name: 'DAZN F1', url: 'https://elcanaldeportivo.com/daznf1.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/70/DAZN_F1_logo.png' },
    { name: 'DAZN LaLiga', url: 'https://streamtpglobal.com/global1.php?stream=dazn_laliga', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRDZqHtFwkPR8CyxP8MPc2_El0YqtCFF4zzng&s' },
    { name: 'DIRECTV SPORTS', url: 'https://streamtpglobal.com/global1.php?stream=dsports', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/5a/DSports.png' },
    { name: 'DIRECTV SPORTS +', url: 'https://streamtpglobal.com/global1.php?stream=dsportsplus', logo: 'https://d18o29lhcg4kda.cloudfront.net/fit-in/360x270/Y2gwMTAwMDAwMDAwMTM5X2xpbmVhcl9jaGFubmVsX3NzbGE_11002_LOGO_360x270.png?timestamp=1750317237946' },
    { name: 'DIRECTV SPORTS 2', url: 'https://streamtpglobal.com/global1.php?stream=dsports2', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/83/DSports2.png' },
    { name: 'ESPN', url: 'https://streamtpglobal.com/global1.php?stream=espn', logo: 'https://themenschonabench.com/wp-content/uploads/2014/05/ESPN-Logo.png' },
    { name: 'ESPN BR', url: 'https://streamtpglobal.com/global1.php?stream=espn1br', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/77/Logo_espnbrasil.png' },
    { name: 'ESPN NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl1', logo: 'https://r2.thesportsdb.com/images/media/channel/logo/wc8dnt1660760493.png' },
    { name: 'ESPN 2', url: 'https://streamtpglobal.com/global1.php?stream=espn2', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/ESPN2_logo.svg/1280px-ESPN2_logo.svg.png' },
    { name: 'ESPN 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn2br', logo: 'https://r2.thesportsdb.com/images/media/channel/logo/b0n0mh1660763068.png' },
    { name: 'ESPN 2 MX', url: 'https://streamtpglobal.com/global1.php?stream=espn2mx', logo: 'https://r2.thesportsdb.com/images/media/channel/logo/f6gq9s1660760610.png' },
    { name: 'ESPN 2 NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl2', logo: 'https://r2.thesportsdb.com/images/media/channel/logo/keezdj1660760512.png' },
    { name: 'ESPN 3', url: 'https://streamtpglobal.com/global1.php?stream=espn3', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/ESPN3_Logo.png' },
    { name: 'ESPN 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn3br', logo: 'https://r2.thesportsdb.com/images/media/channel/logo/3uym3u1660763049.png' },
    { name: 'ESPN 3 MX', url: 'https://streamtpglobal.com/global1.php?stream=espn3mx', logo: 'https://img2.sport-tv-guide.live/images/tv-station-espn-3-939.png' },
    { name: 'ESPN 3 NL', url: 'https://streamtpglobal.com/global1.php?stream=espn_nl3', logo: 'https://r2.thesportsdb.com/images/media/channel/logo/x8t6yd1660760523.png' },
    { name: 'ESPN 4', url: 'https://streamtpglobal.com/global1.php?stream=espn4', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/ESPN_4_logo.svg/2560px-ESPN_4_logo.svg.png' },
    { name: 'ESPN 4 BR', url: 'https://streamtpglobal.com/global1.php?stream=espn4br', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/ESPN_4_logo.svg/1280px-ESPN_4_logo.svg.png' },
    { name: 'ESPN 5', url: 'https://streamtpglobal.com/global1.php?stream=espn5', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/ESPN_5_logo.svg/2560px-ESPN_5_logo.svg.png' },
    { name: 'ESPN 6', url: 'https://streamtpglobal.com/global1.php?stream=espn6', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/ESPN_6_logo.svg/2560px-ESPN_6_logo.svg.png' },
    { name: 'ESPN 7', url: 'https://streamtpglobal.com/global1.php?stream=espn7', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7f/ESPN_7_logo.svg/1280px-ESPN_7_logo.svg.png' },
    { name: 'ESPN ARGENTINA', url: 'https://streamtpglobal.com/global1.php?stream=eventos8', logo: 'https://a.espncdn.com/combiner/i?img=%2Fi%2Fespn%2Fespn_logos%2Fespn_red.png' },
    { name: 'ESPN Deportes USA', url: 'https://streamtpglobal.com/global1.php?stream=espndeportes', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/ESPN_Deportes.svg/1200px-ESPN_Deportes.svg.png' },
    { name: 'ESPN MX', url: 'https://streamtpglobal.com/global1.php?stream=espnmx', logo: 'https://r2.thesportsdb.com/images/media/channel/logo/fysmne1660760631.png' },
    { name: 'ESPN Premium', url: 'https://streamtpglobal.com/global1.php?stream=espnpremium', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a1/ESPN_Premium_logo.svg' },
    { name: 'El canal del Futbol', url: 'https://elcanaldeportivo.com/ecfutbol.php', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQQIkdi0tMnj4tej1cemfhhYuzT6woZTrTIQw&s' },
    { name: 'Eleven Sports 1 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven1_pt', logo: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Eleven_Sports.png' },
    { name: 'Eleven Sports 2 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven2_pt', logo: 'https://tvprofil.com/img/kanali-logo/Eleven_Sports_2_PL_logo.png?1609415475' },
    { name: 'Eleven Sports 3 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven3_pt', logo: 'https://archive.org/download/eleven-sports-3_202305/Eleven_Sports_3.png' },
    { name: 'Eleven Sports 4 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven4_pt', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT6LFknDlsTHhFJbEe_mqO5VgqH1Wz2JeqkTQ&s' },
    { name: 'Eleven Sports 5 PT', url: 'https://streamtpglobal.com/global1.php?stream=eleven5_pt', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTiGRVIPkw4P0uMFbMhjsawmMbroF8ztMaPpg&s' },
    { name: 'Eurosport 1', url: 'https://elcanaldeportivo.com/eurosports1.php', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRa02LLWr8M_-Yu6Q6vr_TRHRe6Y-h5vJYj7A&s' },
    { name: 'Eurosport 2', url: 'https://elcanaldeportivo.com/eurosports2.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Eurosport_2_Logo_2015.svg/2560px-Eurosport_2_Logo_2015.svg.png' },
    { name: 'FUTV (EV)', url: 'https://streamtpglobal.com/global1.php?stream=futv', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTgErhsHjLvKGwZd_6Qfkw3iR1lFl9lNC2smA&s' },
    { name: 'FLOW 1', url: 'https://play.alangulotv.cloud/?channel=flow1', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Flow_2021.jpg' },
    { name: 'FLOW 2', url: 'https://play.alangulotv.cloud/?channel=flow2', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/a6/Flow_2021.jpg' },
    { name: 'Flow Music', url: 'https://tvlibreonline.org/html/fl/?get=Rmxvd19NdXNpY19YUA==', logo: 'https://pbs.twimg.com/profile_images/1445057259780837378/kpDGDIyl_400x400.png' },
    { name: 'Fox Deportes', url: 'https://streamtpglobal.com/global1.php?stream=tubitv1', logo: 'https://assets.goal.com/images/v3/blt38c232d013be3b9f/unnamed.jpg' },
    { name: 'Fox Deportes', url: 'https://streamtpglobal.com/global1.php?stream=fox_deportes_usa', logo: 'https://yt3.googleusercontent.com/ytc/AIdro_kRD_CzEE876U_cVjUDaMF-hFzDQB906eoYWLq1JT0u99Q=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'Fox Sports', url: 'https://streamtpglobal.com/global1.php?stream=fox1ar', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/FOX_Sports_logo.svg/1200px-FOX_Sports_logo.svg.png' },
    { name: 'Fox Sports MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsportsmx', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/FOX_Sports_logo.svg/1200px-FOX_Sports_logo.svg.png' },
    { name: 'Fox Sports USA', url: 'https://streamtpglobal.com/global1.php?stream=fox_1_usa', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/FOX_Sports_logo.svg/1200px-FOX_Sports_logo.svg.png' },
    { name: 'Fox Sports 2', url: 'https://streamtpglobal.com/global1.php?stream=fox2ar', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Fox_Sports_2_Argentina_2023.svg/1200px-Fox_Sports_2_Argentina_2023.svg.png' },
    { name: 'Fox Sports 2 MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsports2mx', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Fox_Sports_2_Argentina_2023.svg/1200px-Fox_Sports_2_Argentina_2023.svg.png' },
    { name: 'Fox Sports 2 USA', url: 'https://streamtpglobal.com/global1.php?stream=fox_2_usa', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Fox_Sports_2_Argentina_2023.svg/1200px-Fox_Sports_2_Argentina_2023.svg.png' },
    { name: 'Fox Sports 3', url: 'https://streamtpglobal.com/global1.php?stream=fox3ar', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Fox_Sports_3_Argentina_2023.svg/800px-Fox_Sports_3_Argentina_2023.svg.png' },
    { name: 'Fox Sports 3 MX', url: 'https://streamtpglobal.com/global1.php?stream=foxsports3mx', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Fox_Sports_3_Argentina_2023.svg/800px-Fox_Sports_3_Argentina_2023.svg.png' },
    { name: 'Fox Sports Premium', url: 'https://streamtpglobal.com/global1.php?stream=foxsportspremium', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cf/Fox_Sports_Premium_Argentina_2020.png' },
    { name: 'Garage TV', url: 'https://tvlibreonline.org/html/fl/?get=RWxfR2FyYWdl', logo: 'https://elgarage.com/wp-content/uploads/2021/04/elgaragetv_WEB.png' },
    { name: 'GolPeru', url: 'https://streamtpglobal.com/global1.php?stream=golperu', logo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQU5NdVG4od9akIwHShMdl92aQzAqGS_V95vA&s' },
    { name: 'GolTV', url: 'https://streamtpglobal.com/global1.php?stream=goltv', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/GOLTV.png' },
    { name: 'Gran Hermano CAM 1', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam1', logo: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'Gran Hermano CAM 2', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam2', logo: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'Gran Hermano CAM 3', url: 'https://streamtpglobal.com/global1.php?stream=grahermanocam3', logo: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'Gran Hermano CAM 24H', url: 'https://streamtpglobal.com/global1.php?stream=granhermanocamara24horas', logo: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'Gran Hermano MultiCAM', url: 'https://streamtpglobal.com/global1.php?stream=granhermanomulticam', logo: 'https://www.cronica.com.ar/__export/1727795734333/sites/cronica/img/2024/10/01/whatsapp_image_2024-10-01_at_11.png_1480801792.png' },
    { name: 'HI! Sports MX', url: 'https://streamtpglobal.com/global1.php?stream=hisports', logo: 'https://yt3.googleusercontent.com/Fjgx6A157keMvkL44bXj2IATT2c8oBvP0UzL4KKKuZYtDB0tx0rUYxwyIjloNch-yzqJd3KhSw=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'History', url: 'https://tvlibreonline.org/html/fl/?get=SGlzdG9yeUhE', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/The_History_Channel_logo.png/250px-The_History_Channel_logo.png' },
    { name: 'History 2', url: 'https://tvlibreonline.org/html/fl/?get=SGlzdG9yeV8y', logo: 'https://cdn.mitvstatic.com/channels/ar_h2_m.png' },
    { name: 'LN+', url: 'https://www.youtube-nocookie.com/embed/YjKklDI5-Uk?si=E6HKT_lf-1DuOpHC', logo: 'https://i.ibb.co/L8y3g3j/ln-logo-black.png' },
    { name: 'LaLiga Hypermotion', url: 'https://streamtpglobal.com/global1.php?stream=laligahypermotion', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/LaLiga_TV_Hypermotion_2023_Logo.svg/1200px-LaLiga_TV_Hypermotion_2023_Logo.svg.png' },
    { name: 'Liga 1 MAX', url: 'https://streamtpglobal.com/global1.php?stream=liga1max', logo: 'https://play-lh.googleusercontent.com/utRBgwflE7hqjt4UvWeNO_AA1MHdP4l9dVD1V38DdRM9GGzxD5xK1iyXRPcnOXV9d6M' },
    { name: 'MTV', url: 'https://tvlibreonline.org/html/fl/?get=TVRWX0hE', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/MTV_2021_%28brand_version%29.svg/1200px-MTV_2021_%28brand_version%29.svg.png' },
    { name: 'Movistar Liga de Campeones', url: 'https://streamtpglobal.com/global1.php?stream=movistarligadecampeones', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/Movistar_Liga_de_Campeones.svg/2560px-Movistar_Liga_de_Campeones.svg.png' },
    { name: 'National Geographic', url: 'https://tvlibreonline.org/html/fl/?get=TmF0R2VvSEQ=', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/22/Nat_Geo_HD.png' },
    { name: 'Premiere 1 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere1', logo: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png' },
    { name: 'Premiere 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere2', logo: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png' },
    { name: 'Premiere 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=premiere3', logo: 'https://s3.glbimg.com/v1/AUTH_36abb2af534644878388f516c38b89ac/prod/home-share-1b75cdaa.png' },
    { name: 'SSC 1', url: 'https://elcanaldeportivo.com/ssc1.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SSC 2', url: 'https://elcanaldeportivo.com/ssc2.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SSC EXTRA 1', url: 'https://elcanaldeportivo.com/sscextra1.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SSC EXTRA 2', url: 'https://elcanaldeportivo.com/sscextra2.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'SSC NEWS', url: 'https://elcanaldeportivo.com/sscnews.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/SSC_TV_logo.svg/1200px-SSC_TV_logo.svg.png' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga1', logo: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga2', logo: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga3', logo: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga4', logo: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sky Sports Bundesliga', url: 'https://streamtpglobal.com/global1.php?stream=sky_bundesliga5', logo: 'https://pbs.twimg.com/media/FYjlInYXEAIfUAT.jpg:large' },
    { name: 'Sport TV BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr1', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_1pt', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 2 BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr2', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 2 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_2pt', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 3 BR', url: 'https://streamtpglobal.com/global1.php?stream=sporttvbr3', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 3 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_3pt', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 4 PT', url: 'https://streamtpglobal.com/global1.php?stream=sportv_4pt', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 5 PT', url: 'https://streamtpglobal.com/global1.php?stream=sporttv5', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'Sport TV 6 PT', url: 'https://streamtpglobal.com/global1.php?stream=sporttv6', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/26/SporTV_2021.png' },
    { name: 'TLC', url: 'https://tvlibreonline.org/html/fl/?get=VExD', logo: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/TLC_logo_%282023%29.svg' },
    { name: 'TN', url: 'https://www.youtube.com/embed/cb12KmMMDJA?si=cX9P4WQnvFfJuYdl', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/TN_todo_noticias_logo.svg/1200px-TN_todo_noticias_logo.svg.png' },
    { name: 'TNT', url: 'https://tvlibreonline.org/html/fl/?get=VE5UX0hEX0FyZw==', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_1_gb', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT 2 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_2_gb', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT UK 2', url: 'https://alangulotv2.com/?channel=tntuk2', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg'},
    { name: 'TNT 3 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_3_gb', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT 4 GB', url: 'https://streamtpglobal.com/global1.php?stream=tnt_4_gb', logo: 'https://upload.wikimedia.org/wikipedia/commons/2/24/TNT_Logo_2016.svg' },
    { name: 'TNT Sports', url: 'https://streamtpglobal.com/global1.php?stream=tntsports', logo: 'https://yt3.googleusercontent.com/nv5OCOIRHGSuTpTqhUrSJlfgZkBxicFbTY_8uXsjLMNrsZ7-TmJSFIvBJdhpxRTOky9kDvRuXJU=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'TNT Sports Chile', url: 'https://streamtpglobal.com/global1.php?stream=tntsportschile', logo: 'https://yt3.googleusercontent.com/nv5OCOIRHGSuTpTqhUrSJlfgZkBxicFbTY_8uXsjLMNrsZ7-TmJSFIvBJdhpxRTOky9kDvRuXJU=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'TSN 1', url: 'https://streamtpglobal.com/global1.php?stream=tsn1', logo: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TSN 2', url: 'https://streamtpglobal.com/global1.php?stream=tsn2', logo: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TSN 3', url: 'https://streamtpglobal.com/global1.php?stream=tsn3', logo: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TSN 4', url: 'https://streamtpglobal.com/global1.php?stream=tsn4', logo: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TSN 5', url: 'https://streamtpglobal.com/global1.php?stream=tsn5', logo: 'https://play-lh.googleusercontent.com/Wfh4tn-kWAGTUIMxVgyZ1g2BEHrdDtjyXwUdqJLwX6w640Lc3DJoLoZqoCSEbYWpTw' },
    { name: 'TV Pública', url: 'https://streamtpglobal.com/global1.php?stream=tv_publica', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/TVP_-_Televisi%C3%B3n_P%C3%BAblica_%282021%29.svg/1200px-TVP_-_Televisi%C3%B3n_P%C3%BAblica_%282021%29.svg.png' },
    { name: 'TVC Deportes', url: 'https://streamtpglobal.com/global1.php?stream=tvc_deportes', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Tvc_2003.png' },
    { name: 'TUDN', url: 'https://streamtpglobal.com/global1.php?stream=TUDNMX', logo: 'https://corporate.univision.com/newco/wp-content/uploads/2019/05/TUDN_LOGO_COLOR.png' },
    { name: 'TUDN USA', url: 'https://streamtpglobal.com/global1.php?stream=tudn_usa', logo: 'https://corporate.univision.com/newco/wp-content/uploads/2019/05/TUDN_LOGO_COLOR.png' },
    { name: 'TELEFE', url: 'https://streamtpglobal.com/global1.php?stream=telefe', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/cc/Telefe_%28nuevo_logo%29.png' },
    { name: 'TELEMUNDO', url: 'https://tvlibreonline.org/html/fl/?get=VGVsZW11bmRvX0hE', logo: 'https://upload.wikimedia.org/wikipedia/commons/6/68/Telemundo_logo_2018.svg' },
    { name: 'Telemetria F1 (SI HAY F1)', url: 'https://alangulo-dashboard-f1.vercel.app', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/F1.svg/1280px-F1.svg.png' },
    { name: 'TyC Sports', url: 'https://streamtpglobal.com/global1.php?stream=tycsports', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/54/TyC_Sports_logo.svg' },
    { name: 'TyC Sports', url: 'https://rereyano.ru/player/3/77', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/54/TyC_Sports_logo.svg' },
    { name: 'TyC Sports', url: 'https://elcanaldeportivo.com/tycsports-sd.php', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/54/TyC_Sports_logo.svg' },
    { name: 'TyC Sports', url: 'https://tvlibreonline.org/html/fl/?get=VHlDU3BvcnQ', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/54/TyC_Sports_logo.svg' },
    { name: 'TyC Sports Internacional', url: 'https://streamtpglobal.com/global1.php?stream=tycinternacional', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/54/TyC_Sports_logo.svg' },
    { name: 'USA Network', url: 'https://streamtpglobal.com/global1.php?stream=usa_network', logo: 'https://upload.wikimedia.org/wikipedia/commons/d/d7/USA_Network_logo_%282016%29.svg' },
    { name: 'Universo USA', url: 'https://streamtpglobal.com/global1.php?stream=universo_usa', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Universo_2017.svg' },
    { name: 'Univisíon', url: 'https://streamtpglobal.com/global1.php?stream=univision_usa', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/af/Logo_Univision_2019.svg' },
    { name: 'VTV +', url: 'https://streamtpglobal.com/global1.php?stream=vtvplus', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/16/Logo_VTV_nuevo.png' },
    { name: 'Vamos ES', url: 'https://streamtpglobal.com/global1.php?stream=vamoses', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Vamos_por_Movistar_Plus%2B_2023_Logo.svg/800px-Vamos_por_Movistar_Plus%2B_2023_Logo.svg.png' },
    { name: 'Win Sports', url: 'https://streamtpglobal.com/global1.php?stream=winplusonline1', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'Win Sports', url: 'https://streamtpglobal.com/global1.php?stream=winsports', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'Win Sports +', url: 'https://streamtpglobal.com/global1.php?stream=winplus', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'Win Sports +', url: 'https://streamtpglobal.com/global1.php?stream=winplus2', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Win_Sports_nuevo_logo.svg/1200px-Win_Sports_nuevo_logo.svg.png' },
    { name: 'NHL Network', url: 'https://streamtpglobal.com/global1.php?stream=nhl_network', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/NHL_Network_2012.svg/1200px-NHL_Network_2012.svg.png' },
    { name: 'Sky Sports News | SSN Breaking Sports News', url: 'https://streamtpglobal.com/global1.php?stream=ssn_gb', logo: 'https://yt3.googleusercontent.com/ImUdu6TuUxSZVnPczkhVenR-hQXUhIwoPXUIvh8hrXBzyewK8Lt0q8N50PYqCihgHeimBLIC=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'ESPN First Take', url: 'https://streamtpglobal.com/global1.php?stream=eventos3', logo: 'https://upload.wikimedia.org/wikipedia/en/1/1f/First_Take_2018_logo.png' },
    { name: 'WWE Network', url: 'https://play.alangulotv.cloud/?channel=wwe', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/88/WWE_Network_logo.svg' },
    { name: 'Tennis Channel', url: 'https://streamtpglobal.com/global1.php?stream=eventos1', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Tennis_Channel_logo.svg/1200px-Tennis_Channel_logo.svg.png' },
    { name: 'Sky Sports Darts', url: 'https://alangulotv2.com/?channel=darts', logo: 'https://yt3.googleusercontent.com/8ypSbNdhnx7_Za4wVJof0G7kYVWdlVJKdoYmtDH_s9fZPIytZ7JqWKWa48_FxUt4RJ9AzKvXoQ=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'Darts TV: All Darts Championship', url: 'https://streamtpglobal.com/global1.php?stream=eventos4', logo: 'https://www.pdc.tv/sites/default/files/event_banner_block/images/PDCTV-logo.png' },
    { name: 'NFL Network', url: 'https://streamtpglobal.com/global1.php?stream=nfl_network', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/8/8f/NFL_Network_logo.svg/1200px-NFL_Network_logo.svg.png' },
    { name: 'Sky Sports Golf', url: 'https://streamtpglobal.com/global1.php?stream=sky_sports_golf_gb', logo: 'https://yt3.googleusercontent.com/ytc/AIdro_kDF3C0A6Zxx37_DKSFEXFnjHbd2pKhjqPD7XaOEy97=s900-c-k-c0x00ffffff-no-rj' },
    { name: 'PGA Tour 2025', url: 'https://streamtpglobal.com/global1.php?stream=eventos7', logo: 'https://gwaa.com/wp-content/uploads/2024/08/Screen-Shot-2024-08-09-at-2.01.35-PM.png' },
    { name: 'NBC Golf Channel', url: 'https://streamtpglobal.com/global1.php?stream=golf_channel_usa', logo: 'https://nbcsports.brightspotcdn.com/dims4/default/a4787f0/2147483647/strip/true/crop/304x171+0+3/resize/1440x810!/quality/90/?url=http%3A%2F%2Fnbc-sports-production-nbc-sports.s3.us-east-1.amazonaws.com%2Fbrightspot%2Fca%2Fb9%2F8521681bbea7ad8b97e57cdcc1f2%2Fnew-golf-channel-logo-304.jpg' },
    { name: 'Fox NRL TV', url: 'https://streamtpglobal.com/global1.php?stream=eventos2', logo: 'https://origin.go.foxsports.com.au/wp-content/uploads/2017/02/aaaa_log_foxl_a-1.png' },
    { name: 'Wimbledon Open', url: 'https://streamtpglobal.com/global1.php?stream=eventos5', logo: 'https://upload.wikimedia.org/wikipedia/en/thumb/b/b9/Wimbledon.svg/1200px-Wimbledon.svg.png' },
    { name: 'MOTORPLAY', url: 'https://motorplay.tv/ar', logo: 'https://images.sftcdn.net/images/t_app-icon-s/p/4f3aa64f-acc9-4554-8cb9-682c6fa7ea47/2151507078/motorplay-logo.' },
    { name: 'DEPORTV', url: 'https://tvlibreonline.org/html/fl/?get=RGVwb3JUVkhE', logo: 'https://imgs.search.brave.com/HcBQTT6eqM33DDQLI1fZ2TfeIByiUGPVgYEPmD5m-vY/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9ibG9n/Z2VyLmdvb2dsZXVz/ZXJjb250ZW50LmNv/bS9pbWcvYi9SMjl2/WjJ4bC9BVnZYc0Vn/M1JsSWtwcTdFdkFZ/Sl9zTHpIMHcwTWZt/c2Q2NFZtcU5PZVhO/NENNQWZ5S01PaGoz/RnloaHZtSkcwd0RY/Ml9PU25zdG0ybVBC/UmhoS1ZyQjdsN2JH/cVE3d1p1dXYxZ1RU/ZE9ndlhwTGlBRXZL/OG1rcjhfSmFaWVlQ/SUtlX0NCVDhqTlhU/QjJaZGEyMGcvczMy/MC9kZXBvcnR2LTIw/MjAucG5n' },
];

const mergedChannels = new Map<string, Channel>();

// 1. Filter out the unwanted domain from the source
const filteredOriginalChannels = originalChannels.filter(channel => 
    !channel.url.includes('embed.ksdjugfsddeports.fun')
);

// 2. Group the clean channels by name and merge their URLs
filteredOriginalChannels.forEach(channel => {
    const existing = mergedChannels.get(channel.name);
    if (existing) {
        // Avoid adding duplicate URLs
        if (!existing.urls.some(u => u.url === channel.url)) {
            let label = `Opción ${existing.urls.length + 1}`;
            if (channel.name === 'Enlace Propio') {
                label = 'Pegar Enlace';
            }
            existing.urls.push({ url: channel.url, label });
        }
    } else {
        let label = 'Opción 1';
        if (channel.name === 'Enlace Propio') {
            label = 'Pegar Enlace';
        }
        mergedChannels.set(channel.name, {
            name: channel.name,
            logo: channel.logo,
            urls: [{ url: channel.url, label }],
        });
    }
});

export const channels: Channel[] = Array.from(mergedChannels.values());

    
    