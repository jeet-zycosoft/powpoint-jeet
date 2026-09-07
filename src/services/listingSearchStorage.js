const STORAGE_KEY = 'pawpoint.lastListingSearch';

const SERVICE_TYPE_LABELS = [
    ['is_boarding', 'Dog Boarding'],
    ['is_house_sitting', 'House Sitting'],
    ['is_doggy_day_care', 'Doggy Day Care'],
    ['is_dog_walking', 'Dog Walking'],
];

export const toListingSearchKind = (slug) =>
    slug === 'owner' || slug === 'worker' ? 'owner' : 'sitter';

export const toServiceLabel = (serviceType) => {
    const match = SERVICE_TYPE_LABELS.find(([key]) => serviceType?.[key]);
    return match ? match[1] : 'Dog Boarding';
};

export const toServiceType = (label) => ({
    is_boarding: label === 'Dog Boarding',
    is_house_sitting: label === 'House Sitting',
    is_drop_in_visit: false,
    is_doggy_day_care: label === 'Doggy Day Care',
    is_dog_walking: label === 'Dog Walking',
});

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

export const isValidListingSearch = (saved) => {
    if (!saved || typeof saved !== 'object') return false;
    return toFiniteNumber(saved.latitude) != null && toFiniteNumber(saved.longitude) != null;
};

const readAll = () => {
    if (typeof window === 'undefined') return {};
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
        return {};
    }
};

export const readLastListingSearch = (slug) => {
    const all = readAll();
    const saved = all[toListingSearchKind(slug)];
    if (!isValidListingSearch(saved)) return null;
    return {
        address: typeof saved.address === 'string' ? saved.address : '',
        latitude: toFiniteNumber(saved.latitude),
        longitude: toFiniteNumber(saved.longitude),
        location_id: saved.location_id ?? null,
        service: saved.service || 'Dog Boarding',
    };
};

export const writeLastListingSearch = (slug, search) => {
    if (typeof window === 'undefined' || !isValidListingSearch(search)) return;
    try {
        const all = readAll();
        all[toListingSearchKind(slug)] = {
            address: search.address || '',
            latitude: Number(search.latitude),
            longitude: Number(search.longitude),
            location_id: search.location_id ?? null,
            service: search.service || 'Dog Boarding',
        };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    } catch {
        // ignore quota / private mode
    }
};
