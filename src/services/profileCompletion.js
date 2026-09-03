/**
 * Profile / service completion rules for listing access.
 *
 * Sitter (Find an Owner):
 *   Mandatory: eye-catching headline, location
 *   At least one of each: services, pet type, available days, languages
 *
 * Owner (Find a Sitter):
 *   Mandatory: eye-catching headline, location
 *   At least one of each: pet type, services, available days, languages, applies
 */

const toFiniteNumber = (value) => {
    // Empty string must not become 0 (Number('') === 0).
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const hasHeadline = (userInfo) => {
    const title = userInfo?.profile_title;
    return title != null && String(title).trim() !== '';
};

export const hasLocation = (source = {}) => {
    const lat = toFiniteNumber(source.latitude ?? source.lat);
    const lng = toFiniteNumber(source.longitude ?? source.lng ?? source.lon ?? source.long);
    const address = String(source.address || '').trim();
    const locationId = source.location_id;
    const hasCoords = lat != null && lng != null;
    const hasId =
        locationId !== null &&
        locationId !== undefined &&
        locationId !== '' &&
        Number(locationId) > 0;
    // Saved profiles: coords + address, or a location_id.
    // Blank fields (or '' lat/lng coerced to 0) must not count as complete.
    return hasId || (hasCoords && Boolean(address));
};

/**
 * Form save rule: user must pick a suggestion from SearchBox
 * (typed text alone is not enough).
 */
export const hasSelectedLocation = (source = {}) => {
    const lat = toFiniteNumber(source.latitude ?? source.lat);
    const lng = toFiniteNumber(source.longitude ?? source.lng ?? source.lon ?? source.long);
    const address = String(source.address || '').trim();
    const locationId = source.location_id;
    const hasCoords = lat != null && lng != null;
    const hasId =
        locationId !== null &&
        locationId !== undefined &&
        locationId !== '' &&
        Number(locationId) > 0;
    return Boolean(address) && hasCoords && hasId;
};

export const LOCATION_SELECT_REQUIRED_MSG =
    'Please select a location from the suggestions. Typing alone is not enough.';

const hasTruthyInObject = (obj) =>
    Boolean(obj && typeof obj === 'object' && Object.values(obj).some(Boolean));

const hasNonEmptyArray = (arr) => Array.isArray(arr) && arr.length > 0;

/** Normalize API/form language ids (array, JSON string, or comma list). */
export const normalizeLangIds = (value) => {
    if (Array.isArray(value)) {
        return value
            .map((id) => {
                if (id === '' || id === null || id === undefined) return null;
                const n = Number(id);
                return Number.isFinite(n) ? n : id;
            })
            .filter((id) => id !== null && id !== undefined && id !== '');
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return [];
        try {
            const parsed = JSON.parse(trimmed);
            if (Array.isArray(parsed)) return normalizeLangIds(parsed);
        } catch {
            // fall through to comma-split
        }
        return normalizeLangIds(trimmed.split(','));
    }
    return [];
};

export const ownerHasPetType = (serviceDetails) => {
    if (hasNonEmptyArray(serviceDetails?.types_of_pet)) return true;
    if (hasTruthyInObject(serviceDetails?.pets)) return true;
    return Boolean(serviceDetails?.is_dog || serviceDetails?.is_cat);
};

export const ownerHasServices = (serviceDetails) => {
    if (hasNonEmptyArray(serviceDetails?.types_of_service)) return true;
    if (hasTruthyInObject(serviceDetails?.services)) return true;
    return Boolean(
        serviceDetails?.is_boarding ||
            serviceDetails?.is_house_sitting ||
            serviceDetails?.is_drop_in_visit ||
            serviceDetails?.is_doggy_day_care ||
            serviceDetails?.is_dog_walking,
    );
};

export const ownerHasDays = (serviceDetails) => {
    const days = serviceDetails?.available_days || serviceDetails?.days;
    if (Array.isArray(days)) return days.length > 0;
    return hasTruthyInObject(days);
};

export const ownerHasLanguages = (serviceDetails) => {
    if (normalizeLangIds(serviceDetails?.lang_ids).length > 0) return true;
    return hasTruthyInObject(serviceDetails?.languages);
};

export const ownerHasApplies = (serviceDetails) => {
    const applies = serviceDetails?.applies;
    if (hasNonEmptyArray(applies)) return true;
    if (hasTruthyInObject(applies)) return true;
    return Boolean(
        serviceDetails?.apply_is_dog ||
            serviceDetails?.apply_is_cat ||
            serviceDetails?.apply_is_ironing,
    );
};

export const sitterHasServices = (serviceDetails = {}) =>
    Boolean(
        serviceDetails.is_boarding ||
            serviceDetails.is_house_sitting ||
            serviceDetails.is_drop_in_visit ||
            serviceDetails.is_doggy_day_care ||
            serviceDetails.is_dog_walking,
    );

export const sitterHasPetType = (serviceDetails) =>
    hasNonEmptyArray(serviceDetails?.types_of_pet);

export const sitterHasDays = (serviceDetails) => {
    const days =
        serviceDetails?.weekday_availability || serviceDetails?.available_days;
    if (Array.isArray(days)) return days.length > 0;
    return hasTruthyInObject(days);
};

export const sitterHasLanguages = (serviceDetails) => {
    if (normalizeLangIds(serviceDetails?.lang_ids).length > 0) return true;
    return hasTruthyInObject(serviceDetails?.languages);
};

const isEmptyValue = (value) => {
    if (value === null || value === undefined || value === '') return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
};

/** Merge submitted payload with API response so omitted/empty API fields are not lost. */
export const mergeServiceDetails = (payload = {}, apiData = {}) => {
    const merged = { ...payload, ...(apiData || {}) };

    const preferPayload = (key) => {
        if (isEmptyValue(merged[key]) && !isEmptyValue(payload[key])) {
            merged[key] = payload[key];
        }
    };

    [
        'lang_ids',
        'types_of_pet',
        'types_of_service',
        'applies',
        'available_days',
        'weekday_availability',
        'pets',
        'services',
        'days',
        'languages',
        'address',
        'city',
        'country',
        'latitude',
        'longitude',
        'location_id',
    ].forEach(preferPayload);

    const apiLangs = normalizeLangIds(apiData?.lang_ids);
    const payloadLangs = normalizeLangIds(payload?.lang_ids);
    if (apiLangs.length > 0) {
        merged.lang_ids = apiLangs;
    } else if (payloadLangs.length > 0) {
        merged.lang_ids = payloadLangs;
    }

    return merged;
};

/** Location may live on userInfo and/or serviceDetails depending on last save. */
export const resolveLocationSource = (userInfo, serviceDetails) => ({
    address: userInfo?.address || serviceDetails?.address || '',
    city: userInfo?.city || serviceDetails?.city || '',
    country: userInfo?.country || serviceDetails?.country || '',
    latitude: userInfo?.latitude ?? serviceDetails?.latitude,
    longitude: userInfo?.longitude ?? serviceDetails?.longitude,
    location_id: userInfo?.location_id ?? serviceDetails?.location_id,
});

export const SITTER_REQUIREMENTS = [
    { key: 'headline', label: 'Eye-catching headline', mandatory: true },
    { key: 'location', label: 'Location / address', mandatory: true },
    { key: 'services', label: 'Which services should I choose? (at least one)', mandatory: false },
    { key: 'pets', label: 'Pet type (at least one)', mandatory: false },
    { key: 'days', label: 'Which days are you available? (at least one)', mandatory: false },
    { key: 'languages', label: 'Languages do you speak? (at least one)', mandatory: false },
];

export const OWNER_REQUIREMENTS = [
    { key: 'headline', label: 'Eye-catching headline', mandatory: true },
    { key: 'location', label: 'Location / address', mandatory: true },
    { key: 'pets', label: 'Type of pet? (at least one)', mandatory: false },
    { key: 'services', label: 'What services you want (at least one)', mandatory: false },
    { key: 'days', label: 'Which days are you available? (at least one)', mandatory: false },
    { key: 'languages', label: 'What languages do you speak? (at least one)', mandatory: false },
    { key: 'applies', label: 'What applies? (at least one)', mandatory: false },
];

export function evaluateProfileCompletion({ userType, userInfo, serviceDetails } = {}) {
    const isSitter = userType === 'S';
    const locationOk = hasLocation(resolveLocationSource(userInfo, serviceDetails));
    const headlineOk = hasHeadline(userInfo);

    if (isSitter) {
        const checks = {
            headline: headlineOk,
            location: locationOk,
            services: sitterHasServices(serviceDetails),
            pets: sitterHasPetType(serviceDetails),
            days: sitterHasDays(serviceDetails),
            languages: sitterHasLanguages(serviceDetails),
        };
        const missing = SITTER_REQUIREMENTS.filter((item) => !checks[item.key]).map(
            (item) => item.label,
        );
        return {
            isComplete: missing.length === 0,
            checks,
            missing,
            requirements: SITTER_REQUIREMENTS,
            setupPath: !headlineOk ? '/worker/base-form' : '/worker/base-form2',
            listingPath: '/owner/listing',
        };
    }

    const checks = {
        headline: headlineOk,
        location: locationOk,
        pets: ownerHasPetType(serviceDetails),
        services: ownerHasServices(serviceDetails),
        days: ownerHasDays(serviceDetails),
        languages: ownerHasLanguages(serviceDetails),
        applies: ownerHasApplies(serviceDetails),
    };
    const missing = OWNER_REQUIREMENTS.filter((item) => !checks[item.key]).map(
        (item) => item.label,
    );
    return {
        isComplete: missing.length === 0,
        checks,
        missing,
        requirements: OWNER_REQUIREMENTS,
        setupPath: !headlineOk ? '/customer/base-form' : '/customer/base-form2',
        listingPath: '/sitter/listing',
    };
}

export function getListingGatePath({ userType, userInfo, serviceDetails, isAuthenticated }) {
    if (!isAuthenticated) {
        // Public customer listing stays open for guests
        return null;
    }
    const result = evaluateProfileCompletion({ userType, userInfo, serviceDetails });
    if (result.isComplete) return null;
    return result.setupPath;
}

export function getIncompleteProfileToast(completion) {
    if (!completion?.missing?.length) {
        return { id: 'header.incompleteProfileDefault' };
    }
    return {
        id: 'header.incompleteProfileMissing',
        values: { items: completion.missing.join(', ') },
    };
}

export function formatRequirementsMessage(requirements, title) {
    const lines = requirements.map((item) => {
        const mark = item.mandatory ? '★ Required' : '• At least one';
        return `${mark}: ${item.label}`;
    });
    return [title, '', ...lines].join('\n');
}
