import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Chat | PawPoint',
    description: 'PawPoint chat.',
});

export default function ChatLayout({ children }) {
    return children;
}
