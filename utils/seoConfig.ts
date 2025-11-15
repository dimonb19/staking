import type { ManifestOptions } from 'vite-plugin-pwa';

/**
 * Defines the default SEO configuration for the website.
 */
export const seoConfig = {
  baseURL: 'https://dgrslabs.ink',
  title: 'Staking | DGRS LABS',
  description:
    'Potentials Staking lets holders lock NFTs by months, disable transfers while locked, and manage stakes from one page.',
  type: 'website',
  image: {
    url: 'https://media.dgrslabs.ink/assets/logo.png',
    alt: 'DGRS LABS',
    width: 480,
    height: 480,
    type: 'image/png',
  },
  siteName: 'Staking | DGRS LABS',
  locale: 'en_US',
  twitter: {
    card: 'summary_large_image',
    site: '@dgrs_labs',
    creator: '@Maxi_maximalist',
  },
};

/**
 * Defines the configuration for PWA webmanifest.
 */
export const manifest: Partial<ManifestOptions> = {
  name: 'Staking | DGRS LABS',
  short_name: 'Staking',
  description:
    'Potentials Staking lets holders lock NFTs by months, disable transfers while locked, and manage stakes from one page.',
  display: 'fullscreen',
  start_url: '/',
  background_color: '#000000',
  theme_color: '#161e5f',
  lang: 'en-US',
  orientation: 'any',
  prefer_related_applications: false,
  categories: ['games', 'entertainment', 'education'],
  // screenshots: [
  //   {
  //     src: "screenshots/pc-1.webp",
  //     sizes: "2880x1800",
  //     type: "image/webp",
  //     form_factor: "wide",
  //     label: "Home screen",
  //   },
  //   {
  //     src: "screenshots/mobile-1.webp",
  //     sizes: "591x1131",
  //     type: "image/webp",
  //     form_factor: "narrow",
  //     label: "Home screen",
  //   },
  // ],
  icons: [
    {
      src: '/icons/icon-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: '/icons/icon-512.png',
      sizes: '512x512',
      type: 'image/png',
      purpose: 'maskable',
    },
  ],
};
