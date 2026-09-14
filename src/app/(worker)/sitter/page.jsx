import LocalIntlProvider from '@/app/LocalIntlProvider';
import HeroSection from '@/views/home/HeroSection';
import HowItWorks from '@/views/worker/HowItWorks';
import ServicesSection from '@/views/worker/ServicesSection';
import Testimonials from '@/views/worker/Testimonials';
import WorkerBenefits from '@/views/worker/WorkerBenefits';
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

const heroSectionData = {
    headingKey: 'sitter.hero.heading',
    descKey: 'sitter.hero.desc',
    buttonTextKey: 'sitter.hero.buttonText',
    buttonLink: '/signup',
    bannerImgLink: '/images/worker-hero.png',
    bannerMobImgLink: '/images/worker-hero-mob.png',
};

/** Public sitter landing — ISR / SSG compatible. */
export const revalidate = 3600;

export const metadata = publicPageMetadata({
    title: 'Become a Pet Sitter | PawPoint',
    description:
        'Join PawPoint as a pet sitter. Offer dog walking, boarding, and pet care services to local pet owners.',
    path: '/sitter',
    keywords: 'become a pet sitter, pet sitting jobs, dog walker',
});

export default async function Worker() {
    return (
        <LocalIntlProvider messages={messages}>
            <main className="home">
                <HeroSection sectionData={heroSectionData} />
                <WorkerBenefits />
                <HowItWorks />
                <Testimonials />
                <ServicesSection />
            </main>
        </LocalIntlProvider>
    );
}
