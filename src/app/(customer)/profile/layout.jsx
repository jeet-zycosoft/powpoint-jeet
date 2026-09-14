import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'My Profile | PawPoint',
    description: 'Manage your PawPoint profile.',
});

export default function ProfileLayout({ children }) {
    return children;
}
