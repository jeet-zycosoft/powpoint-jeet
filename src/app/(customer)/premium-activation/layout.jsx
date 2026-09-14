import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Premium Activation | PawPoint',
    description: 'Activate PawPoint premium.',
});

export default function PremiumLayout({ children }) {
    return children;
}
