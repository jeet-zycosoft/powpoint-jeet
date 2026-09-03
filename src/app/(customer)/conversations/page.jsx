'use client';

import { useIntl } from 'react-intl';
import { useSelector } from 'react-redux';
import Link from 'next/link';

import LocalIntlProvider from '@/app/LocalIntlProvider';
import AuthGuard from '@/components/AuthGuard';
import Loader from '@/components/Loader';
import UserAvatar from '@/components/UserAvatar';
import { useConversationAlerts } from '@/hooks/useProfileQueries';
import { resolveAvatarUrl } from '@/services/avatar';
import { selectUser } from '@/store/features/user/userSlice';
import baseMessages from './intl.yaml';
import en from './translations/en.yaml';
import es from './translations/es.yaml';
import fr from './translations/fr.yaml';
import './conversations.scss';

const messages = {
    ...baseMessages,
    en: { ...baseMessages?.en, ...en },
    es: { ...baseMessages?.es, ...es },
    fr: { ...baseMessages?.fr, ...fr },
};

const ConversationsPageInner = () => {
    const intl = useIntl();
    const { isAuthenticated, userInfo } = useSelector(selectUser);
    const { conversations, isLoading, isError } = useConversationAlerts(Boolean(isAuthenticated));

    const getAvatarUrl = (convo) =>
        resolveAvatarUrl(convo.profile_photo, convo.profile_photo_url);

    const isSitter = userInfo?.user_type === 'S';

    return (
        <AuthGuard>
            <main className="conversations-page">
                <div className="container">
                    <h1 className="section-heading">
                        {intl.formatMessage({ id: 'conversations.title' })}
                    </h1>

                    {isLoading ? (
                        <Loader text={intl.formatMessage({ id: 'conversations.loading' })} />
                    ) : isError ? (
                        <div className="bg-light rounded-3 mt-5 p-5 text-center">
                            <p className="text-danger fs-5">
                                {intl.formatMessage({ id: 'conversations.error' })}
                            </p>
                        </div>
                    ) : conversations.length === 0 ? (
                        <div className="bg-light rounded-3 mt-5 p-5 text-center">
                            <p className="text-muted fs-5">
                                {intl.formatMessage({ id: 'conversations.empty' })}
                            </p>
                            <Link
                                href={isSitter ? '/owner/listing' : '/sitter/listing'}
                                className="btn btn-primary btn-brand-primary mt-2"
                            >
                                {intl.formatMessage({
                                    id: isSitter
                                        ? 'conversations.findOwner'
                                        : 'conversations.findSitter',
                                })}
                            </Link>
                        </div>
                    ) : (
                        <div className="conversations-grid">
                            {conversations.map((convo, index) => {
                                const otherUserId = convo.other_user_id;
                                if (!otherUserId) return null;
                                const unreadCount = convo.unreadCount || 0;
                                return (
                                    <Link
                                        href={`/chat/${otherUserId}`}
                                        key={convo.room_id || otherUserId || index}
                                    >
                                        <div className="conversation-card">
                                            <div className="conversation-card__avatar">
                                                <UserAvatar
                                                    src={getAvatarUrl(convo)}
                                                    alt={
                                                        convo.full_name ||
                                                        intl.formatMessage({
                                                            id: 'conversations.fallbackUser',
                                                        })
                                                    }
                                                    width={60}
                                                    height={60}
                                                />
                                                {unreadCount > 0 && (
                                                    <span className="conversation-card__count">
                                                        {unreadCount > 99 ? '99+' : unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="conversation-card__meta">
                                                <h2>
                                                    {convo.full_name ||
                                                        intl.formatMessage({
                                                            id: 'conversations.fallbackUser',
                                                        })}
                                                </h2>
                                                {convo.pendingAccept && (
                                                    <span className="conversation-card__pending">
                                                        {intl.formatMessage({
                                                            id: 'conversations.pendingAccept',
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </AuthGuard>
    );
};

export default function ConversationsPage() {
    return (
        <LocalIntlProvider messages={messages}>
            <ConversationsPageInner />
        </LocalIntlProvider>
    );
}
