
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '1000marcas.net' },
      { protocol: 'https', hostname: 'static.wikia.nocookie.net' },
      { protocol: 'https', hostname: 'themenschonabench.com' },
      { protocol: 'https', hostname: 'r2.thesportsdb.com' },
      { protocol: 'https', hostname: 'img2.sport-tv-guide.live' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'resizer.glanacion.com' },
      { protocol: 'https', hostname: 'www.mtv.com' },
      { protocol: 'https', hostname: 'brandfetch.io' },
      { protocol: 'https', hostname: 'asset.brandfetch.io' },
      { protocol: 'https', hostname: 'logosandtypes.com' },
      { protocol: 'https', hostname: 'forounivers.com' },
      { protocol: 'https', hostname: 'en.wikipedia.org' },
      { protocol: 'https', hostname: 'es.wikipedia.org' },
      { protocol: 'https', hostname: 'deadline.com' },
      { protocol: 'https', hostname: 'yt3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.mitvstatic.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'media.telemundo*.com' },
      { protocol: 'https', hostname: 'images.amcselekt.es' },
      { protocol: 'https', hostname: 'cloudfront-us-east-1.images.arcpublishing.com' },
      { protocol: 'https', hostname: 'cdn.storage.foromedios.com' },
      { protocol: 'https', hostname: 'logowik.com' },
      { protocol: 'https', hostname: 'claroperupoc.vtexassets.com' },
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
      { protocol: 'https', hostname: 'streamed.pk' },
      { protocol: 'https', hostname: 'e7.pngegg.com' },
      { protocol: 'https', hostname: 'assets.goal.com' },
      { protocol: 'https', hostname: 'pbs.twimg.com' },
      { protocol: 'https', hostname: 'd18o29lhcg4kda.cloudfront.net' },
      { protocol: 'https', hostname: 'elgarage.com' },
      { protocol: 'https', hostname: 'www.cronica.com.ar' },
      { protocol: 'https', hostname: 'play-lh.googleusercontent.com' },
      { protocol: 'https', hostname: 'tvprofil.com' },
      { protocol: 'https', hostname: 'archive.org' },
      { protocol: 'https', hostname: 'corporate.univision.com' },
      { protocol: 'https', hostname: 's3.glbimg.com' },
      { protocol: 'https', hostname: 'mc-2mhdiicnc6.b-cdn.net' },
      { protocol: 'https', hostname: 'thumbs.poocloud.in' },
      { protocol: 'https', hostname: 'extension.usu.edu' },
      { protocol: 'https', hostname: 'i.imgur.com' },
      { protocol: 'https', hostname: 'cdn.nba.com' },
      { protocol: 'https', hostname: 'wearechecking.online' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    allowedDevOrigins: [
        "https://*.google.com",
        "https://*.cloud.google.com",
        "https://*.run.app",
        "https://*.web.app",
        "https://*.firebaseapp.com",
    ]
  }
};

export default nextConfig;
