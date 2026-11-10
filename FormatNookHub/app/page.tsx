import React from 'react';
import { HeroSection } from '@/components/home/HeroSection';
import { PopularTools } from '@/components/home/PopularTools';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { RecentAndFavoriteTools } from '@/components/home/RecentAndFavoriteTools';
import { AllToolsDirectory } from '@/components/home/AllToolsDirectory';
import { EducationalSection } from '@/components/home/EducationalSection';
import { HomeFAQ } from '@/components/home/HomeFAQ';
import { AdSlot } from '@/components/shared/AdSlot';
import { siteConfig } from '@/config/site';

export default function HomePage() {
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.name,
    url: siteConfig.url,
    description: siteConfig.description,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.url}/tools/{search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

      <HeroSection />

      <div className="container">
        <AdSlot placement="homepage-hero-bottom" slotId="home-slot-1" />
      </div>

      <PopularTools />

      <CategoryGrid />

      <RecentAndFavoriteTools />

      <AllToolsDirectory />

      <EducationalSection />

      <HomeFAQ />
    </>
  );
}
