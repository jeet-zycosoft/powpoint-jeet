'use client';
import SitterDetailsSkeleton from '@/components/SitterDetailsSkeleton';
import { extractList, profileKeys, useSitterDetail } from '@/hooks/useProfileQueries';
import { ownerService } from '@/services/ownerService';
import { publicService } from '@/services/publicService';
import { selectUser } from '@/store/features/user/userSlice';
import { useQuery } from '@tanstack/react-query';
import { use, useState } from 'react';
import { Spinner } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';

import CustomCheckbox from '@/components/formComponents/CustomCheckbox';
import SitterCard from '@/components/SitterCard';
import UserAvatar from '@/components/UserAvatar';
import { DEFAULT_AVATAR } from '@/services/avatar';
import Image from 'next/image';

import './worker-details.scss';

// images
import Verify from '@/../public/icons/verify.png';
import ChatModal from '@/components/ChatModal';
import AddToFevouriteBtn from '@/components/formComponents/addToFevouriteBtn';
import TestimonialCard from '@/components/TestimonialCard';
import { chatService } from '@/services/chatService';
import { isDifferentArea, parseCanChat, pickUserLocation } from '@/services/chatHelpers';
import { handleReplaceLocationAction } from '@/services/replaceLocationFlow';
import Map from '@/views/listing/MapView';
import GallerySwiper from '@/views/worker/gallerySwiper';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import { FiMessageCircle } from 'react-icons/fi';

const sampleUser = {
    image: '/images/sitter_thumb/sitter1.png',
    name: 'asasa',
    role: 'sasa',
    status: 'active',
};

const MEDIA_HOST = 'https://pawpoint.server.zycosoft.com';

const toPlainText = (value) => {
    if (value == null || value === false) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean') return String(value);
    if (Array.isArray(value)) return value.map(toPlainText).filter(Boolean).join(' ');
    if (typeof value === 'object') {
        return toPlainText(value.description || value.content || value.text || value.html || '');
    }
    return '';
};

const stripHtml = (html) =>
    toPlainText(html)
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();

const hasContent = (value) => {
    if (Array.isArray(value)) return value.some((item) => hasContent(item));
    return stripHtml(value).length > 0;
};

const toStringArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((item) => (typeof item === 'string' ? item.trim() : stripHtml(item)))
            .filter(Boolean);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            return toStringArray(JSON.parse(trimmed));
        } catch {
            return [trimmed];
        }
    }
    return [];
};

const getMediaUrl = (image) => {
    if (!image) return '';
    let imgUrl = image;
    if (typeof image === 'object') {
        imgUrl = image.url || image.path || image.src || image.preview || '';
    }
    if (typeof imgUrl !== 'string') return '';
    imgUrl = imgUrl.trim();
    if (!imgUrl || imgUrl === 'null' || imgUrl === 'undefined') return '';
    if (imgUrl.startsWith('{') || imgUrl.startsWith('[')) {
        try {
            return getMediaUrl(JSON.parse(imgUrl));
        } catch {
            return '';
        }
    }
    if (
        imgUrl.startsWith('data:') ||
        imgUrl.startsWith('blob:') ||
        imgUrl.startsWith('http://') ||
        imgUrl.startsWith('https://')
    ) {
        return imgUrl;
    }
    if (imgUrl.startsWith('/images/')) return imgUrl;
    const cleanPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
    let origin = MEDIA_HOST;
    try {
        if (process.env.NEXT_PUBLIC_API_URL) {
            origin = new URL(process.env.NEXT_PUBLIC_API_URL).origin;
        }
    } catch {
        origin = MEDIA_HOST;
    }
    return `${origin}${cleanPath}`;
};

const getSitterValue = (sitter, key) => {
    const values = [
        sitter?.[key],
        sitter?.sitter_services?.[key],
        sitter?.service_details?.[key],
    ];
    const found = values.find(
        (value) => hasContent(value) || (Array.isArray(value) && value.length > 0),
    );
    if (Array.isArray(found)) return found;
    return toPlainText(found || '');
};

const getProfileImageSrc = (sitter) =>
    getMediaUrl(
        sitter?.profile_photo ||
            sitter?.profile_photo_url ||
            sitter?.profile_image ||
            sitter?.avatar ||
            sitter?.image,
    ) || DEFAULT_AVATAR;

const normalizePlace = (value) =>
    stripHtml(value)
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();

const extractSitterList = (response) => {
    if (!response) return [];
    if (Array.isArray(response)) return response;
    if (Array.isArray(response.data)) return response.data;
    if (Array.isArray(response.data?.data)) return response.data.data;
    if (Array.isArray(response.list)) return response.list;
    if (Array.isArray(response.results)) return response.results;
    return [];
};

const toCoordinate = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && !(Math.abs(parsed) < 0.0001) ? parsed : null;
};

const haversineKm = (fromLat, fromLng, toLat, toLng) => {
    if (fromLat == null || fromLng == null || toLat == null || toLng == null) return null;
    const toRad = (deg) => (deg * Math.PI) / 180;
    const dLat = toRad(toLat - fromLat);
    const dLng = toRad(toLng - fromLng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(fromLat)) * Math.cos(toRad(toLat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const pickSnippet = (item) => {
    const candidates = [
        item?.profile_title,
        item?.profileSnippet,
        item?.profile_snippet,
        item?.bio,
        item?.description,
        item?.experience,
    ];
    for (const candidate of candidates) {
        const text = stripHtml(candidate);
        if (text) return text;
    }
    return '';
};

const mapAlternativeSitter = (item) => {
    if (!item) return null;

    const nested = item.sitter && typeof item.sitter === 'object' ? item.sitter : {};
    const source = { ...nested, ...item };

    let name = stripHtml(source.full_name || source.name || '');
    if (!name && (source.first_name || source.last_name)) {
        name = `${source.first_name || ''} ${source.last_name || ''}`.trim();
    }

    let location = source.location || '';
    if (location && typeof location === 'object') {
        location =
            `${location.city || ''}${location.city && location.country ? ', ' : ''}${location.country || ''}`.trim();
    } else {
        location = stripHtml(location);
    }
    if (!location && (source.city || source.country)) {
        location =
            `${source.city || ''}${source.city && source.country ? ', ' : ''}${source.country || ''}`.trim();
    }

    const profileSnippet = pickSnippet(source);
    const image = getMediaUrl(
        source.profile_photo_url ||
            source.profile_image ||
            source.profile_photo ||
            source.avatar ||
            source.image,
    );

    return {
        ...source,
        id: source.id || nested.id,
        name: name || 'Pet sitter', // i18n applied at render via fallbackName
        city: source.city || nested.city || '',
        country: source.country || nested.country || '',
        latitude: source.latitude ?? nested.latitude ?? source.location?.lat ?? null,
        longitude:
            source.longitude ??
            nested.longitude ??
            source.location?.long ??
            source.location?.lng ??
            null,
        location,
        profileSnippet,
        rating: source.rating != null ? Number(source.rating) : null,
        reviewsCount: source.reviews_count || source.reviewsCount || 0,
        image,
        profile_image: image,
        profile_photo: image,
        isInFev: source.isInFev || source.is_favorite || false,
    };
};

const rankAlternativesByLocation = (list, mainSitter, limit = 8) => {
    const mainId = String(mainSitter?.id || '');
    const mainCountry = normalizePlace(mainSitter?.country);
    const mainCity = normalizePlace(mainSitter?.city);
    const mainLat = toCoordinate(mainSitter?.latitude);
    const mainLng = toCoordinate(mainSitter?.longitude);
    const nearbyKm = 50;

    return list
        .filter((item) => {
            if (!item?.id || String(item.id) === mainId) return false;
            const country = normalizePlace(item.country);
            if (!mainCountry || !country) return false;
            return country === mainCountry;
        })
        .map((item) => {
            const sameCity = Boolean(mainCity && normalizePlace(item.city) === mainCity);
            const distance = haversineKm(
                mainLat,
                mainLng,
                toCoordinate(item.latitude),
                toCoordinate(item.longitude),
            );
            const nearby = distance != null && distance <= nearbyKm;
            return {
                item,
                tier: sameCity ? 0 : nearby ? 1 : 2,
                distance: distance ?? 99999,
            };
        })
        .sort((a, b) => a.tier - b.tier || a.distance - b.distance)
        .slice(0, limit)
        .map(({ item }) => item);
};

const ALL_SERVICE_KEYS = [
    {
        key: 'is_boarding',
        priceKey: 'boarding_charge',
        titleId: 'workerDetails.services.boarding.title',
        descriptionId: 'workerDetails.services.boarding.description',
        unitId: 'workerDetails.services.boarding.unit',
    },
    {
        key: 'is_house_sitting',
        priceKey: 'house_sitting_charge',
        titleId: 'workerDetails.services.houseSitting.title',
        descriptionId: 'workerDetails.services.houseSitting.description',
        unitId: 'workerDetails.services.houseSitting.unit',
    },
    {
        key: 'is_drop_in_visit',
        priceKey: 'drop_in_visit_charge',
        titleId: 'workerDetails.services.dropIn.title',
        descriptionId: 'workerDetails.services.dropIn.description',
        unitId: 'workerDetails.services.dropIn.unit',
    },
    {
        key: 'is_doggy_day_care',
        priceKey: 'doggy_day_care_charge',
        titleId: 'workerDetails.services.daycare.title',
        descriptionId: 'workerDetails.services.daycare.description',
        unitId: 'workerDetails.services.daycare.unit',
    },
    {
        key: 'is_dog_walking',
        priceKey: 'dog_walking_charge',
        titleId: 'workerDetails.services.walking.title',
        descriptionId: 'workerDetails.services.walking.description',
        unitId: 'workerDetails.services.walking.unit',
    },
];

const ChatContactButton = ({ onClick, loading, label, loadingLabel, icon }) => (
    <button onClick={onClick} className="btn-primary btn-with-icon" disabled={loading}>
        {loading ? (
            <span className="d-flex align-items-center justify-content-center gap-2">
                <Spinner animation="border" size="sm" />
                {loadingLabel}
            </span>
        ) : (
            <span className="d-flex align-items-center justify-content-center gap-2">
                {icon}
                {label}
            </span>
        )}
    </button>
);

function SitterProfileInner({ params }) {
    const { id } = use(params);
    const intl = useIntl();
    const dispatch = useDispatch();
    const { isAuthenticated, userInfo } = useSelector(selectUser);
    const router = useRouter();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const { data: sitter = null, isLoading: loading, error: queryError } = useSitterDetail(
        id,
        isAuthenticated,
    );
    const error = queryError?.message || null;

    const { data: alternatives = [] } = useQuery({
        queryKey: profileKeys.alternatives(id),
        queryFn: async () => {
            const altResponse = isAuthenticated
                ? await ownerService.alternativeSitterList(id)
                : await publicService.alternativeSitterList({ sitter_id: id });
            const mapped = extractList(altResponse).map(mapAlternativeSitter).filter(Boolean);
            return rankAlternativesByLocation(mapped, sitter);
        },
        enabled: Boolean(id && sitter),
        staleTime: 1000 * 60 * 5,
    });

    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatUiAction, setChatUiAction] = useState('');
    const [chatMessage, setChatMessage] = useState('');
    const [isChatLoading, setIsChatLoading] = useState(false);
    const [chatActionInProgress, setChatActionInProgress] = useState(false);
    const [sitterQuota, setSitterQuota] = useState(null);

    const handleChatClick = async (e) => {
        if (e) e.preventDefault();

        if (!isAuthenticated) {
            toast.info(t('workerDetails.toasts.loginRequired'));
            router.push('/login');
            return;
        }

        try {
            setIsChatLoading(true);
            const response = await chatService.canChat({ other_user_id: id });
            const chatData = parseCanChat(response);
            setSitterQuota(chatData.sitterQuota);

            if (chatData.uiAction === 'OPEN_CHAT') {
                await chatService.start({ other_user_id: id });
                router.push(`/chat/${id}`);
            } else {
                setChatUiAction(chatData.uiAction);
                setChatMessage(chatData.message);
                setIsChatModalOpen(true);
            }
        } catch (err) {
            console.error('Error initiating chat:', err);
            toast.error(t('workerDetails.toasts.verifyFailed'));
        } finally {
            setIsChatLoading(false);
        }
    };

    const handleAcceptConversation = async () => {
        try {
            setChatActionInProgress(true);
            await chatService.acceptConversation({ other_user_id: id });
            toast.success(t('workerDetails.toasts.accepted'));

            await chatService.start({ other_user_id: id });
            setIsChatModalOpen(false);
            router.push(`/chat/${id}`);
        } catch (err) {
            console.error('Error accepting conversation:', err);
            toast.error(t('workerDetails.toasts.acceptFailed'));
        } finally {
            setChatActionInProgress(false);
        }
    };

    const handleDeclineConversation = async () => {
        try {
            setChatActionInProgress(true);
            await chatService.declineConversation({ other_user_id: id });
            toast.info(t('workerDetails.toasts.declined'));
            setIsChatModalOpen(false);
        } catch (err) {
            console.error('Error declining conversation:', err);
            toast.error(t('workerDetails.toasts.declineFailed'));
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

    if (loading) {
        return (
            <div role="status" aria-label={t('workerDetails.loading')}>
                <SitterDetailsSkeleton />
            </div>
        );
    }

    if (!sitter) {
        return (
            <div className="container py-5 text-center">
                <h2>{t('workerDetails.notFound.title')}</h2>
                <p>{error || t('workerDetails.notFound.message')}</p>
            </div>
        );
    }

    const sitterName =
        sitter.full_name ||
        sitter.name ||
        `${sitter.first_name || ''} ${sitter.last_name || ''}`.trim() ||
        t('workerDetails.fallbackName');

    const headline = sitter.profile_title || '';
    const bio = getSitterValue(sitter, 'description') || sitter.bio || '';
    const experience = getSitterValue(sitter, 'experience');
    const safety = getSitterValue(sitter, 'safety');
    const communication = toStringArray(getSitterValue(sitter, 'communication'));
    const skills = toStringArray(getSitterValue(sitter, 'skills'));
    const profilePhotoSrc = getProfileImageSrc(sitter);

    let gallery = sitter?.gallery_photos || [];
    if (typeof gallery === 'string') {
        try {
            gallery = JSON.parse(gallery);
        } catch {
            gallery = gallery ? [gallery] : [];
        }
    }
    if (!Array.isArray(gallery)) gallery = [];
    gallery = gallery
        .map((item) => getMediaUrl(item))
        .filter(Boolean);

    let locationStr = '';
    if (sitter?.location && typeof sitter.location === 'string') {
        locationStr = sitter.location;
    } else if (sitter?.city || sitter?.country) {
        locationStr =
            `${sitter.city || ''}${sitter.city && sitter.country ? ', ' : ''}${sitter.country || ''}`.trim();
    }

    const mergedSitter = {
        ...sitter,
        name: sitterName,
        location: locationStr,
        rating: sitter?.rating !== undefined ? Number(sitter.rating) : null,
        boarding_charge:
            sitter?.sitter_services?.boarding_charge !== undefined
                ? sitter.sitter_services.boarding_charge
                : sitter?.boarding_charge,
        drop_in_visit_charge:
            sitter?.sitter_services?.drop_in_visit_charge !== undefined
                ? sitter.sitter_services.drop_in_visit_charge
                : sitter?.drop_in_visit_charge,
        latitude: sitter?.latitude || sitter?.location?.lat || null,
        longitude: sitter?.longitude || sitter?.location?.long || sitter?.location?.lng || null,
    };

    const servicesData = sitter?.sitter_services || {};

    const isServiceEnabled = (serviceKey) => {
        if (servicesData[serviceKey] !== undefined) {
            return !!servicesData[serviceKey];
        }
        return !!sitter?.[serviceKey];
    };

    const getServiceRate = (priceKey) => {
        if (servicesData[priceKey] !== undefined) {
            return servicesData[priceKey];
        }
        return sitter?.[priceKey];
    };

    const activeServices = ALL_SERVICE_KEYS.filter((service) => isServiceEnabled(service.key));

    const reviewsList = (() => {
        const fromApi = Array.isArray(sitter?.reviews)
            ? sitter.reviews
            : Array.isArray(sitter?.reveiws)
              ? sitter.reveiws
              : [];
        if (fromApi.length > 0) return fromApi;
        return [
            {
                name: 'Emma',
                location: 'Brighton',
                companyName: t('workerDetails.reviews.petParent'),
                rating: 4.9,
                feedback:
                    'Our sitter was amazing - daily updates, photos, and a very happy dog when we got home!',
                image: '40?img=1',
            },
            {
                name: 'Daniel',
                location: 'London',
                companyName: t('workerDetails.reviews.repeatClient'),
                rating: 4.8,
                feedback:
                    'Clear communication and a really safe, calm environment. We will book again.',
                image: '40?img=12',
            },
        ];
    })();

    return (
        <>
                <div className="sitter-profile-container container">
                    <div className="left-column">
                        <div className="profile-card">
                            <div className="profile-image">
                                <UserAvatar src={profilePhotoSrc} alt={sitterName} />
                            </div>
                            <h2>{sitterName}</h2>
                            <div className="reviews">
                                <span>
                                    <b>★</b> {mergedSitter.rating != null ? mergedSitter.rating : '—'}
                                    /5
                                </span>
                                <span>
                                    {t('workerDetails.reviewsCount', {
                                        count: mergedSitter.reviews_count || reviewsList.length || 0,
                                    })}
                                </span>
                            </div>
                            {sitter.city ? (
                                <p className="location">
                                    <span>{t('workerDetails.locationLabel')}</span> {sitter.city}
                                </p>
                            ) : null}
                            <ChatContactButton
                                onClick={handleChatClick}
                                loading={isChatLoading}
                                label={t('workerDetails.chatNow')}
                                loadingLabel={t('workerDetails.verifying')}
                                icon={<FiMessageCircle size={20} />}
                            />
                        </div>

                        <div className="services-card">
                            <h3>{t('workerDetails.services.title')}</h3>
                            {activeServices.length > 0 ? (
                                activeServices.map((service) => (
                                    <div className="service" key={service.key}>
                                        <div className="service_name">
                                            <h5>{t(service.titleId)}</h5>
                                            <p>{t(service.descriptionId)}</p>
                                        </div>
                                        <div className="price">
                                            <h5>
                                                $
                                                {Number(
                                                    getServiceRate(service.priceKey) || 0,
                                                ).toFixed(2)}
                                            </h5>
                                            <p>{t(service.unitId)}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p>{t('workerDetails.services.empty')}</p>
                            )}
                            <div className="btn-box">
                                <button className="btn-secondary">
                                    {t('workerDetails.services.seeAdditionalRates')}
                                </button>
                            </div>
                        </div>

                        <div className="verified-data-card">
                            <h3>{t('workerDetails.verified.title')}</h3>
                            <CustomCheckbox
                                label={t('workerDetails.verified.email')}
                                checked={true}
                                isDisabled={true}
                            />
                            <CustomCheckbox
                                label={t('workerDetails.verified.idCheck')}
                                checked={true}
                                isDisabled={true}
                            />
                            <CustomCheckbox
                                label={t('workerDetails.verified.reviews')}
                                checked={false}
                                isDisabled={true}
                            />
                        </div>

                        <div className="location-card">
                            <h3>{t('workerDetails.location.title')}</h3>
                            <div className="map">
                                <Map
                                    lat={
                                        mergedSitter.latitude
                                            ? Number(mergedSitter.latitude)
                                            : 22.6074291242716
                                    }
                                    lng={
                                        mergedSitter.longitude
                                            ? Number(mergedSitter.longitude)
                                            : 88.42161538365986
                                    }
                                    radiusInMeters={1000}
                                    user={{
                                        ...sampleUser,
                                        image: profilePhotoSrc || sampleUser.image,
                                        name: sitterName,
                                    }}
                                    mapStyle={{ height: '200px', width: '100%' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="right-column">
                        {hasContent(headline) && (
                            <div className="description-card">
                                <h3>{t('workerDetails.description')}</h3>
                                <div className="description rich-html">{headline}</div>
                            </div>
                        )}

                        {gallery.length > 0 ? <GallerySwiper galleryImages={gallery} /> : null}

                        <div className="mb-4">
                            <ChatContactButton
                                onClick={handleChatClick}
                                loading={isChatLoading}
                                label={t('workerDetails.chatNow')}
                                loadingLabel={t('workerDetails.verifying')}
                                icon={<FiMessageCircle size={20} />}
                            />
                        </div>

                        {hasContent(experience) && (
                            <div className="pet-care-experience-card">
                                <h3>{t('workerDetails.experience')}</h3>
                                <div
                                    className="rich-html"
                                    dangerouslySetInnerHTML={{ __html: experience }}
                                />
                            </div>
                        )}

                        <div className="star-sitter-status-card">
                            <div className="star-image">
                                <Image src={Verify} alt="" width={100} height={100} />
                            </div>
                            <div className="status-text">
                                <h3>
                                    {t('workerDetails.starSitter.title', { name: sitterName })}
                                </h3>
                                <p>{t('workerDetails.starSitter.body')}</p>
                            </div>
                        </div>

                        <section className="reviews-card">
                            <h3>{t('workerDetails.reviews.title')}</h3>
                            <div className="review-container">
                                {reviewsList.map((review, index) => {
                                    return <TestimonialCard data={review} key={index} />;
                                })}
                            </div>
                            <button className="btn-secondary">
                                {t('workerDetails.reviews.readMore')}
                            </button>
                        </section>

                        {hasContent(bio) && (
                            <section className="about-section">
                                <h3>{t('workerDetails.about', { name: sitterName })}</h3>
                                <div
                                    className="rich-html"
                                    dangerouslySetInnerHTML={{ __html: bio }}
                                />
                                <ChatContactButton
                                    onClick={handleChatClick}
                                    loading={isChatLoading}
                                    label={t('workerDetails.chatNow')}
                                    loadingLabel={t('workerDetails.verifying')}
                                    icon={<FiMessageCircle size={20} />}
                                />
                            </section>
                        )}

                        {(communication.length > 0 || skills.length > 0) && (
                            <section className="skills-communication-section">
                                {communication.length > 0 && (
                                    <div className="communication-card">
                                        <h3>{t('workerDetails.communication')}</h3>
                                        <ul>
                                            {communication.map((item, index) => (
                                                <li key={`comm-${index}`}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                {skills.length > 0 && (
                                    <div className="communication-card">
                                        <h3>{t('workerDetails.skills')}</h3>
                                        <ul>
                                            {skills.map((item, index) => (
                                                <li key={`skill-${index}`}>{item}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </section>
                        )}

                        {hasContent(safety) && (
                            <section className="safety-trust-section">
                                <h3>{t('workerDetails.safety')}</h3>
                                <div
                                    className="rich-html"
                                    dangerouslySetInnerHTML={{ __html: safety }}
                                />
                            </section>
                        )}

                        <div className="profile-footer">
                            <ChatContactButton
                                onClick={handleChatClick}
                                loading={isChatLoading}
                                label={t('workerDetails.chatNow')}
                                loadingLabel={t('workerDetails.verifying')}
                                icon={<FiMessageCircle size={20} />}
                            />
                            {isAuthenticated && <AddToFevouriteBtn />}
                        </div>
                    </div>
                </div>

                {alternatives.length > 0 && (
                    <div className="mt-md-5 mb-md-4 container mt-4 mb-5">
                        <h2 className="section-heading mb-md-4 mb-3 text-center">
                            {t('workerDetails.alternatives')}
                        </h2>
                        <div className="favorites-grid">
                            {alternatives.map((favorite, index) => (
                                <SitterCard
                                    key={favorite.id || index}
                                    index={index}
                                    isAuthenticated={isAuthenticated}
                                    sitter={favorite}
                                    type={'fav'}
                                    onClick={() => {
                                        router.push(`/worker-details/${favorite.id}`);
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}

            <ChatModal
                isOpen={isChatModalOpen}
                onClose={() => setIsChatModalOpen(false)}
                uiAction={chatUiAction}
                message={chatMessage}
                onAccept={handleAcceptConversation}
                onDecline={handleDeclineConversation}
                onAction={handleModalAction}
                loadingAction={chatActionInProgress}
                sitterName={sitterName}
                sitterLocation={pickUserLocation(sitter)}
                ownerLocation={pickUserLocation(userInfo)}
                sitterQuota={sitterQuota}
            />
        </>
    );
}

export default function WorkerDetailsView({ params }) {
    return <SitterProfileInner params={params} />;
}
