import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Payment Success | PawPoint',
    description: 'PawPoint payment confirmation.',
});

export default function PaymentSuccessLayout({ children }) {
    return children;
}
