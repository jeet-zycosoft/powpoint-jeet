'use client';

import UserAvatar from '@/components/UserAvatar';
import { useConversationAlerts } from '@/hooks/useProfileQueries';
import Link from 'next/link';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import './OffcanvasProfile.scss';

const OffcanvasProfile = ({ userInfo, handleClose, handleLogout }) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const [showProfileMenu, setShowProfileMenu] = useState(true);
    const { alertCount } = useConversationAlerts(Boolean(userInfo?.id));

    const menuItems = [
        { labelId: 'profileMenu.advertisements', href: '/advertisements' },
        { labelId: 'profileMenu.conversations', href: '/conversations' },
        { labelId: 'profileMenu.favorites', href: '/favorites' },
        { labelId: 'profileMenu.profile', href: '/profile' },
        { labelId: 'profileMenu.instructions', href: '/instructions' },
        { labelId: 'profileMenu.pawpoint', href: '/pawpoint' },
        { labelId: 'profileMenu.faq', href: '/faq' },
        { labelId: 'profileMenu.terms', href: '/terms' },
        { labelId: 'profileMenu.privacy', href: '/privacy' },
    ];

    return (
        <div className="offcanvas-profile">
            <div className="offcanvas-profile__card">
                <div className="offcanvas-profile__avatar-container">
                    <UserAvatar
                        src={userInfo?.profile_photo}
                        alt={userInfo?.first_name || t('common.user')}
                        className="offcanvas-profile__avatar"
                    />
                </div>
                <div className="offcanvas-profile__details">
                    <span className="offcanvas-profile__name">
                        {userInfo?.first_name} {userInfo?.last_name || ''}
                    </span>
                    <span className="offcanvas-profile__role">
                        {userInfo?.user_type === 'O'
                            ? t('profileMenu.petOwner')
                            : t('profileMenu.petSitter')}
                    </span>
                </div>
            </div>

            <div className="offcanvas-profile__menu">
                <button
                    className={`offcanvas-profile__menu-toggle ${showProfileMenu ? 'active' : ''}`}
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    type="button"
                >
                    <span>{t('profileMenu.myAccount')}</span>
                    <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="arrow-icon"
                    >
                        <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                </button>

                <div className={`offcanvas-profile__menu-items ${showProfileMenu ? 'show' : ''}`}>
                    {menuItems.map((item, index) => {
                        const targetHref =
                            item.href == `/profile` ? `/profile?id=${userInfo?.id}` : item.href;
                        const showCount = item.href === '/conversations' && alertCount > 0;
                        const label = item.labelId ? t(item.labelId) : item.label;

                        return (
                            <Link
                                key={index}
                                href={targetHref}
                                className="offcanvas-profile__menu-link"
                                onClick={handleClose}
                            >
                                <span>{label}</span>
                                {showCount && (
                                    <span className="offcanvas-profile__alert-count">
                                        {alertCount > 99 ? '99+' : alertCount}
                                    </span>
                                )}
                            </Link>
                        );
                    })}
                    <button
                        onClick={() => {
                            handleClose();
                            handleLogout();
                        }}
                        className="offcanvas-profile__logout-btn"
                        type="button"
                    >
                        {t('profileMenu.logout')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OffcanvasProfile;
