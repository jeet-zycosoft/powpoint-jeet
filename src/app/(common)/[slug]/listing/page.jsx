import LocalIntlProvider from '@/app/LocalIntlProvider';
import ListingPageView from '@/views/listing/ListingPageView';
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

/** Public listing — ISR / SSR compatible (UI is client for filters & map). */
export const revalidate = 3600;

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const isOwnerListing = slug === 'owner';
    const path = `/${slug}/listing`;

    if (isOwnerListing) {
        return publicPageMetadata({
            title: 'Find Pet Owners Near You | PawPoint',
            description:
                'Browse pet owners near you looking for sitters. Connect and offer pet care on PawPoint.',
            path,
            keywords: 'pet owners, pet sitting jobs, dog sitting near me',
        });
    }

    return publicPageMetadata({
        title: 'Find Pet Sitters Near You | PawPoint',
        description:
            'Browse trusted pet sitters near you. Filter by location, services, and rates on PawPoint.',
        path,
        keywords: 'pet sitter, dog sitter, pet care, find pet sitter',
    });
}

export default function ListingsPage({ params }) {
    return (
        <LocalIntlProvider messages={messages}>
            <ListingPageView params={params} />
        </LocalIntlProvider>
    );
}
