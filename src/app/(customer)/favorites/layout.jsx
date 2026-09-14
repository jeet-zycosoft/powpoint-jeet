import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Favorites | PawPoint',
    description: 'Your favorite pet sitters on PawPoint.',
});

export default function FavoritesLayout({ children }) {
    return children;
}
