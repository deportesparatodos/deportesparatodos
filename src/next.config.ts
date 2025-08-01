
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // output: 'export', // Cannot be used with API routes
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '', // For GitHub Pages
  images: {
    unoptimized: true, // Required for static export, or configure remotePatterns
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '1000marcas.net' },
      { protocol: 'https', hostname: 'themenschonabench.com' },
      { protocol: 'https', hostname: 'r2.thesportsdb.com' },
      { protocol: 'https', hostname: 'img2.sport-tv-guide.live' },
      { protocol: 'https', hostname: 'i.pinimg.com' },
      { protocol: 'https', hostname: 'resizer.glanacion.com' },
      { protocol: 'https', hostname: 'www.mtv.com' },
      { protocol: 'https', hostname: 'yt3.googleusercontent.com' },
      { protocol: 'https', hostname: 'cdn.mitvstatic.com' },
      { protocol: 'https', hostname: 'i.ibb.co' },
      { protocol: 'https', hostname: 'media.telemundo31.com' },
      { protocol: 'https', hostname: 'media.telemundo51.com' },
      { protocol: 'https', hostname: 'media.telemundopr.com' },
      { protocol: 'https', hostname: 'cloudfront-us-east-1.images.arcpublishing.com' },
      { protocol: 'https', hostname: 'cdn.storage.foromedios.com' },
      { protocol: 'https', hostname: 'logowik.com' },
      { protocol: 'https', hostname: 'claroperupoc.vtexassets.com' },
      { protocol: 'https', hostname: 'a.espncdn.com' },
      { protocol: 'https', hostname: 'cdn-icons-png.flaticon.com' },
      { protocol: 'https', hostname: 'streamed.pk' },
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
      // Generic domains
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.twimg.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.githubusercontent.com' },
      { protocol: 'https', hostname: '**.vercel.app' },
      { protocol: 'https', hostname: 'resend.dev' },
    ],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
