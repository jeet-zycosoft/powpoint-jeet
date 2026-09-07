'use client';
import './style.scss';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useIntl } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';

import UserAvatar from '@/components/UserAvatar';
import Loader from '@/components/Loader';
import { selectUser, replaceUserInfo, updateServiceDetails } from '@/store/features/user/userSlice';
import { ownerService } from '@/services/ownerService';
import { sitterService } from '@/services/sitterService';
import { unwrapOwnProfile, unwrapOwnService, formatLanguagesList } from '@/services/profileHelpers';
import ManageSubscriptions from './ManageSubscriptions';

const EditIcon = () => (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M10.5 25.5195L17.1195 25.497L31.5675 11.187C32.1345 10.62 32.4465 9.86701 32.4465 9.06601C32.4465 8.26501 32.1345 7.51201 31.5675 6.94501L29.1885 4.56601C28.0545 3.43201 26.076 3.43801 24.951 4.56151L10.5 18.8745V25.5195ZM27.0675 6.68701L29.451 9.06151L27.0555 11.4345L24.6765 9.05701L27.0675 6.68701ZM13.5 20.1255L22.545 11.166L24.924 13.545L15.8805 22.5015L13.5 22.509V20.1255Z"
            fill="#afaeac"
        />
        <path
            d="M7.5 31.5H28.5C30.1545 31.5 31.5 30.1545 31.5 28.5V15.498L28.5 18.498V28.5H12.237C12.198 28.5 12.1575 28.515 12.1185 28.515C12.069 28.515 12.0195 28.5015 11.9685 28.5H7.5V7.5H17.7705L20.7705 4.5H7.5C5.8455 4.5 4.5 5.8455 4.5 7.5V28.5C4.5 30.1545 5.8455 31.5 7.5 31.5Z"
            fill="#afaeac"
        />
    </svg>
);

const ProfileViewPage = ({ id }) => {
    const intl = useIntl();
    const t = (key, values) => intl.formatMessage({ id: key }, values);
    const router = useRouter();
    const dispatch = useDispatch();
    const { userInfo, serviceDetails } = useSelector(selectUser);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);

    const userType = userInfo?.user_type;

    useEffect(() => {
        const loadProfile = async () => {
            if (!userType) return;

            setIsLoadingProfile(true);
            try {
                const fetchProfile =
                    userType === 'S' ? sitterService.fetchProfile : ownerService.fetchProfile;
                const fetchService =
                    userType === 'S' ? sitterService.fetchService : ownerService.fetchService;

                const [profileRes, serviceRes] = await Promise.all([
                    fetchProfile().catch((err) => {
                        console.error('Error fetching profile:', err);
                        return null;
                    }),
                    fetchService().catch((err) => {
                        console.error('Error fetching service details:', err);
                        return null;
                    }),
                ]);

                if (profileRes) {
                    const cleanProfile = unwrapOwnProfile(profileRes);
                    dispatch(replaceUserInfo(cleanProfile));
                }

                if (serviceRes) {
                    const cleanService = unwrapOwnService(serviceRes);
                    dispatch(updateServiceDetails(cleanService));
                }
            } catch (error) {
                console.error('Error loading profile:', error);
            } finally {
                setIsLoadingProfile(false);
            }
        };

        loadProfile();
    }, [userType, userInfo?.id, dispatch]);

    if (isLoadingProfile && !userInfo?.first_name) {
        return (
            <div className="owner-profile-container container">
                <Loader />
            </div>
        );
    }

    const available_days = Object.entries(
        serviceDetails?.available_days || serviceDetails?.weekday_availability || {},
    )
        .reduce((acc, [name, checked]) => {
            if (checked) {
                acc.push(name.charAt(0).toUpperCase() + name.slice(1));
            }
            return acc;
        }, [])
        .join(', ');
    const languages = formatLanguagesList(serviceDetails?.languages, t('profile.none'));

    return (
        <div className="owner-profile-container container">
            <h1 className="main-title">{t('profile.title')}</h1>

            <section className="profile-section solid-bg">
                <button
                    className="edit-button"
                    onClick={() => {
                        router.push(userType === 'O' ? '/customer/base-form' : '/worker/base-form');
                    }}
                >
                    <EditIcon />
                </button>
                <div className="card-content">
                    <UserAvatar
                        src={userInfo?.profile_photo}
                        alt={
                            userInfo?.full_name ||
                            `${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`
                        }
                        width={120}
                        height={120}
                        className="profile-picture"
                    />
                    <div className="personal-info">
                        <h2 className="profile-section__heading">{t('profile.personalData')}</h2>
                        <p className="item">
                            {t('profile.name')} :{' '}
                            <span className="value">{`${userInfo?.first_name} ${userInfo?.last_name}`}</span>
                        </p>
                        <p className="item">
                            {t('profile.personalMessage')} :{' '}
                            <span className="value">{userInfo?.profile_title}</span>
                        </p>
                    </div>
                </div>
            </section>

            <section className="profile-section">
                <button
                    className="edit-button"
                    onClick={() => {
                        router.push(
                            userType === 'O' ? '/customer/base-form2' : '/worker/base-form2',
                        );
                    }}
                >
                    <EditIcon />
                </button>
                <h2 className="profile-section__heading">{t('profile.myAdvertisement')}</h2>
                <div className="card-content advertisement-content">
                    <div className="ad-details">
                        <p className="item">
                            {t('profile.address')} : <span className="value">{userInfo?.address}</span>
                        </p>
                        {serviceDetails?.max_distance && (
                            <p className="item">
                                {t('profile.maximumDistance')} :{' '}
                                <span className="value">{serviceDetails?.max_distance} km</span>
                            </p>
                        )}
                    </div>
                    <div className="ad-details">
                        <p className="item">
                            {t('profile.availability')} :{' '}
                            <span className="value">{available_days || t('profile.none')}</span>
                        </p>
                        <p className="item">
                            {t('profile.languages')} : <span className="value">{languages}</span>
                        </p>
                    </div>
                </div>
            </section>

            <ManageSubscriptions userType={userType} />

            <section className="profile-section">
                <div className="card-header">
                    <h2 className="profile-section__heading">{t('profile.notificationSettings')}</h2>
                </div>
                <div className="card-content notification-setting">
                    <div className="subscription-item">
                        <input type="checkbox" id="notify-new-users" defaultChecked />
                        <label htmlFor="notify-new-users">
                            <strong>{t('profile.notifications.newUsers.title')}</strong>
                            <span>{t('profile.notifications.newUsers.description')}</span>
                        </label>
                    </div>
                    <div className="subscription-item">
                        <input type="checkbox" id="notify-personal-messages" defaultChecked />
                        <label htmlFor="notify-personal-messages">
                            <strong>{t('profile.notifications.personalMessages.title')}</strong>
                            <span>{t('profile.notifications.personalMessages.description')}</span>
                        </label>
                    </div>
                    <div className="subscription-item">
                        <input type="checkbox" id="notify-new-match-alerts" />
                        <label htmlFor="notify-new-match-alerts">
                            <strong>{t('profile.notifications.newMatchAlerts.title')}</strong>
                            <span>{t('profile.notifications.newMatchAlerts.description')}</span>
                        </label>
                    </div>
                </div>
            </section>

            <section className="profile-section solid-bg">
                <div className="btn-section">
                    <button className="btn text-danger">{t('profile.deleteAccount')}</button>
                </div>
            </section>
        </div>
    );
};

export default ProfileViewPage;
