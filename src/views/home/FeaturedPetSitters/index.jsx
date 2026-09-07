'use client';
import PetSitterCard from '@/components/PetSitterCard';
import { ownerService } from '@/services/ownerService';
import { publicService } from '@/services/publicService';
import { sitterService } from '@/services/sitterService';
import {
    replaceUserInfo,
    selectUser,
    updateServiceDetails,
} from '@/store/features/user/userSlice';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import 'swiper/css';
import 'swiper/css/navigation';
import { Navigation } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import './style.scss';

const arrowBtn = (
    <svg
        className="swiper-navigation-icon"
        width="11"
        height="20"
        viewBox="0 0 11 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            d="M0.38296 20.0762C0.111788 19.805 0.111788 19.3654 0.38296 19.0942L9.19758 10.2796L0.38296 1.46497C0.111788 1.19379 0.111788 0.754138 0.38296 0.482966C0.654131 0.211794 1.09379 0.211794 1.36496 0.482966L10.4341 9.55214C10.8359 9.9539 10.8359 10.6053 10.4341 11.007L1.36496 20.0762C1.09379 20.3474 0.654131 20.3474 0.38296 20.0762Z"
            fill="currentColor"
        ></path>
    </svg>
);

const toCoord = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && Math.abs(parsed) > 0.0001 ? parsed : null;
};

const pickCoords = (source) => {
    if (!source || typeof source !== 'object') return null;
    const loc = source.location && typeof source.location === 'object' ? source.location : {};
    const lat = toCoord(source.latitude ?? source.lat ?? loc.latitude ?? loc.lat);
    const lng = toCoord(
        source.longitude ??
            source.lng ??
            source.long ??
            source.lon ??
            loc.longitude ??
            loc.lng ??
            loc.long ??
            loc.lon,
    );
    if (lat == null || lng == null) return null;
    return { lat, lng };
};

const pickCity = (...sources) => {
    for (const source of sources) {
        if (!source) continue;
        if (typeof source === 'string' && source.trim()) return source.trim();
        if (typeof source !== 'object') continue;
        const loc = source.location && typeof source.location === 'object' ? source.location : {};
        const city = source.city || source.address || loc.city || loc.address || '';
        if (typeof city === 'string' && city.trim()) return city.trim();
    }
    return '';
};

const unwrapRecord = (res) => {
    if (!res || typeof res !== 'object') return null;
    const nested =
        res.data && typeof res.data === 'object' && !Array.isArray(res.data) ? res.data : res;
    if (nested.user && typeof nested.user === 'object' && !Array.isArray(nested.user)) {
        return nested.user;
    }
    return nested;
};

const unwrapService = (res) => {
    if (!res || typeof res !== 'object') return null;
    if (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) return res.data;
    return res;
};

const getSavedUserLocation = (userInfo, serviceDetails) => {
    const coords = pickCoords(userInfo) || pickCoords(serviceDetails);
    if (!coords) return null;
    return { coords, city: pickCity(userInfo, serviceDetails) };
};

const pickDistanceKm = (sitter, fromCoords) => {
    const apiDist = Number(sitter?.distance_km ?? sitter?.distanceKm ?? sitter?.distance);
    if (Number.isFinite(apiDist) && apiDist >= 0) return apiDist;
    if (!fromCoords) return null;
    const sitterCoords = pickCoords(sitter);
    if (!sitterCoords) return null;
    return haversineKm(fromCoords.lat, fromCoords.lng, sitterCoords.lat, sitterCoords.lng);
};

const toRad = (deg) => (deg * Math.PI) / 180;

const haversineKm = (fromLat, fromLng, toLat, toLng) => {
    if (fromLat == null || fromLng == null || toLat == null || toLng == null) return null;
    const numFromLat = Number(fromLat);
    const numFromLng = Number(fromLng);
    const numToLat = Number(toLat);
    const numToLng = Number(toLng);

    if (
        !Number.isFinite(numFromLat) ||
        !Number.isFinite(numFromLng) ||
        !Number.isFinite(numToLat) ||
        !Number.isFinite(numToLng)
    ) {
        return null;
    }

    const dLat = toRad(numToLat - numFromLat);
    const dLng = toRad(numToLng - numFromLng);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(numFromLat)) * Math.cos(toRad(numToLat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const shuffleArray = (array) => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
};

const BASE_FILTER_PAYLOAD = {
    filters: {
        min_price: 1,
        max_price: 1000,
        rating: 1,
        max_distance: 100000,
        service_type: {
            is_boarding: true,
            is_house_sitting: true,
            is_drop_in_visit: true,
            is_doggy_day_care: true,
            is_dog_walking: true,
        },
        pet_types: {
            is_dog: true,
            is_cat: true,
        },
        dog_sizes: {
            small: true,
            medium: true,
            large: true,
            extra_large: true,
        },
        applies: {
            apply_is_dog: true,
            apply_is_cat: true,
            apply_is_ironing: true,
        },
        available_days: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: true,
            sunday: true,
        },
        lang_ids: [116, 38],
        order_by: 'first_name',
        order_direction: 'DESC',
        page: 1,
        per_page: 20,
    },
};

const FeaturedPetSitters = () => {
    const intl = useIntl();
    const dispatch = useDispatch();
    const { isAuthenticated, userInfo, serviceDetails } = useSelector(selectUser);
    const [sitters, setSitters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [locationInfo, setLocationInfo] = useState({
        coords: null,
        city: '',
    });

    const isMounted = useRef(true);
    const lastFetchKey = useRef('');
    const profileLookupDone = useRef(false);

    const fetchSittersList = useCallback(
        async (coords, _cityName) => {
            const fetchKey = coords ? `${coords.lat},${coords.lng}` : 'no-location';
            if (lastFetchKey.current === fetchKey) return;

            try {
                setLoading(true);
                const payload = {
                    filters: {
                        ...BASE_FILTER_PAYLOAD.filters,
                        ...(coords?.lat != null && coords?.lng != null
                            ? { latitude: coords.lat, longitude: coords.lng }
                            : {}),
                    },
                };
                let response;
                try {
                    if (isAuthenticated && userInfo?.user_type === 'O') {
                        response = await ownerService.sitterList(payload);
                    } else {
                        response = await publicService.sitterList(payload, {
                            skipAuth: userInfo?.user_type === 'S',
                        });
                    }
                } catch (apiErr) {
                    if (apiErr?.response?.status === 403) {
                        response = await publicService.sitterList(payload, {
                            skipAuth: true,
                        });
                    } else {
                        throw apiErr;
                    }
                }

                let rawList = [];
                if (response) {
                    if (Array.isArray(response)) {
                        rawList = response;
                    } else if (Array.isArray(response.data)) {
                        rawList = response.data;
                    } else if (Array.isArray(response.data?.data)) {
                        rawList = response.data.data;
                    } else if (Array.isArray(response.list)) {
                        rawList = response.list;
                    }
                }

                if (!isMounted.current) return;

                lastFetchKey.current = fetchKey;

                if (rawList.length > 0) {
                    const sittersWithDistance = rawList.map((sitter) => ({
                        ...sitter,
                        distanceKm: pickDistanceKm(sitter, coords),
                    }));

                    if (coords) {
                        sittersWithDistance.sort((a, b) => {
                            if (a.distanceKm == null && b.distanceKm == null) return 0;
                            if (a.distanceKm == null) return 1;
                            if (b.distanceKm == null) return -1;
                            return a.distanceKm - b.distanceKm;
                        });
                        setSitters(sittersWithDistance);
                    } else {
                        setSitters(shuffleArray(sittersWithDistance));
                    }
                } else {
                    setSitters([]);
                }
            } catch (err) {
                console.error('Error fetching featured sitters:', err);
                if (isMounted.current) {
                    setSitters([]);
                }
            } finally {
                if (isMounted.current) {
                    setLoading(false);
                }
            }
        },
        [isAuthenticated, userInfo?.user_type],
    );

    useEffect(() => {
        isMounted.current = true;
        let cancelled = false;

        if (!isAuthenticated) {
            profileLookupDone.current = false;
            if (lastFetchKey.current !== 'no-location') {
                lastFetchKey.current = '';
            }
            setLocationInfo({ coords: null, city: '' });
            fetchSittersList(null, '');
            return () => {
                cancelled = true;
                isMounted.current = false;
            };
        }

        const applySavedLocation = (saved) => {
            setLocationInfo({
                coords: saved.coords,
                city: saved.city,
            });
            fetchSittersList(saved.coords, saved.city);
        };

        const bootstrapLocation = async () => {
            const existing = getSavedUserLocation(userInfo, serviceDetails);
            if (existing) {
                applySavedLocation(existing);
                return;
            }

            if (userInfo && !profileLookupDone.current) {
                profileLookupDone.current = true;
                const isSitter = userInfo.user_type === 'S';
                try {
                    const [profileRes, serviceRes] = await Promise.allSettled([
                        isSitter
                            ? sitterService.fetchProfile()
                            : ownerService.fetchProfile(),
                        isSitter
                            ? sitterService.fetchService()
                            : ownerService.fetchService(),
                    ]);

                    let profileData = userInfo;
                    let serviceData = serviceDetails;

                    if (profileRes.status === 'fulfilled') {
                        profileData = unwrapRecord(profileRes.value) || userInfo;
                        dispatch(replaceUserInfo(profileData));
                    }
                    if (serviceRes.status === 'fulfilled') {
                        serviceData = unwrapService(serviceRes.value) || serviceDetails;
                        if (serviceData) {
                            dispatch(updateServiceDetails(serviceData));
                        }
                    }

                    if (cancelled) return;

                    const saved = getSavedUserLocation(profileData, serviceData);
                    if (saved) {
                        applySavedLocation(saved);
                        return;
                    }
                } catch (err) {
                    console.error('Could not load saved user location:', err);
                }
            }

            if (cancelled) return;
            setLocationInfo({ coords: null, city: '' });
            fetchSittersList(null, '');
        };

        bootstrapLocation();

        return () => {
            cancelled = true;
            isMounted.current = false;
        };
    }, [isAuthenticated, userInfo, serviceDetails, dispatch, fetchSittersList]);

    const viewAllHref =
        locationInfo.city
            ? `/sitter/listing?address=${encodeURIComponent(locationInfo.city)}`
            : '/sitter/listing';

    return (
        <section className="featured-pet-sitters">
            <div className="p-md-3 container p-0">
                <h2 className="section-heading section-heading--2">
                    <FormattedMessage
                        id="home.featuredSitters.heading"
                        values={{ span: (chunks) => <span>{chunks}</span> }}
                    />
                </h2>
                <p className="section-desc white">
                    {intl.formatMessage({ id: 'home.featuredSitters.desc' })}
                </p>

                <div className="position-relative">
                    {loading ? (
                        <div className="featured-sitters-skeleton-row">
                            {[1, 2, 3, 4].map((n) => (
                                <div className="skeleton-card" key={n}>
                                    <div className="skeleton-card__image" />
                                    <div className="skeleton-card__title" />
                                    <div className="skeleton-card__subtitle" />
                                </div>
                            ))}
                        </div>
                    ) : sitters.length === 0 ? (
                        <div className="no-sitters-box">
                            <p>No featured sitters found in this area at the moment.</p>
                            <Link href="/sitter/listing" className="btn btn-outline-light btn-sm mt-2">
                                Explore all listings
                            </Link>
                        </div>
                    ) : (
                        <>
                            <Swiper
                                modules={[Navigation]}
                                navigation={{
                                    prevEl: '.fps1',
                                    nextEl: '.fps2',
                                }}
                                spaceBetween={30}
                                slidesPerView={4}
                                loop={sitters.length >= 4}
                                breakpoints={{
                                    320: {
                                        slidesPerView: 2,
                                        spaceBetween: 10,
                                        centeredSlides: sitters.length > 2,
                                    },
                                    768: {
                                        slidesPerView: 2,
                                        spaceBetween: 20,
                                        centeredSlides: false,
                                    },
                                    1024: {
                                        slidesPerView: Math.min(4, sitters.length),
                                        spaceBetween: 30,
                                        centeredSlides: false,
                                    },
                                }}
                            >
                                {sitters.map((sitter, index) => (
                                    <SwiperSlide key={sitter.id || index}>
                                        <PetSitterCard sitter={sitter} />
                                    </SwiperSlide>
                                ))}
                            </Swiper>
                            {sitters.length > 2 && (
                                <>
                                    <div className="swiper-button-prev fps1">{arrowBtn}</div>
                                    <div className="swiper-button-next fps2">{arrowBtn}</div>
                                </>
                            )}
                        </>
                    )}
                </div>

                <div className="pt-4">
                    <Link href={viewAllHref} className="view-all-button">
                        {intl.formatMessage({ id: 'home.featuredSitters.button' })}
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default FeaturedPetSitters;
