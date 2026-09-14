import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Conversations | PawPoint',
    description: 'Your PawPoint conversations.',
});

export default function ConversationsLayout({ children }) {
    return children;
}
