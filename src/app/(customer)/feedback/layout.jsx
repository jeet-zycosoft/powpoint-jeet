import { privatePageMetadata } from '@/utils/pageSeo';

export const metadata = privatePageMetadata({
    title: 'Feedback | PawPoint',
    description: 'Send feedback to PawPoint.',
});

export default function FeedbackLayout({ children }) {
    return children;
}
