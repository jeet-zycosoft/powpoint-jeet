'use client';
import UserAvatar from '@/components/UserAvatar';
import { useConversationAlerts } from '@/hooks/useProfileQueries';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import './ProfileDropdown.scss';

const ProfileDropdown = ({ userInfo, onLogout }) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { alertCount } = useConversationAlerts(Boolean(userInfo?.id));

    const toggleDropdown = () => setIsOpen(!isOpen);

    const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
            setIsOpen(false);
        }
    };

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const menuItems = [
        // { label: 'Advertisements', href: '/advertisements' },
        { labelId: 'profileMenu.conversations', href: '/conversations' },
        { labelId: 'profileMenu.favorites', href: '/favorites' },
        { labelId: 'profileMenu.profile', href: '/profile' },
        // { labelId: 'profileMenu.instructions', href: '/instructions' },
        { label: 'FAQ', href: '/faq' },
        { label: 'General terms & Conditions', href: '/terms-and-conditions' },
        { label: 'Privacy Policy', href: '/privacy-policy' },
    ];

    return (
        <div className="profile-dropdown-container" ref={dropdownRef}>
            <button className="profile-btn" onClick={toggleDropdown}>
                <UserAvatar
                    src={userInfo?.profile_photo}
                    alt={userInfo?.first_name || t('common.user')}
                    width={32}
                    height={32}
                    className="profile-img"
                />
                <span>
                    {userInfo?.first_name}
                </span>
                {alertCount > 0 && (
                    <span className="profile-alert-count">{alertCount > 99 ? '99+' : alertCount}</span>
                )}
            </button>

            <div className={`dropdown-menu-custom ${isOpen ? 'show' : ''}`}>
                <ul>
                    {/* {console.log(userInfo.user_type)} */}

                    {menuItems.map((item, index) => {
                        const targetHref =
                            item.href == `/profile` ? `/profile?id=${userInfo?.id}` : item.href;
                        const showCount = item.href === '/conversations' && alertCount > 0;
                        const label = item.labelId ? t(item.labelId) : item.label;
                        return (
                            <li key={index}>
                                <Link href={targetHref} onClick={() => setIsOpen(false)}>
                                    <span>{label}</span>
                                    {showCount && (
                                        <span className="menu-alert-count">
                                            {alertCount > 99 ? '99+' : alertCount}
                                        </span>
                                    )}
                                </Link>
                            </li>
                        );
                    })}
                    <li className="divider"></li>
                    <li className="logout-item">
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                onLogout();
                            }}
                        >
                            {t('profileMenu.logout')}
                        </button>
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default ProfileDropdown;
