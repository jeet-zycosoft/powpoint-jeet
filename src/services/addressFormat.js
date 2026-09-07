/**
 * Shared address formatting + place autocomplete.
 * Display/save format: "Dam Square, Amsterdam, Netherlands"
 * (place, optional street, city, optional state, country)
 */

const SETTLEMENT_TYPES = new Set([
    'city',
    'town',
    'village',
    'hamlet',
    'locality',
    'district',
    'municipality',
    'county',
]);

const SKIP_OSM_VALUES = new Set([
    'wreck',
    'restaurant',
    'cafe',
    'fast_food',
    'bar',
    'pub',
    'ngo',
    'company',
]);

const STATE_COUNTRIES = new Set([
    'us',
    'usa',
    'united states',
    'ca',
    'canada',
    'au',
    'australia',
    'in',
    'india',
]);

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

const getStateName = (addressObj = {}) => {
    const country = getCountryName(addressObj).toLowerCase();
    const code = String(addressObj.country_code || '').toLowerCase();
    if (!STATE_COUNTRIES.has(country) && !STATE_COUNTRIES.has(code)) return '';
    const state = String(addressObj.state || '').trim();
    const city = getCityName(addressObj);
    if (state && state.toLowerCase() === city.toLowerCase()) return '';
    return state;
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
        addressObj.aeroway ||
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
    if (addressObj.postcode) return addressObj.postcode;
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
 * Format a search/reverse result as:
 * "Dam Square, Amsterdam, Netherlands"
 * "Amsterdam Centraal, Stationsplein, Amsterdam, Netherlands"
 * "Amsterdam, New York, United States"
 * "1012 AB, Amsterdam, Netherlands"
 */
export const formatLocationLabel = (location) => {
    if (!location) return '';
    const addressObj = location.address || {};
    const place = getPlaceName(location, addressObj);
    const city = getCityName(addressObj);
    const country = getCountryName(addressObj);
    const state = getStateName(addressObj);
    const street = addressObj.road || addressObj.pedestrian || '';
    const type = String(location.addresstype || location.type || '').toLowerCase();
    const skipStreet =
        type === 'street' ||
        location.class === 'highway' ||
        location.class === 'railway' ||
        location.class === 'aeroway';
    const includeStreet =
        street &&
        !skipStreet &&
        street.toLowerCase() !== String(place).toLowerCase() &&
        street.toLowerCase() !== String(city).toLowerCase();

    const formatted = uniqueParts([
        place,
        includeStreet ? street : '',
        city,
        state,
        country,
    ]).join(', ');
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

const isPostcodeQuery = (query) => {
    const q = String(query || '').trim();
    if (/^\d{4,6}$/.test(q)) return true;
    if (/^\d{4}\s*[A-Za-z]{2}$/.test(q)) return true;
    if (/^\d{5}(-\d{4})?$/.test(q)) return true;
    if (/^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i.test(q)) return true;
    return false;
};

const isSettlement = (location) => {
    const type = String(location?.addresstype || '').toLowerCase();
    return (
        SETTLEMENT_TYPES.has(type) ||
        location?.class === 'place' ||
        location?.class === 'boundary'
    );
};

const namesMatchQuery = (name, query) => {
    const n = String(name || '')
        .trim()
        .toLowerCase();
    const q = String(query || '')
        .trim()
        .toLowerCase();
    if (!n || !q) return false;
    return n === q || n.startsWith(q) || n.includes(q);
};

async function fetchPhoton(query, { lat, lon, limit = 12, lang = 'en' } = {}) {
    const params = new URLSearchParams({
        q: query,
        limit: String(limit),
        lang,
    });
    if (Number.isFinite(Number(lat)) && Number.isFinite(Number(lon))) {
        params.set('lat', String(lat));
        params.set('lon', String(lon));
    }

    const response = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data?.features) ? data.features : [];
}

function photonFeatureToLocation(feature) {
    const p = feature?.properties || {};
    const coords = feature?.geometry?.coordinates;
    const lon = Array.isArray(coords) ? coords[0] : null;
    const lat = Array.isArray(coords) ? coords[1] : null;
    const type = p.type || p.osm_value || '';
    const settlement =
        SETTLEMENT_TYPES.has(String(type).toLowerCase()) ||
        p.osm_key === 'place' ||
        p.osm_key === 'boundary';

    const city = p.city || p.town || p.village || (settlement ? p.name : '') || '';
    const name =
        p.name || [p.housenumber, p.street].filter(Boolean).join(' ') || p.postcode || '';

    const address = {
        city,
        town: p.town || '',
        village: p.village || '',
        state: p.state || '',
        county: p.county || '',
        country: p.country || '',
        country_code: p.countrycode || '',
        postcode: p.postcode || '',
        road: p.street || '',
        house_number: p.housenumber || '',
        district: p.district || '',
    };

    if (p.osm_key === 'railway') address.railway = name;
    if (p.osm_key === 'tourism') address.tourism = name;
    if (p.osm_key === 'amenity') address.amenity = name;
    if (p.osm_key === 'aeroway') address.aeroway = name;
    if (p.osm_key === 'historic') address.historic = name;
    if (p.osm_key === 'leisure') address.leisure = name;
    if (p.osm_key === 'building') address.building = name;

    return {
        place_id: p.osm_id,
        osm_id: p.osm_id,
        osm_type: p.osm_type,
        lat: lat != null ? String(lat) : '',
        lon: lon != null ? String(lon) : '',
        name,
        display_name: [name, p.street, city, p.state, p.country, p.postcode]
            .filter(Boolean)
            .join(', '),
        addresstype: type,
        type: p.osm_value,
        class: p.osm_key,
        address,
    };
}

function isUsefulResult(location) {
    if (!location?.lat || !location?.lon) return false;
    const name = String(location.name || '').trim();
    const address = location.address || {};
    if (!name && !address.road && !address.postcode) return false;
    if (SKIP_OSM_VALUES.has(String(location.type || '').toLowerCase())) return false;

    const city = getCityName(address);
    if (
        !isSettlement(location) &&
        name &&
        city &&
        name.toLowerCase() === city.toLowerCase()
    ) {
        const keepKeys = new Set(['railway', 'aeroway', 'tourism', 'historic', 'leisure']);
        if (!keepKeys.has(location.class)) return false;
    }

    return true;
}

function dedupeLocations(locations) {
    const seen = new Set();
    return locations.filter((item) => {
        const label = formatLocationLabel(item).toLowerCase();
        if (!label || seen.has(label)) return false;
        seen.add(label);
        return true;
    });
}

async function searchNominatimFallback(query) {
    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            query,
        )}&format=jsonv2&addressdetails=1&limit=10&accept-language=en`,
        {
            headers: {
                'Accept-Language': 'en',
            },
        },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return dedupeLocations(Array.isArray(data) ? data : []).slice(0, 8);
}

async function searchNominatimPostcode(query) {
    const compact = String(query || '').replace(/\s+/g, '');
    if (!compact) return [];

    const response = await fetch(
        `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(
            compact,
        )}&format=jsonv2&addressdetails=1&limit=5&accept-language=en`,
        {
            headers: {
                'Accept-Language': 'en',
            },
        },
    );
    if (!response.ok) return [];
    const data = await response.json();
    return Array.isArray(data) ? data : [];
}

/**
 * Autocomplete for cities, landmarks, streets, and postcodes.
 * Typing "Amsterdam" returns the city plus places like Central Station / Museum,
 * plus other cities with the same name. Typing a postcode returns that area.
 */
export async function searchPlaces(query, { lang = 'en' } = {}) {
    const q = String(query || '').trim();
    if (q.length < 3) return [];

    const language = String(lang || 'en').slice(0, 2);

    try {
        const features = await fetchPhoton(q, { limit: 12, lang: language });
        let results = features.map(photonFeatureToLocation).filter(isUsefulResult);

        if (isPostcodeQuery(q)) {
            try {
                const extra = await searchNominatimPostcode(q);
                results = [...extra, ...results];
            } catch (error) {
                console.error('Error fetching postcode suggestions:', error);
            }
            return dedupeLocations(results).slice(0, 8);
        }

        const primaryCity = results.find(
            (item) => isSettlement(item) && namesMatchQuery(item.name, q),
        );

        if (primaryCity) {
            const localFeatures = await fetchPhoton(q, {
                limit: 10,
                lang: language,
                lat: primaryCity.lat,
                lon: primaryCity.lon,
            });
            const localPois = localFeatures
                .map(photonFeatureToLocation)
                .filter(isUsefulResult)
                .filter((item) => !isSettlement(item));

            const otherCities = results.filter(
                (item) =>
                    isSettlement(item) &&
                    formatLocationLabel(item) !== formatLocationLabel(primaryCity),
            );
            const rest = results.filter((item) => !isSettlement(item));

            results = [primaryCity, ...localPois, ...otherCities, ...rest];
        }

        const ranked = dedupeLocations(results).slice(0, 8);
        if (ranked.length) return ranked;
    } catch (error) {
        console.error('Error fetching Photon suggestions:', error);
    }

    return searchNominatimFallback(q);
}

export async function searchNominatimPlace(query) {
    const q = String(query || '').trim();
    if (!q) return null;

    try {
        const places = await searchPlaces(q);
        if (places[0]) return places[0];
    } catch (error) {
        console.error('Error fetching place suggestions:', error);
    }

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
