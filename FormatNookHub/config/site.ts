export const siteConfig = {
  name: 'FormatNook',
  shortName: 'FormatNook',
  tagline: 'Modern, Private, All-in-One Developer Tools & Utilities',
  description:
    'Free, ultra-fast, privacy-first developer utilities. Format JSON, XML, YAML, beautify SQL, HTML, CSS, JavaScript, and encode/decode Base64 directly in your browser with 100% client-side privacy.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'https://formatnook.com',
  ogImage: '/images/og-formatnook.png',
  links: {
    github: 'https://github.com/formatnook/formatnook',
    twitter: 'https://twitter.com/formatnook',
  },
  adsense: {
    publisherId: process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID || '', // e.g. ca-pub-XXXXXXXXXXXXXXXX
    enabled: process.env.NODE_ENV === 'production' && Boolean(process.env.NEXT_PUBLIC_ADSENSE_PUBLISHER_ID),
  },
  privacy: {
    localProcessingNotice: 'All data processing is performed 100% locally in your browser. Nothing is sent to our servers.',
  },
};
