'use client';

import { sitterService } from '@/services/sitterService';
import { selectUser } from '@/store/features/user/userSlice';
import GallerySwiper from '@/views/worker/gallerySwiper';
import { useEffect, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { TbX } from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import './SitterModal.scss';

import ChatModal from '@/components/ChatModal';
import UserAvatar from '@/components/UserAvatar';
import AddToFevouriteBtn from '@/components/formComponents/addToFevouriteBtn';
import { resolveAvatarUrl } from '@/services/avatar';
import { chatService } from '@/services/chatService';
import { isDifferentArea, parseCanChat, pickUserLocation } from '@/services/chatHelpers';
import { handleReplaceLocationAction } from '@/services/replaceLocationFlow';
import { publicService } from '@/services/publicService';
import { useRouter } from 'next/navigation';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';

const VerifyIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M12.0572 22.5035C11.1189 22.4301 10.1572 24.3385 8.51521 23.947C6.61172 23.4932 6.75413 21.0655 6.21641 20.5461C5.58307 19.9345 3.96453 20.8153 2.51021 19.5675C1.20336 18.4462 2.60872 15.8485 2.51021 15.3347C2.36479 14.5762 -0.0292087 13.6917 0.00026999 12.0072C0.029104 10.3596 2.27561 9.3893 2.48672 8.85103C2.76033 8.15343 1.47324 6.2237 2.27561 4.76509C3.09661 3.27262 5.7238 3.88488 6.12257 3.59068C6.75591 3.12342 6.61562 0.678973 8.23371 0.116405C9.92264 -0.470794 11.3066 1.55993 12.0807 1.55993C12.6905 1.55994 14.2153 -0.504368 15.8338 0.116405C17.4523 0.737179 17.3116 3.24815 18.0153 3.61515C18.627 3.93417 20.7573 3.26412 21.6981 4.59382C22.8406 6.20862 21.2289 8.0681 21.6043 8.77763C22.0403 9.60205 24.0907 10.2701 23.9969 12.0806C23.9031 13.8912 21.9303 14.356 21.6043 15.2369C21.3325 15.9709 22.8024 18.0261 21.745 19.3228C20.4079 20.9625 18.5548 19.955 17.9684 20.4483C17.2412 21.0599 17.394 23.3631 15.8104 23.8736C14.0276 24.4483 12.9955 22.5769 12.0572 22.5035Z"
            fill="#16E600"
        />
        <path
            d="M16.5377 8.63102C17.053 9.19374 16.6784 9.92775 16.6784 9.92775L11.5592 15.3531C11.1666 15.7691 10.5058 15.7718 10.11 15.3589L7.48324 12.6191C7.48324 12.6191 7.03751 11.9096 7.55358 11.2979C8.13527 10.6084 8.93757 11.2 8.93757 11.2L10.8376 13.1329L15.2475 8.50868C15.2475 8.50868 16.0223 8.0683 16.5377 8.63102Z"
            fill="white"
            stroke="white"
        />
    </svg>
);

const StarRating = ({ rating }) => {
    return (
        <div className="star-rating">
            <span className="star">&#9733;</span>
            <span className="star">&#9733;</span>
            <span className="star">&#9733;</span>
            <span className="star">&#9733;</span>
            <span className="star">&#9733;</span>
            <span className="rating-text">{rating}</span>
        </div>
    );
};

const SitterModal = ({ sitter, onClose, onFavoriteToggle }) => {
    const intl = useIntl();
    const router = useRouter();
    const dispatch = useDispatch();
    const { isAuthenticated, userInfo } = useSelector(selectUser);
    const isSitterLoggedIn = userInfo?.user_type === 'S';

    const [ownerDetails, setOwnerDetails] = useState(null);
    const [loading, setLoading] = useState(false);

    // Chat states
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatUiAction, setChatUiAction] = useState('');
    const [chatMessage, setChatMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatActionInProgress, setChatActionInProgress] = useState(false);
    const [sitterQuota, setSitterQuota] = useState(null);
    const [isFavorite, setIsFavorite] = useState(Boolean(sitter?.isInFev));

    useEffect(() => {
        setIsFavorite(Boolean(sitter?.isInFev));
    }, [sitter?.id, sitter?.isInFev]);

    const handleFavoriteClick = async () => {
        if (!isAuthenticated) {
            toast.info(intl.formatMessage({ id: 'sitterModal.loginFavorite' }));
            router.push('/login');
            return;
        }
        if (!sitter?.id) return;

        try {
            if (isFavorite) {
                await publicService.favoriteRemove({ sitter_id: sitter.id });
                setIsFavorite(false);
                toast.success(intl.formatMessage({ id: 'sitterModal.removeSuccess' }));
                onFavoriteToggle?.(sitter, false);
            } else {
                await publicService.favoriteAdd({ favorited_user_id: sitter.id });
                setIsFavorite(true);
                toast.success(intl.formatMessage({ id: 'sitterModal.addSuccess' }));
                onFavoriteToggle?.(sitter, true);
            }
        } catch (err) {
            console.error('Error updating favorite:', err);
            toast.error(intl.formatMessage({ id: 'sitterModal.favoriteError' }));
        }
    };

    useEffect(() => {
        if (!sitter || !sitter.id || !isSitterLoggedIn) {
            setOwnerDetails(null);
            return;
        }

        const fetchOwnerData = async () => {
            try {
                setLoading(true);
                const res = await sitterService.ownerDetail({ sitter_id: sitter.id });
                const detail = res?.data || res;
                console.log(detail);
                if (detail) {
                    setOwnerDetails(detail);
                }
            } catch (err) {
                console.error('Error fetching owner detail in modal:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchOwnerData();
    }, [sitter, isSitterLoggedIn]);

    const handleChatClick = async (e) => {
        if (e) e.preventDefault();

        if (!isAuthenticated) {
            toast.info('Please log in to chat.');
            router.push('/login');
            return;
        }

        try {
            setIsChatLoading(true);
            const response = await chatService.canChat({ other_user_id: sitter.id });
            const chatData = parseCanChat(response);
            setSitterQuota(chatData.sitterQuota);

            if (chatData.uiAction === 'OPEN_CHAT') {
                await chatService.start({ other_user_id: sitter.id });
                router.push(`/chat/${sitter.id}`);
            } else {
                setChatUiAction(chatData.uiAction);
                setChatMessage(chatData.message);
                setIsChatModalOpen(true);
            }
        } catch (err) {
            console.error('Error initiating chat:', err);
            toast.error('Failed to verify chat status.');
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleAcceptConversation = async () => {
        try {
            setChatActionInProgress(true);
            await chatService.acceptConversation({ other_user_id: sitter.id });
            toast.success('Conversation accepted!');

            await chatService.start({ other_user_id: sitter.id });
            setIsChatModalOpen(false);
            router.push(`/chat/${sitter.id}`);
        } catch (err) {
            console.error('Error accepting conversation:', err);
            toast.error('Failed to accept conversation.');
        } finally {
            setChatActionInProgress(false);
        }
    };

    const handleDeclineConversation = async () => {
        try {
            setChatActionInProgress(true);
            await chatService.declineConversation({ other_user_id: sitter.id });
            toast.info('Conversation declined.');
            setIsChatModalOpen(false);
        } catch (err) {
            console.error('Error declining conversation:', err);
            toast.error('Failed to decline conversation.');
        } finally {
            setChatActionInProgress(false);
        }
    };

    const handleModalAction = async (type, options = {}) => {
        if (type === 'replaceLocation') {
            const { sitterLocation, setReplacingLocation } = options;

            const result = await handleReplaceLocationAction({
                sitterLocation,
                setReplacingLocation,
                dispatch,
                router,
                onClose: () => setIsChatModalOpen(false),
            });

            if (result.ok) {
                toast.success(result.message);
            } else {
                toast.error(result.message);
            }
        } else if (type === 'purchase') {
            const reason = options.reason || 'location';
            setIsChatModalOpen(false);
            router.push(`/premium-activation?reason=${reason}`);
        } else if (type === 'profile') {
            setIsChatModalOpen(false);
            router.push(`/customer/base-form2?returnTo=/premium-activation&reason=location`);
        }
    };

    if (!sitter) return null;

    // Handle outside click to close
    const handleOverlayClick = (e) => {
        if (e.target.classList.contains('sitter-modal-overlay')) {
            onClose();
        }
    };

    const getProfileImage = () => {
        let img = '';
        if (isSitterLoggedIn) {
            img =
                ownerDetails?.profile_image ||
                ownerDetails?.profile_photo ||
                ownerDetails?.image ||
                sitter.profile_image ||
                sitter.profile_photo ||
                sitter.image ||
                '';
        } else {
            img = sitter.profile_image || sitter.profile_photo || sitter.image || '';
        }

        if (img && typeof img === 'object' && img.url) {
            img = img.url;
        }

        return resolveAvatarUrl(img);
    };

    const getName = () => {
        if (isSitterLoggedIn) {
            return (
                ownerDetails?.full_name ||
                ownerDetails?.name ||
                (ownerDetails?.first_name
                    ? `${ownerDetails.first_name} ${ownerDetails.last_name || ''}`.trim()
                    : sitter.name)
            );
        }
        return sitter.name;
    };

    const getLocation = () => {
        const rawLoc = isSitterLoggedIn
            ? ownerDetails?.location || ownerDetails?.address || sitter.location
            : sitter.location;

        if (!rawLoc) return 'Kolkata, India';

        if (typeof rawLoc === 'string') {
            return rawLoc;
        }

        // If rawLoc is an object (e.g. {lat, long}), format using city/country or address
        const sourceObj = isSitterLoggedIn ? ownerDetails || sitter : sitter;
        if (sourceObj?.city || sourceObj?.country) {
            return `${sourceObj.city || ''}${sourceObj.city && sourceObj.country ? ', ' : ''}${sourceObj.country || ''}`.trim();
        }
        if (sourceObj?.address && typeof sourceObj.address === 'string') {
            return sourceObj.address;
        }

        return 'Kolkata, India';
    };

    const getActiveSince = () => {
        const dateStr = isSitterLoggedIn ? ownerDetails?.created_at : sitter?.created_at;
        if (!dateStr) return 'March 28, 2025';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return 'March 28, 2025';
        }
    };

    const getLastVisit = () => {
        const dateStr = isSitterLoggedIn ? ownerDetails?.last_login : sitter?.last_login;
        if (!dateStr) return '4 months ago';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
            });
        } catch {
            return '4 months ago';
        }
    };

    const getLanguages = () => {
        const langs = isSitterLoggedIn
            ? ownerDetails?.languages || ownerDetails?.service_details?.languages
            : sitter?.languages || sitter?.service_details?.languages;

        if (Array.isArray(langs)) {
            return langs.map((l) => l.lang_long || l.long || l.name || l).join(', ');
        }
        if (typeof langs === 'string') return langs;
        return 'Dutch, English';
    };

    const getTypesOfPets = () => {
        if (isSitterLoggedIn) {
            return (
                ownerDetails?.typesOfPets ||
                ownerDetails?.types_of_pet ||
                sitter.typesOfPets ||
                'Dogs, Cats'
            );
        }
        return sitter.typesOfPets || 'Dogs, Cats';
    };

    const getAboutText = () => {
        if (isSitterLoggedIn) {
            return (
                ownerDetails?.bio ||
                ownerDetails?.profile_title ||
                ownerDetails?.profileSnippet ||
                sitter.profileSnippet ||
                'Pet owner looking for a reliable and verified pet helper in their area. Please feel free to send a message to connect!'
            );
        }
        return (
            sitter.profileSnippet ||
            'Professional and highly rated pet care provider ready to help.'
        );
    };

    return (
        <div className="sitter-modal-overlay" onClick={handleOverlayClick}>
            <div className="sitter-modal">
                <button className="close-btn" onClick={onClose}>
                    <TbX size={24} />
                </button>

                <div className="sitter-modal-content">
                    {loading ? (
                        <div
                            className="d-flex flex-column align-items-center justify-content-center"
                            style={{ minHeight: '300px' }}
                        >
                            <Spinner
                                animation="border"
                                style={{ width: '3rem', height: '3rem', color: '#1A4A38' }}
                            />
                            <p className="text-muted mt-3">
                                {intl.formatMessage({ id: 'common.loading' })}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="modal-header">
                                <div className="profile-image-container">
                                    <UserAvatar
                                        src={getProfileImage()}
                                        alt={getName()}
                                        width={120}
                                        height={120}
                                        className="profile-image"
                                    />
                                    <div className="verify-badge">
                                        <VerifyIcon />
                                    </div>
                                </div>
                                <h2 className="sitter-name">{getName()}</h2>
                                {!isSitterLoggedIn && <StarRating rating="4.9/5" />}
                                <p className="sitter-location">
                                    {intl.formatMessage({ id: 'sitterModal.location' })} :{' '}
                                    {getLocation()}
                                </p>
                            </div>

                            <div className="action-buttons-top">
                                <button
                                    onClick={handleChatClick}
                                    className="btn-chat"
                                    disabled={isChatLoading}
                                >
                                    {isChatLoading ? (
                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                            <Spinner animation="border" size="sm" />
                                            Verifying...
                                        </span>
                                    ) : (
                                        intl.formatMessage({ id: 'common.chat' })
                                    )}
                                </button>
                                {isAuthenticated && (
                                    <AddToFevouriteBtn
                                        className="btn-favorite"
                                        active={isFavorite}
                                        onClick={handleFavoriteClick}
                                        label={intl.formatMessage({ id: 'sitterModal.favorite' })}
                                    />
                                )}
                            </div>

                            <div className="sitter-stats">
                                <div className="stat-item">
                                    <span className="stat-label">Active since</span>
                                    <span className="stat-value">{getActiveSince()}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Language</span>
                                    <span className="stat-value">{getLanguages()}</span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Type of pets</span>
                                    <span className="stat-value">{getTypesOfPets()}</span>
                                </div>
                                {isSitterLoggedIn && (ownerDetails?.age || ownerDetails?.exp) ? (
                                    <div className="stat-item">
                                        <span className="stat-label">
                                            {ownerDetails?.age ? 'Age' : 'Experience'}
                                        </span>
                                        <span className="stat-value">
                                            {ownerDetails?.age
                                                ? `${ownerDetails.age} Years`
                                                : `${ownerDetails.exp} Years`}
                                        </span>
                                    </div>
                                ) : !isSitterLoggedIn && (sitter.age || sitter.exp) ? (
                                    <div className="stat-item">
                                        <span className="stat-label">
                                            {sitter.age ? 'Age' : 'Experience'}
                                        </span>
                                        <span className="stat-value">
                                            {sitter.age
                                                ? `${sitter.age} Years`
                                                : `${sitter.exp} Years`}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="stat-item">
                                        <span className="stat-label">Last visit</span>
                                        <span className="stat-value">{getLastVisit()}</span>
                                    </div>
                                )}
                            </div>

                            {(() => {
                                let gallery = isSitterLoggedIn
                                    ? ownerDetails?.gallery_photos || []
                                    : sitter?.gallery_photos || [];

                                if (typeof gallery === 'string') {
                                    try {
                                        gallery = JSON.parse(gallery);
                                    } catch {
                                        gallery = gallery ? [gallery] : [];
                                    }
                                }

                                if (!Array.isArray(gallery) || gallery.length === 0) {
                                    return null;
                                }

                                return (
                                    <div className="sitter-gallery-swiper">
                                        <GallerySwiper galleryImages={gallery} />
                                    </div>
                                );
                            })()}

                            <div className="sitter-about">
                                <h3>{intl.formatMessage({ id: 'sitterModal.about' })}</h3>
                                <p>
                                    {getAboutText()}{' '}
                                    {!isSitterLoggedIn &&
                                        "We can certainly be flexible about the days and tasks we'll be working with. The most important thing for me is a pleasant working relationship and open communication. If you're interested, feel free to send me a message. I'd love to hear from you!"}
                                </p>
                            </div>

                            <div className="action-buttons-bottom">
                                <button
                                    onClick={handleChatClick}
                                    className="btn-chat"
                                    disabled={isChatLoading}
                                >
                                    {isChatLoading ? (
                                        <span className="d-flex align-items-center justify-content-center gap-2">
                                            <Spinner animation="border" size="sm" />
                                            Verifying...
                                        </span>
                                    ) : (
                                        intl.formatMessage({ id: 'common.chat' })
                                    )}
                                </button>
                                {isAuthenticated && (
                                    <AddToFevouriteBtn
                                        className="btn-favorite"
                                        active={isFavorite}
                                        onClick={handleFavoriteClick}
                                        label={intl.formatMessage({ id: 'sitterModal.favorite' })}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>

            <ChatModal
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                uiAction={chatUiAction}
                message={chatMessage}
                onAccept={handleAcceptConversation}
                onDecline={handleDeclineConversation}
                onAction={handleModalAction}
                loadingAction={chatActionInProgress}
                sitterName={getName()}
                sitterLocation={pickUserLocation(sitter)}
                ownerLocation={pickUserLocation(userInfo)}
                sitterQuota={sitterQuota}
            />
        </div>
    );
};

export default SitterModal;
