/**
 * Shared Nominatim address formatting.
 * Display/save format: "Dam Square, Amsterdam, Netherlands"
 * (place, city, country — no postcode, works worldwide)
 */

const normalizeCountry = (country = '') => {
    const trimmed = String(country).trim();
    if (!trimmed) return '';
    if (/^the netherlands$/i.test(trimmed) || /^nederland$/i.test(trimmed)) {
        return 'Netherlands';
    }
    if (/^united states of america$/i.test(trimmed) || /^usa$/i.test(trimmed)) {
        return 'United States';
    }
    if (/^united kingdom of great britain/i.test(trimmed)) {
        return 'United Kingdom';
    }
    return trimmed;
};

export const getCityName = (addressObj = {}) => {
    return (
        addressObj.city ||
        addressObj.town ||
        addressObj.village ||
        addressObj.municipality ||
        addressObj.city_district ||
        ''
    );
};

export const getCountryName = (addressObj = {}) => {
    return normalizeCountry(addressObj.country || '');
};

const getPlaceName = (location, addressObj = {}) => {
    const city = getCityName(addressObj);
    const roadLine = [addressObj.house_number, addressObj.road || addressObj.pedestrian]
        .filter(Boolean)
        .join(' ')
        .trim();

    const named =
        location?.name ||
        addressObj.amenity ||
        addressObj.tourism ||
        addressObj.building ||
        addressObj.railway ||
        addressObj.shop ||
        addressObj.leisure ||
        addressObj.historic ||
        addressObj.public_building ||
        '';

    if (named && named.toLowerCase() !== city.toLowerCase()) {
        return named;
    }
    if (roadLine && roadLine.toLowerCase() !== city.toLowerCase()) {
        return roadLine;
    }
    if (named) return named;
    return roadLine;
};

const uniqueParts = (parts) => {
    const seen = new Set();
    return parts.filter((part) => {
        const key = String(part).trim().toLowerCase();
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

/**
 * Format a Nominatim search/reverse result as:
 * "Dam Square, Amsterdam, Netherlands"
 */
export const formatLocationLabel = (location) => {
    if (!location) return '';
    const addressObj = location.address || {};
    const place = getPlaceName(location, addressObj);
    const city = getCityName(addressObj);
    const country = getCountryName(addressObj);

    const formatted = uniqueParts([place, city, country]).join(', ');
    if (formatted) return formatted;

    const displayName = location.display_name || '';
    if (!displayName) return '';

    const bits = displayName
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean);
    if (bits.length <= 3) return displayName;
    return uniqueParts([bits[0], bits[bits.length - 2], bits[bits.length - 1]]).join(', ');
};

export async function searchNominatimPlace(query) {
    const q = String(query || '').trim();
    if (!q) return null;

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            q,
        )}&format=jsonv2&addressdetails=1&limit=1&accept-language=en`,
        {
            headers: {
                'Accept-Language': 'en',
            },
        },
    );
    if (!response.ok) return null;
    const data = await response.json();
    return Array.isArray(data) && data[0] ? data[0] : null;
}

export const getLocationFields = (location) => {
    const addressObj = location?.address || {};
    return {
        address: formatLocationLabel(location),
        city: getCityName(addressObj),
        country: getCountryName(addressObj),
        latitude: location?.lat,
        longitude: location?.lon,
        location_id: location?.place_id,
    };
};
