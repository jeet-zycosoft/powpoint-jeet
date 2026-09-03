// import { headers } from 'next/headers';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import HeroSection from '@/views/home/HeroSection';
import HowItWorks from '@/views/worker/HowItWorks';
import ServicesSection from '@/views/worker/ServicesSection';
import Testimonials from '@/views/worker/Testimonials';
import WorkerBenefits from '@/views/worker/WorkerBenefits';
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

export default async function Worker() {
    // const headersList = headers();
    // const city = headersList.get('x-city')

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
