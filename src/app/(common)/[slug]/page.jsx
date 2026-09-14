import { notFound } from 'next/navigation';
import FOOTER_LOCATIONS, { getFooterLocationBySlug, toCitySlug } from '@/data/footerLocations';
import ListingsPage from './listing/page';
import { publicPageMetadata } from '@/utils/pageSeo';

export const revalidate = 3600;

export function generateStaticParams() {
    return FOOTER_LOCATIONS.map((location) => ({ slug: toCitySlug(location.name) }));
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const location = getFooterLocationBySlug(slug);
    if (!location) {
        return publicPageMetadata({
            title: 'Pet Sitters | PawPoint',
            description: 'Find trusted pet sitters near you on PawPoint.',
            path: `/${slug}`,
        });
    }

    const name = location.name;
    return publicPageMetadata({
        title: `Pet Sitters in ${name} | PawPoint`,
        description: `Find trusted pet sitters and pet care in ${name}. Browse local sitters on PawPoint.`,
        path: `/${slug}`,
        keywords: `pet sitter ${name}, dog sitter ${name}, pet care ${name}`,
    });
}

export default async function CityListingsPage({ params }) {
    const { slug } = await params;
    if (!getFooterLocationBySlug(slug)) {
        notFound();
    }

    return <ListingsPage params={params} />;
}
