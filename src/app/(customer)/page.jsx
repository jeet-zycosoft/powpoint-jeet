import About from '@/views/home/About';
import BlogSection from '@/views/home/BlogSection';
import FaqSection from '@/views/home/FaqSection';
import FeaturedPetSitters from '@/views/home/FeaturedPetSitters';
import HeroSection from '@/views/home/HeroSection';
import HowItWorks from '@/views/home/HowItWorks';
import Services from '@/views/home/Services';
import Testimonials from '@/views/home/Testimonials';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import { publicPageMetadata } from '@/utils/pageSeo';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

const data = {
    heroSectionData: {
        headingKey: 'home.hero.heading',
        descKey: 'home.hero.desc',
        buttonTextKey: 'home.hero.buttonText',
        bannerImgLink: '/images/pet-banner5.png',
        bannerMobImgLink: '/images/customer-banner-mobile-new.png',
        buttonLink: '/sitter/listing',
    },
};

/** Public home — ISR (SSG-compatible with revalidation). */
export const revalidate = 3600;

export const metadata = publicPageMetadata({
    title: 'PawPoint | Trusted Pet Sitters Near You',
    description:
        'Find vetted pet sitters and trusted pet care near you. Book dog walkers, sitters, and more with PawPoint.',
    path: '/',
    keywords: 'pet sitter, dog sitter, pet care, PawPoint',
});

export default async function Home() {
    return (
        <LocalIntlProvider messages={messages}>
            <main className="home">
                <HeroSection sectionData={data.heroSectionData} showSearch />
                <HowItWorks />
                <Testimonials />
                <About />
                <FeaturedPetSitters />
                <FaqSection />
                <Services />
                <BlogSection />
            </main>
        </LocalIntlProvider>
    );
}
