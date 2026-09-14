'use client';
import AuthGuard from '@/components/AuthGuard';
import ListingCardSkeleton from '@/components/ListingCardSkeleton';
import OwnerCard from '@/components/OwnerCard';
import SitterCard from '@/components/SitterCard';
import SitterModal from '@/components/SitterModal';
import { toLocationId } from '@/hooks/useGeolocation';
import { selectUser, updateServiceDetails } from '@/store/features/user/userSlice';
import ListingFilter from '@/views/listing/listingFilter';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, use, useEffect, useLayoutEffect, useReducer, useRef, useState } from 'react';
import { Offcanvas } from 'react-bootstrap';
import { useIntl } from 'react-intl';
import { FaPaw } from 'react-icons/fa';
import {
    TbChevronDown,
    TbLayoutListFilled,
    TbMapPin,
    TbMapPinFilled,
    TbMapPinOff,
    TbSearch,
} from 'react-icons/tb';
import { useDispatch, useSelector } from 'react-redux';
import './listings.scss';

// Import the service APIs
import { fetchSitterDetail, profileKeys } from '@/hooks/useProfileQueries';
import { formatLocationLabel, searchNominatimPlace } from '@/services/addressFormat';
import { resolveAvatarUrl } from '@/services/avatar';
import { ownerService } from '@/services/ownerService';
import {
    evaluateProfileCompletion,
    getIncompleteProfileToast,
    getListingGatePath,
} from '@/services/profileCompletion';
import {
    isValidListingSearch,
    readLastListingSearch,
    toServiceLabel,
    toServiceType,
    writeLastListingSearch,
} from '@/services/listingSearchStorage';
import { publicService } from '@/services/publicService';
import { sitterService } from '@/services/sitterService';
import { getFooterLocationBySlug } from '@/data/footerLocations';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// load data
import Map from '@/views/listing/MapView';
import GuestLocationModal from '@/views/listing/GuestLocationModal';

// Initial state for filter reducer
const initialFilterState = {
    // Address/location UI text shown in the "Type Your Address" search box.
    addressInputValue: '',
    // The confirmed location picked from suggestions: { latitude, longitude, location_id, label } | null.
    // Only this drives geo search - typed address text is never matched against location fields.
    selectedLocation: null,
    // Optional name/email text search (unrelated to address/location).
    search: '',
    filters: {
        min_price: 1,
        max_price: 250,
        rating: 4,

        service_type: {
            is_boarding: true,
            is_house_sitting: false,
            is_drop_in_visit: false,
            is_doggy_day_care: false,
            is_dog_walking: false,
        },

        pet_types: {
            is_dog: true,
            is_cat: false,
        },

        dog_size: {
            small: false,
            medium: true,
            large: false,
            extra_large: false,
        },

        applies: {
            apply_is_dog: true,
            apply_is_cat: false,
            apply_is_ironing: false,
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
        per_page: 10,
    },
};

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const LANG_MAP = {
    dutch: 116,
    english: 38,
    german: 33,
    french: 48,
    spanish: 40,
    Dutch: 116,
    English: 38,
    German: 33,
    French: 48,
    Spanish: 40,
};

// Helper function to build default filter state from Redux cached user data & search parameters
const getFilterStateFromUserData = ({
    userInfo,
    serviceDetails,
    searchParams,
    footerCityQuery,
}) => {
    const addressParam = searchParams?.get?.('address') || footerCityQuery || null;
    const serviceParam = searchParams?.get?.('service');
    // Coordinates passed straight from a confirmed home-page search (avoids re-prompting
    // guests for a location they already picked).
    const latParam = toFiniteNumber(searchParams?.get?.('lat'));
    const lngParam = toFiniteNumber(searchParams?.get?.('lng'));
    const locationIdParam = toLocationId(searchParams?.get?.('location_id'));

    // 1. Service Type: URL param takes precedence, then Redux serviceDetails, then default
    let serviceType = { ...initialFilterState.filters.service_type };
    if (serviceParam) {
        serviceType = {
            is_boarding: serviceParam === 'Dog Boarding',
            is_house_sitting: serviceParam === 'House Sitting',
            is_doggy_day_care: serviceParam === 'Doggy Day Care',
            is_dog_walking: serviceParam === 'Dog Walking',
            is_drop_in_visit: false,
        };
    } else if (serviceDetails) {
        if (
            serviceDetails.is_boarding != null ||
            serviceDetails.is_house_sitting != null ||
            serviceDetails.is_doggy_day_care != null ||
            serviceDetails.is_dog_walking != null ||
            serviceDetails.is_drop_in_visit != null
        ) {
            const hasAny =
                Boolean(serviceDetails.is_boarding) ||
                Boolean(serviceDetails.is_house_sitting) ||
                Boolean(serviceDetails.is_doggy_day_care) ||
                Boolean(serviceDetails.is_dog_walking) ||
                Boolean(serviceDetails.is_drop_in_visit);

            if (hasAny) {
                serviceType = {
                    is_boarding: Boolean(serviceDetails.is_boarding),
                    is_house_sitting: Boolean(serviceDetails.is_house_sitting),
                    is_doggy_day_care: Boolean(serviceDetails.is_doggy_day_care),
                    is_dog_walking: Boolean(serviceDetails.is_dog_walking),
                    is_drop_in_visit: Boolean(serviceDetails.is_drop_in_visit),
                };
            }
        } else if (
            Array.isArray(serviceDetails.types_of_service) &&
            serviceDetails.types_of_service.length > 0
        ) {
            const list = serviceDetails.types_of_service;
            serviceType = {
                is_boarding:
                    list.includes('SB') ||
                    list.includes('Boarding') ||
                    list.includes('Dog Boarding'),
                is_house_sitting: list.includes('SH') || list.includes('House Sitting'),
                is_drop_in_visit: list.includes('SD') || list.includes('Drop-in Visits'),
                is_doggy_day_care: list.includes('SG') || list.includes('Doggy Day Care'),
                is_dog_walking: list.includes('SW') || list.includes('Dog Walking'),
            };
        } else if (serviceDetails.services && typeof serviceDetails.services === 'object') {
            const s = serviceDetails.services;
            serviceType = {
                is_boarding: Boolean(s.Boarding || s['Dog Boarding']),
                is_house_sitting: Boolean(s['House Sitting']),
                is_drop_in_visit: Boolean(s['Drop-in Visits']),
                is_doggy_day_care: Boolean(s['Doggy Day Care']),
                is_dog_walking: Boolean(s['Dog Walking']),
            };
        }
    }

    // 2. Pet Types: from serviceDetails.types_of_pet or serviceDetails.pets
    let petTypes = { ...initialFilterState.filters.pet_types };
    if (serviceDetails) {
        if (Array.isArray(serviceDetails.types_of_pet) && serviceDetails.types_of_pet.length > 0) {
            const p = serviceDetails.types_of_pet;
            petTypes = {
                is_dog: p.includes('PD') || p.includes('Dog') || p.includes('dog'),
                is_cat: p.includes('PC') || p.includes('Cat') || p.includes('cat'),
            };
        } else if (serviceDetails.pets && typeof serviceDetails.pets === 'object') {
            petTypes = {
                is_dog: Boolean(serviceDetails.pets.Dog ?? serviceDetails.pets.dog),
                is_cat: Boolean(serviceDetails.pets.Cat ?? serviceDetails.pets.cat),
            };
        }
    }

    // 3. Dog Size: from serviceDetails.dog_size
    let dogSize = { ...initialFilterState.filters.dog_size };
    if (serviceDetails?.dog_size) {
        if (typeof serviceDetails.dog_size === 'object') {
            dogSize = {
                small: Boolean(serviceDetails.dog_size.small),
                medium: Boolean(serviceDetails.dog_size.medium),
                large: Boolean(serviceDetails.dog_size.large),
                extra_large: Boolean(serviceDetails.dog_size.extra_large),
            };
        } else if (typeof serviceDetails.dog_size === 'string') {
            dogSize = {
                small: serviceDetails.dog_size === '0-15',
                medium: serviceDetails.dog_size === '16-40',
                large: serviceDetails.dog_size === '41-100',
                extra_large: serviceDetails.dog_size === '101+',
            };
        }
    }

    // 4. Rate / Max Price: listing default is $50 (not the user's saved service charge)
    const maxPrice = initialFilterState.filters.max_price;

    // 5. Available Days: listing default is all days (not the user's saved availability)
    const availableDays = { ...initialFilterState.filters.available_days };

    // 6. Languages: from serviceDetails.lang_ids or serviceDetails.languages
    let langIds = initialFilterState.filters.lang_ids;
    if (serviceDetails) {
        if (Array.isArray(serviceDetails.lang_ids) && serviceDetails.lang_ids.length > 0) {
            langIds = serviceDetails.lang_ids.map(Number).filter(Boolean);
        } else if (serviceDetails.languages && typeof serviceDetails.languages === 'object') {
            if (Array.isArray(serviceDetails.languages)) {
                const ids = serviceDetails.languages
                    .map((item) => item.id || LANG_MAP[item.long || item.name || item])
                    .filter(Boolean);
                if (ids.length > 0) langIds = ids;
            } else {
                const ids = Object.entries(serviceDetails.languages)
                    .filter(([_, checked]) => checked)
                    .map(([name]) => LANG_MAP[name])
                    .filter(Boolean);
                if (ids.length > 0) langIds = ids;
            }
        }
    }

    // 7. Applies: from serviceDetails.applies
    let applies = { ...initialFilterState.filters.applies };
    if (serviceDetails?.applies) {
        if (Array.isArray(serviceDetails.applies)) {
            const app = serviceDetails.applies;
            applies = {
                apply_is_dog: app.includes('AD') || app.includes('dog'),
                apply_is_cat: app.includes('AC') || app.includes('cat'),
                apply_is_ironing: app.includes('AI') || app.includes('ironing'),
            };
        } else if (typeof serviceDetails.applies === 'object') {
            const a = serviceDetails.applies;
            applies = {
                apply_is_dog: Boolean(a.apply_is_dog ?? a.dog ?? a['There is a dog']),
                apply_is_cat: Boolean(a.apply_is_cat ?? a.cat ?? a['There is a cat']),
                apply_is_ironing: Boolean(a.apply_is_ironing ?? a.ironing ?? a['There is ironing']),
            };
        }
    }

    // 8. Additional services: from serviceDetails.additional_services
    let additionalServices = initialFilterState.filters.additional_services || {};
    if (
        serviceDetails?.additional_services &&
        typeof serviceDetails.additional_services === 'object'
    ) {
        additionalServices = { ...serviceDetails.additional_services };
    }

    // 9. Location & Search - address display text only; coordinates come exclusively from a
    // confirmed suggestion pick (selectedLocation), never from typed/URL address text.
    const addressDisplay =
        addressParam !== null && addressParam !== undefined
            ? addressParam
            : userInfo?.address || userInfo?.city || '';

    const userLat = toFiniteNumber(userInfo?.latitude ?? userInfo?.lat);
    const userLng = toFiniteNumber(userInfo?.longitude ?? userInfo?.lon ?? userInfo?.long);
    const userLocationId = toLocationId(userInfo?.location_id);

    // A confirmed home-page search already carries coordinates in the URL - use them directly
    // so the listing page never re-asks the guest to pick a location they already chose.
    // Otherwise, only auto-select the logged-in user's own coordinates when there's no explicit
    // address override from the URL (so a shared search link starts in address-entry mode).
    const initialSelectedLocation =
        addressParam && latParam != null && lngParam != null
            ? {
                  latitude: latParam,
                  longitude: lngParam,
                  location_id: locationIdParam ?? null,
                  label: addressDisplay,
              }
            : !addressParam && userLat != null && userLng != null
              ? {
                    latitude: userLat,
                    longitude: userLng,
                    location_id: userLocationId ?? null,
                    label: addressDisplay,
                }
              : null;

    return {
        ...initialFilterState,
        search: '',
        addressInputValue: addressDisplay,
        selectedLocation: initialSelectedLocation,
        filters: {
            ...initialFilterState.filters,
            service_type: serviceType,
            pet_types: petTypes,
            dog_size: dogSize,
            max_price: maxPrice,
            available_days: availableDays,
            lang_ids: langIds,
            applies,
            ...(Object.keys(additionalServices).length > 0
                ? { additional_services: additionalServices }
                : {}),
        },
    };
};

// Generic nested path state updater
function updateNestedState(obj, path, value) {
    if (path.length === 0) return value;
    const [head, ...tail] = path;
    const current = obj && typeof obj === 'object' ? obj[head] : undefined;
    return {
        ...obj,
        [head]: updateNestedState(current, tail, value),
    };
}

// Filter state reducer
function filterReducer(state, action) {
    switch (action.type) {
        case 'UPDATE_FIELD': {
            const { path, value } = action.payload;
            const parts = typeof path === 'string' ? path.split('.') : path;
            return updateNestedState(state, parts, value);
        }
        // Fired on every keystroke in the address box. Typed text is display-only.
        // Keep the last confirmed location so refining a search does not drop geo results
        // or re-open the guest location popup. Only a fully cleared box drops it.
        case 'UPDATE_ADDRESS_TEXT': {
            const value = typeof action.payload === 'string' ? action.payload : '';
            return {
                ...state,
                addressInputValue: value,
                selectedLocation: value === '' ? null : state.selectedLocation,
            };
        }
        // Fired only when the user confirms a suggestion from the dropdown.
        case 'SET_SELECTED_LOCATION': {
            const location = action.payload;
            return {
                ...state,
                addressInputValue: location?.label || '',
                selectedLocation: location,
            };
        }
        case 'CLEAR_SELECTED_LOCATION': {
            return {
                ...state,
                addressInputValue: '',
                selectedLocation: null,
            };
        }
        case 'SET_FILTER_STATE':
            return action.payload;
        case 'HYDRATE_SAVED_SEARCH': {
            const saved = action.payload;
            if (!isValidListingSearch(saved)) return state;
            return {
                ...state,
                addressInputValue: saved.address || state.addressInputValue,
                selectedLocation: {
                    latitude: saved.latitude,
                    longitude: saved.longitude,
                    location_id: saved.location_id ?? null,
                    label: saved.address || state.addressInputValue,
                },
                filters: {
                    ...state.filters,
                    ...(saved.service ? { service_type: toServiceType(saved.service) } : {}),
                },
            };
        }
        case 'RESET_FILTERS':
            return initialFilterState;
        default:
            return state;
    }
}

// Resilient API response mapper to adapt fields to SitterCard/OwnerCard format
const mapApiData = (item) => {
    if (!item) return {};

    const nested = item.sitter || item.owner || item.user;
    const source =
        nested && typeof nested === 'object' && !Array.isArray(nested)
            ? { ...item, ...nested }
            : item;

    let name = source.full_name || source.name || '';
    if (!name && (source.first_name || source.last_name)) {
        name = `${source.first_name || ''} ${source.last_name || ''}`.trim();
    }
    if (!name) name = 'Verified Pet Partner';

    let location = source.location || '';
    if (location && typeof location === 'object') {
        location = '';
    }
    if (!location && (source.city || source.country)) {
        location =
            `${source.city || ''}${source.city && source.country ? ', ' : ''}${source.country || ''}`.trim();
    }
    if (!location) location = 'Kolkata, India';

    const profileSnippet =
        source.profile_title ||
        source.bio ||
        source.profile_snippet ||
        'Professional and highly rated pet care provider ready to help.';

    let image =
        source.profile_photo_url ||
        source.profile_photo ||
        source.profile_image ||
        source.image ||
        source.avatar ||
        '';
    if (image && typeof image === 'object' && image.url) {
        image = image.url;
    }
    image = resolveAvatarUrl(image);

    return {
        ...source,
        id: source.id || source.sitter_id || source.user_id || source.owner_id || item.id,
        name,
        location,
        profileSnippet,
        image,
        profile_image: image,
        profile_photo: image,
        isInFev: source.isInFev || source.is_favorite || item.isInFev || false,
    };
};

const hasConfirmedLocation = (filterState) => {
    const location = filterState?.selectedLocation;
    return Boolean(
        location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude),
    );
};

const toPositiveInt = (value) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

// Builds the request body for pet-sitter-list / pet-owner-list.
// `maxDistanceKm`: pass the previous meta.next_radius_km ONLY for a "See more" click.
// Any other trigger (new location pick, filter change, clear, plain search) omits it so the
// backend runs its own radius-expansion logic starting from the base 5km step.
const buildListPayload = (filterState, { maxDistanceKm } = {}) => {
    const filters = { ...filterState.filters };

    if (filters.dog_size && !filters.dog_sizes) {
        filters.dog_sizes = filters.dog_size;
        delete filters.dog_size;
    }

    if (Array.isArray(filters.lang_ids)) {
        filters.lang_ids = filters.lang_ids.map(toPositiveInt).filter(Boolean);
        if (filters.lang_ids.length === 0) {
            delete filters.lang_ids;
        }
    }

    const location = filterState.selectedLocation;
    const hasCoords =
        location && Number.isFinite(location.latitude) && Number.isFinite(location.longitude);

    if (hasCoords) {
        filters.latitude = location.latitude;
        filters.longitude = location.longitude;
        if (location.location_id != null) {
            filters.location_id = location.location_id;
        } else {
            delete filters.location_id;
        }
        filters.order_by = 'distance';
        filters.order_direction = 'asc';

        if (maxDistanceKm != null) {
            filters.max_distance = maxDistanceKm;
        } else {
            delete filters.max_distance;
        }
    } else {
        // No confirmed location - fall back to old non-geo behavior.
        delete filters.latitude;
        delete filters.longitude;
        delete filters.location_id;
        delete filters.max_distance;
    }

    // "See more" always re-queries from page 1; normal filter/location changes reset to page 1 too.
    filters.page = 1;

    const payload = { filters };
    const search = typeof filterState.search === 'string' ? filterState.search.trim() : '';
    if (search) {
        payload.search = search;
    }

    return payload;
};

// Normalizes list + meta out of the various response shapes the API might return.
// Geo fields may live on response.meta, response.data.meta, or as top-level siblings of data.
const GEO_META_KEYS = [
    'search_radius_km',
    'search_radius_expanded',
    'has_see_more',
    'next_radius_km',
    'location_id',
];

const pickGeoMeta = (...sources) => {
    const geo = {};
    for (const source of sources) {
        if (!source || typeof source !== 'object' || Array.isArray(source)) continue;
        for (const key of GEO_META_KEYS) {
            if (source[key] !== undefined && source[key] !== null) {
                geo[key] = source[key];
            }
        }
    }
    return geo;
};

const normalizeListResponse = (response) => {
    let rawList = [];
    let meta = {};

    if (response) {
        if (Array.isArray(response)) {
            rawList = response;
        } else if (Array.isArray(response.data)) {
            rawList = response.data;
            meta = { ...(response.meta || {}) };
        } else if (Array.isArray(response.data?.data)) {
            rawList = response.data.data;
            meta = { ...(response.data.meta || response.meta || {}) };
        } else if (Array.isArray(response.list)) {
            rawList = response.list;
            meta = { ...(response.meta || {}) };
        } else if (Array.isArray(response.results)) {
            rawList = response.results;
            meta = { ...(response.meta || {}) };
        } else {
            meta = { ...(response.meta || response.data?.meta || {}) };
        }

        // Prefer explicit geo fields wherever the backend put them.
        meta = {
            ...meta,
            ...pickGeoMeta(response, response?.data, response?.meta, response?.data?.meta, meta),
        };
    }

    return { rawList, meta: Object.keys(meta).length > 0 ? meta : null };
};

const isTruthyFlag = (value) => value === true || value === 1 || value === '1' || value === 'true';

const getSeeMoreState = (meta) => {
    const nextKm = Number(meta?.next_radius_km);
    const hasNext = Number.isFinite(nextKm) && nextKm > 0;
    // Backend may send has_see_more, or only next_radius_km — either means we can widen.
    const show = hasNext && (meta?.has_see_more == null ? true : isTruthyFlag(meta.has_see_more));
    return { show, nextKm: show ? nextKm : null };
};

const ListingsPageContent = ({ params }) => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const router = useRouter();
    const searchParams = useSearchParams();
    const { slug } = use(params);
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('grid');
    const reduxDispatch = useDispatch();

    const [selectedSitter, setSelectedSitter] = useState(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const { isAuthenticated, userInfo, serviceDetails } = useSelector(selectUser);
    const footerCity = getFooterLocationBySlug(slug);
    const isCustomer = slug === 'sitter' || slug === 'customer' || Boolean(footerCity);
    const userType = userInfo?.user_type;
    const [cityLocationReady, setCityLocationReady] = useState(!footerCity);

    const [filterState, dispatch] = useReducer(filterReducer, undefined, () => {
        const base = getFilterStateFromUserData({
            userInfo,
            serviceDetails,
            searchParams,
            footerCityQuery: footerCity?.query,
        });
        if (footerCity || hasConfirmedLocation(base) || typeof window === 'undefined') {
            return base;
        }
        const saved = readLastListingSearch(slug);
        if (!isValidListingSearch(saved)) return base;
        return filterReducer(base, { type: 'HYDRATE_SAVED_SEARCH', payload: saved });
    });

    const [searchHydrated, setSearchHydrated] = useState(false);
    const guestPromptDoneRef = useRef(hasConfirmedLocation(filterState));

    // Restore the last listing search on the client before paint. URL coords still win.
    useLayoutEffect(() => {
        if (footerCity) {
            setSearchHydrated(true);
            return;
        }

        const params = new URLSearchParams(window.location.search);
        const urlHasLocation =
            toFiniteNumber(params.get('lat')) != null &&
            toFiniteNumber(params.get('lng')) != null;

        if (!urlHasLocation) {
            const saved = readLastListingSearch(slug);
            if (isValidListingSearch(saved)) {
                dispatch({
                    type: 'HYDRATE_SAVED_SEARCH',
                    payload: saved,
                });
                guestPromptDoneRef.current = true;
            }
        } else {
            guestPromptDoneRef.current = true;
        }

        setSearchHydrated(true);
    }, [footerCity, slug]);

    useEffect(() => {
        if (hasConfirmedLocation(filterState)) {
            guestPromptDoneRef.current = true;
        }
    }, [filterState.selectedLocation]);

    // Persist the confirmed search so returning to this page restores the input and results.
    useEffect(() => {
        if (!searchHydrated || footerCity) return;
        if (!hasConfirmedLocation(filterState)) return;

        const location = filterState.selectedLocation;
        writeLastListingSearch(slug, {
            address: location.label || '',
            latitude: location.latitude,
            longitude: location.longitude,
            location_id: location.location_id ?? null,
            service: toServiceLabel(filterState.filters.service_type),
        });
    }, [
        searchHydrated,
        footerCity,
        slug,
        filterState.selectedLocation,
        filterState.filters.service_type,
    ]);

    // Keep the listing URL in sync with the confirmed search so refresh / share stay accurate.
    useEffect(() => {
        if (!searchHydrated || footerCity) return;
        if (!hasConfirmedLocation(filterState)) return;
        if (slug !== 'sitter' && slug !== 'customer' && slug !== 'owner' && slug !== 'worker') {
            return;
        }

        const location = filterState.selectedLocation;
        const next = new URLSearchParams();
        const address = location.label || '';
        if (address) next.set('address', address);
        next.set('lat', String(location.latitude));
        next.set('lng', String(location.longitude));
        if (location.location_id != null) next.set('location_id', String(location.location_id));
        const service = toServiceLabel(filterState.filters.service_type);
        if (service) next.set('service', service);

        const sameLocation =
            searchParams.get('address') === (address || null) &&
            searchParams.get('lat') === String(location.latitude) &&
            searchParams.get('lng') === String(location.longitude) &&
            (searchParams.get('location_id') || '') ===
                (location.location_id != null ? String(location.location_id) : '') &&
            (searchParams.get('service') || '') === (service || '');

        if (sameLocation) return;

        const path = slug === 'customer' ? '/sitter/listing' : `/${slug}/listing`;
        router.replace(`${path}?${next.toString()}`, { scroll: false });
    }, [
        searchHydrated,
        footerCity,
        slug,
        filterState.selectedLocation,
        filterState.filters.service_type,
        searchParams,
        router,
    ]);

    // Synchronize default filter selection whenever logged-in user data is loaded from Redux cache
    const hasInitializedUserRef = useRef(false);
    useEffect(() => {
        if (footerCity) return;
        if (isAuthenticated && (userInfo || serviceDetails) && !hasInitializedUserRef.current) {
            const urlHasLocation =
                toFiniteNumber(searchParams.get('lat')) != null &&
                toFiniteNumber(searchParams.get('lng')) != null;

            // A saved listing search should win over profile defaults when the URL has no coords,
            // so returning from another page restores the last place they searched.
            if (!urlHasLocation && isValidListingSearch(readLastListingSearch(slug))) {
                hasInitializedUserRef.current = true;
                return;
            }

            const userDefaults = getFilterStateFromUserData({
                userInfo,
                serviceDetails,
                searchParams,
            });
            dispatch({
                type: 'SET_FILTER_STATE',
                payload: userDefaults,
            });
            hasInitializedUserRef.current = true;
        }
    }, [isAuthenticated, userInfo, serviceDetails, searchParams, footerCity, slug]);

    useEffect(() => {
        if (!footerCity) return undefined;

        dispatch({
            type: 'UPDATE_ADDRESS_TEXT',
            payload: footerCity.query,
        });
        setCityLocationReady(false);

        let cancelled = false;
        (async () => {
            try {
                const place = await searchNominatimPlace(footerCity.query);
                if (cancelled) return;
                if (!place) return;
                dispatch({
                    type: 'SET_SELECTED_LOCATION',
                    payload: {
                        latitude: Number(place.lat),
                        longitude: Number(place.lon),
                        location_id: toLocationId(place.place_id) ?? null,
                        label: formatLocationLabel(place) || footerCity.query,
                    },
                });
            } catch (err) {
                console.error('Failed to resolve city location:', err);
            } finally {
                if (!cancelled) setCityLocationReady(true);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [footerCity?.query]);

    // Fetch missing service details if user is authenticated but serviceDetails not in Redux cache
    useEffect(() => {
        if (isAuthenticated && !serviceDetails && userInfo) {
            const isSitter = userInfo.user_type === 'S';
            const fetchPromise = isSitter
                ? sitterService.fetchService()
                : ownerService.fetchService();

            fetchPromise
                .then((res) => {
                    const data = res?.data || res;
                    if (data) {
                        reduxDispatch(updateServiceDetails(data));
                    } else {
                        reduxDispatch(updateServiceDetails({}));
                    }
                })
                .catch((err) => {
                    console.error('Error fetching service details on listing page:', err);
                    reduxDispatch(updateServiceDetails({}));
                });
        }
    }, [isAuthenticated, serviceDetails, userInfo, reduxDispatch]);

    // Block incomplete authenticated profiles from their role listing
    useEffect(() => {
        if (!isAuthenticated || !userInfo) return;
        if (serviceDetails === null) return;

        const isOwnListing =
            (userInfo.user_type === 'O' && isCustomer) ||
            (userInfo.user_type === 'S' && !isCustomer);
        if (!isOwnListing) return;

        const gatePath = getListingGatePath({
            userType: userInfo.user_type,
            userInfo,
            serviceDetails,
            isAuthenticated: true,
        });
        if (gatePath) {
            const completion = evaluateProfileCompletion({
                userType: userInfo.user_type,
                userInfo,
                serviceDetails,
            });
            toast.info(intl.formatMessage(getIncompleteProfileToast(completion)));
            router.replace(gatePath);
        }
    }, [isAuthenticated, userInfo, serviceDetails, isCustomer, router]);

    const instantFetchRef = useRef(false);
    const [fetchTrigger, setFetchTrigger] = useState(0);
    const triggerInstantFetch = () => {
        instantFetchRef.current = true;
        setFetchTrigger((prev) => prev + 1);
    };
    const [sitters, setSitters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Radius/pagination meta from the last successful response:
    // { search_radius_km, search_radius_expanded, has_see_more, next_radius_km, current_page, per_page, total, last_page, ... }
    const [responseMeta, setResponseMeta] = useState(null);
    const [isSeeMoreLoading, setIsSeeMoreLoading] = useState(false);
    // Set right before an instant fetch triggered by "See more"; carries the radius (km) to
    // send as filters.max_distance for that single request only, then gets consumed/cleared.
    const seeMoreDistanceRef = useRef(null);

    const handleSeeMore = () => {
        const { show, nextKm } = getSeeMoreState(responseMeta);
        if (!show || !nextKm || isSeeMoreLoading || loading) return;
        seeMoreDistanceRef.current = nextKm;
        setIsSeeMoreLoading(true);
        triggerInstantFetch();
    };

    const seeMoreState = getSeeMoreState(responseMeta);
    const showListSkeleton = loading || isSeeMoreLoading;
    const hasLocation = hasConfirmedLocation(filterState);
    const waitingForCity = Boolean(footerCity) && !cityLocationReady;
    const mustPickGuestLocation =
        searchHydrated &&
        !isAuthenticated &&
        isCustomer &&
        !hasLocation &&
        !waitingForCity &&
        !guestPromptDoneRef.current;
    const selectedLocationRef = useRef(filterState.selectedLocation);
    selectedLocationRef.current = filterState.selectedLocation;

    const applyGuestLocationSearch = (locationOverride) => {
        const location = locationOverride || selectedLocationRef.current;
        if (!hasConfirmedLocation({ selectedLocation: location })) return false;
        triggerInstantFetch();
        return true;
    };

    const switchTab = (type) => {
        setTab(type);
    };

    // Debounced effect for API-driven filter updates
    useEffect(() => {
        if (!searchHydrated) return;
        if (footerCity && !cityLocationReady) return;

        if (!isAuthenticated && isCustomer && !hasConfirmedLocation(filterState)) {
            setLoading(false);
            setSitters([]);
            setResponseMeta(null);
            return;
        }

        if (isAuthenticated && userType === 'S' && isCustomer) {
            router.push('/owner/listing');
            return;
        }

        const fetchListings = async () => {
            const maxDistanceForThisRequest = seeMoreDistanceRef.current;
            const isSeeMoreRequest = maxDistanceForThisRequest != null;
            seeMoreDistanceRef.current = null;

            try {
                if (isSeeMoreRequest) {
                    setIsSeeMoreLoading(true);
                } else {
                    setLoading(true);
                    // Any non-"see more" trigger (new location, cleared location, filter change,
                    // plain re-search) starts a fresh first-search cycle: drop stale radius meta
                    // immediately so the note/button don't show outdated values while loading.
                    setResponseMeta(null);
                }
                setError(null);

                const payload = buildListPayload(filterState, {
                    maxDistanceKm: maxDistanceForThisRequest,
                });

                let response;
                try {
                    if (isAuthenticated && !isCustomer && userType === 'S') {
                        response = await sitterService.ownerList(payload);
                    } else if (isAuthenticated && isCustomer && userType === 'O') {
                        response = await ownerService.sitterList(payload);
                    } else {
                        response = await publicService.sitterList(payload, { skipAuth: true });
                    }
                } catch (apiErr) {
                    if (apiErr?.response?.status === 401 || apiErr?.response?.status === 403) {
                        response = await publicService.sitterList(payload, { skipAuth: true });
                    } else {
                        throw apiErr;
                    }
                }

                const { rawList, meta } = normalizeListResponse(response);

                setSitters(rawList.length > 0 ? rawList.map(mapApiData) : []);
                setResponseMeta(meta);
            } catch (err) {
                setSitters([]);
                setResponseMeta(null);
                console.error(
                    'Error fetching listings from API:',
                    err.response?.data || err.message,
                );
                setError(
                    err.response?.data?.message || err.message || t('listing.error'),
                );
            } finally {
                if (isSeeMoreRequest) {
                    setIsSeeMoreLoading(false);
                } else {
                    setLoading(false);
                }
            }
        };

        if (instantFetchRef.current) {
            instantFetchRef.current = false;
            fetchListings();
            return;
        }

        const isFirstLoad = sitters.length === 0 && loading;
        const timer = setTimeout(
            () => {
                fetchListings();
            },
            isFirstLoad ? 0 : 300,
        );

        return () => clearTimeout(timer);
    }, [
        filterState.filters,
        filterState.selectedLocation,
        isCustomer,
        userType,
        isAuthenticated,
        fetchTrigger,
        footerCity,
        cityLocationReady,
        searchHydrated,
    ]);

    const getCountLabel = (count) => {
        const roleKey = isCustomer
            ? count === 1
                ? 'listing.counts.sitter'
                : 'listing.counts.sitters'
            : count === 1
              ? 'listing.counts.owner'
              : 'listing.counts.owners';
        return t('listing.counts.found', {
            count,
            role: t(roleKey),
        });
    };

    const content = (
        <div className="listings-page">
            <div className="d-flex flex-column flex-md-row container">
                {tab === 'grid' && (
                    <div className="d-none d-md-block">
                        <ListingFilter
                            slug={slug}
                            filterState={filterState}
                            dispatch={dispatch}
                            onInstantFetch={triggerInstantFetch}
                        />
                    </div>
                )}

                <div className={`results ${tab === 'grid' ? 'ps-md-4 ps-0' : ''}`}>
                    <div className="results-header">
                        <div className="header-info">
                            <h2 className="section-heading">
                                {isCustomer
                                    ? t('listing.heading.sitters')
                                    : t('listing.heading.owners')}
                            </h2>

                            {showListSkeleton ? (
                                <p className="results-count">
                                    <span className="skeleton-shimmer results-count-skeleton" />
                                </p>
                            ) : (
                                !mustPickGuestLocation && (
                                    <p className="results-count">
                                        {responseMeta?.total != null
                                            ? getCountLabel(responseMeta.total)
                                            : getCountLabel(sitters.length)}
                                    </p>
                                )
                            )}
                        </div>
                        <div className="header-controls">
                            <button
                                className="mobile-filter-btn d-flex d-md-none"
                                onClick={() => setShowMobileFilters(true)}
                            >
                                <span>{t('listing.filter')}</span>
                                <TbChevronDown className="chevron-icon" />
                            </button>
                            <div className="btns">
                                <button
                                    className={tab === 'grid' ? 'active' : ''}
                                    onClick={() => switchTab('grid')}
                                >
                                    <TbLayoutListFilled />
                                </button>
                                <button
                                    className={tab === 'map' ? 'active' : ''}
                                    onClick={() => switchTab('map')}
                                >
                                    <TbMapPinFilled />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="result-tabs">
                        {showListSkeleton ? (
                            tab === 'map' ? (
                                <div
                                    className="listing-map-skeleton skeleton-shimmer"
                                    role="status"
                                    aria-label={t('listing.loadingSearch')}
                                />
                            ) : (
                                <div role="status" aria-label={t('listing.loadingSearch')}>
                                    <ListingCardSkeleton count={4} />
                                </div>
                            )
                        ) : mustPickGuestLocation ? (
                            <div className="no-results-box">
                                <div className="no-results-icon" aria-hidden="true">
                                    <TbMapPin />
                                </div>
                                <h3 className="fw-semibold">{t('listing.guestLocation.title')}</h3>
                                <p className="text-muted">{t('listing.guestLocation.desc')}</p>
                            </div>
                        ) : sitters.length === 0 ? (
                            <div className="no-results-box">
                                {filterState.selectedLocation && !seeMoreState.show ? (
                                    <>
                                        <div className="no-results-icon" aria-hidden="true">
                                            <TbMapPinOff />
                                            <span className="no-results-icon__paw">
                                                <FaPaw />
                                            </span>
                                        </div>
                                        <h3 className="fw-semibold">
                                            {t('listing.empty.noneNearbyTitle', {
                                                role: isCustomer
                                                    ? t('listing.empty.sitters')
                                                    : t('listing.empty.owners'),
                                            })}
                                        </h3>
                                        <p className="text-muted">
                                            {t('listing.empty.noneNearbyDesc', {
                                                roleLower: isCustomer
                                                    ? t('listing.empty.sittersLower')
                                                    : t('listing.empty.ownersLower'),
                                            })}
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <div className="no-results-icon" aria-hidden="true">
                                            <TbSearch />
                                            <span className="no-results-icon__paw">
                                                <FaPaw />
                                            </span>
                                        </div>
                                        <h3 className="fw-semibold">
                                            {t('listing.empty.noneTitle', {
                                                role:
                                                    userInfo?.user_type === 'S'
                                                        ? t('listing.empty.owner')
                                                        : t('listing.empty.sitter'),
                                            })}
                                        </h3>
                                        <p className="text-muted">
                                            {t('listing.empty.noneDesc', {
                                                roleLower:
                                                    userInfo?.user_type === 'S'
                                                        ? t('listing.empty.owner').toLowerCase()
                                                        : t('listing.empty.sitter').toLowerCase(),
                                            })}
                                        </p>
                                    </>
                                )}
                            </div>
                        ) : tab === 'grid' ? (
                            sitters.map((sitter, index) =>
                                isCustomer ? (
                                    <SitterCard
                                        sitter={sitter}
                                        key={sitter.id || index}
                                        index={index}
                                        isAuthenticated={isAuthenticated}
                                        onClick={() => {
                                            if (!sitter.id) return;
                                            router.push(`/worker-details/${sitter.id}`);
                                        }}
                                        onMouseEnter={() => {
                                            if (!sitter.id) return;
                                            queryClient.prefetchQuery({
                                                queryKey: profileKeys.sitter(sitter.id),
                                                queryFn: () =>
                                                    fetchSitterDetail(sitter.id, isAuthenticated),
                                                staleTime: 1000 * 60 * 5,
                                            });
                                        }}
                                    />
                                ) : (
                                    <OwnerCard
                                        owner={sitter}
                                        key={sitter.id || index}
                                        index={index}
                                        isAuthenticated={isAuthenticated}
                                        onClick={() => {
                                            if (!sitter.id) return;
                                            if (isAuthenticated && userInfo?.user_type === 'S') {
                                                setSelectedSitter(sitter);
                                            }
                                        }}
                                    />
                                ),
                            )
                        ) : (
                            <Map
                                lat={
                                    filterState.selectedLocation?.latitude ??
                                    toFiniteNumber(userInfo?.latitude) ??
                                    userInfo?.location?.lat ??
                                    22.6074291242716
                                }
                                lng={
                                    filterState.selectedLocation?.longitude ??
                                    toFiniteNumber(userInfo?.longitude) ??
                                    userInfo?.location?.long ??
                                    88.42161538365986
                                }
                                radiusInMeters={
                                    responseMeta?.search_radius_km
                                        ? responseMeta.search_radius_km * 1000
                                        : undefined
                                }
                                sitters={sitters}
                                user={userInfo}
                                isAuthenticated={isAuthenticated}
                                showEmptyAlert={true}
                            />
                        )}

                        {!showListSkeleton && seeMoreState.show && (
                            <div className="see-more-footer">
                                <button
                                    type="button"
                                    className="see-more-btn"
                                    onClick={handleSeeMore}
                                    disabled={isSeeMoreLoading}
                                >
                                    {t('listing.seeMore')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <SitterModal sitter={selectedSitter} onClose={() => setSelectedSitter(null)} />

            <GuestLocationModal
                isOpen={mustPickGuestLocation}
                addressValue={filterState.addressInputValue}
                onAddressChange={(value) =>
                    dispatch({
                        type: 'UPDATE_ADDRESS_TEXT',
                        payload: value || '',
                    })
                }
                onLocationSelect={(location) => {
                    selectedLocationRef.current = location;
                    dispatch({
                        type: 'SET_SELECTED_LOCATION',
                        payload: location,
                    });
                    triggerInstantFetch();
                }}
                onSearch={applyGuestLocationSearch}
            />

            {/* Mobile Filter Offcanvas */}
            <Offcanvas
                show={showMobileFilters}
                onHide={() => setShowMobileFilters(false)}
                placement="end"
                className="mobile-filter-offcanvas"
                enforceFocus={false}
                restoreFocus={false}
            >
                <Offcanvas.Header closeButton>
                    <Offcanvas.Title className="fw-bold">{t('listing.filters')}</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <ListingFilter
                        slug={slug}
                        filterState={filterState}
                        dispatch={dispatch}
                        onInstantFetch={triggerInstantFetch}
                    />
                </Offcanvas.Body>
            </Offcanvas>
        </div>
    );

    if (slug === 'owner' || slug === 'worker') {
        return <AuthGuard>{content}</AuthGuard>;
    }

    return content;
};

function ListingsFallback() {
    const intl = useIntl();
    return (
        <div className="listings-page">
            <div className="container">
                <div
                    className="result-tabs"
                    role="status"
                    aria-label={intl.formatMessage({ id: 'listing.loadingListings' })}
                >
                    <ListingCardSkeleton count={4} />
                </div>
            </div>
        </div>
    );
}

const ListingPageView = ({ params }) => {
    return (
        <Suspense fallback={<ListingsFallback />}>
            <ListingsPageContent params={params} />
        </Suspense>
    );
};

export default ListingPageView;
