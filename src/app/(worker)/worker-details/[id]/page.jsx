import LocalIntlProvider from '@/app/LocalIntlProvider';
import { publicService } from '@/services/publicService';
import WorkerDetailsView from '@/views/worker/WorkerDetailsView';
import { publicPageMetadata } from '@/utils/pageSeo';
import { absoluteUrl } from '@/utils/siteUrl';
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

/** Public sitter profile — ISR / SSR compatible. */
export const revalidate = 3600;

async function fetchSitterMeta(id) {
    try {
        const res = await publicService.sitterDetail({ sitter_id: id });
        return res?.data || null;
    } catch (err) {
        console.error('worker-details metadata fetch failed', err);
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { id } = await params;
    const sitter = await fetchSitterMeta(id);
    const name =
        sitter?.name ||
        sitter?.full_name ||
        [sitter?.first_name, sitter?.last_name].filter(Boolean).join(' ') ||
        'Pet Sitter';
    const city = sitter?.city || sitter?.location?.city || '';
    const bio =
        (typeof sitter?.about === 'string' && sitter.about) ||
        (typeof sitter?.bio === 'string' && sitter.bio) ||
        (typeof sitter?.description === 'string' && sitter.description) ||
        '';
    const description =
        (bio && bio.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 160)) ||
        `Meet ${name}${city ? ` in ${city}` : ''} — trusted pet sitter on PawPoint.`;

    return publicPageMetadata({
        title: `${name} | Pet Sitter Profile | PawPoint`,
        description,
        path: `/worker-details/${id}`,
        openGraph: {
            type: 'profile',
            url: absoluteUrl(`/worker-details/${id}`),
        },
    });
}

export default function WorkerDetailsPage({ params }) {
    return (
        <LocalIntlProvider messages={messages}>
            <WorkerDetailsView params={params} />
        </LocalIntlProvider>
    );
}
