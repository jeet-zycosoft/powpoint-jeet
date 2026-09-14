import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Payment Error | PawPoint',
    description: 'PawPoint payment error.',
});

export default function PaymentErrorLayout({ children }) {
    return children;
}
