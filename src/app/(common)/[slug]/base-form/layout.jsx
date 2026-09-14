import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Complete Profile | PawPoint',
    description: 'Complete your PawPoint profile.',
});

export default function BaseFormLayout({ children }) {
    return children;
}
