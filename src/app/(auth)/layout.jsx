import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Account | PawPoint',
    description: 'PawPoint authentication and account recovery.',
});

export default function AuthLayout({ children }) {
    return children;
}
