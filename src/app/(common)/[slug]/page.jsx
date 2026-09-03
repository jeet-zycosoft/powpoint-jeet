import { notFound } from 'next/navigation';
import FOOTER_LOCATIONS, { getFooterLocationBySlug, toCitySlug } from '@/data/footerLocations';
import ListingsPage from './listing/page';

export function generateStaticParams() {
    return FOOTER_LOCATIONS.map((location) => ({ slug: toCitySlug(location.name) }));
}

export default async function CityListingsPage({ params }) {
    const { slug } = await params;
    if (!getFooterLocationBySlug(slug)) {
        notFound();
    }

    return <ListingsPage params={params} />;
}
