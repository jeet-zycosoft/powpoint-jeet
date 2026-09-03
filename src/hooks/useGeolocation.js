import { useEffect, useState } from 'react';
import { formatLocationLabel, getCityName, getCountryName } from '@/services/addressFormat';

/** Backend `location_id` must be a positive integer. Empty strings fail validation. */
export const toLocationId = (value) => {
    if (value === null || value === undefined || value === '') return undefined;
    const parsed = Number.parseInt(String(value), 10);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
};

export const useGeolocation = () => {
    const [locationData, setLocationData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window === 'undefined') {
            setLoading(false);
            return;
        }

        // Geolocation is blocked on HTTP except localhost (e.g. http://192.168.x.x)
        if (!window.isSecureContext) {
            setError('Location is only available on HTTPS or localhost.');
            setLoading(false);
            return;
        }

        if (!('geolocation' in navigator)) {
            setError('Geolocation is not supported by your browser');
            setLoading(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;

                try {
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&addressdetails=1&accept-language=en&lat=${lat}&lon=${lng}`,
                        {
                            headers: {
                                'Accept-Language': 'en',
                            },
                        },
                    );
                    const data = await response.json();

                    let locationDetails = { lat, lng };

                    if (data && data.address) {
                        const addressObj = data.address;
                        locationDetails = {
                            ...locationDetails,
                            city: getCityName(addressObj),
                            country: getCountryName(addressObj),
                            address: formatLocationLabel(data),
                            location_id: toLocationId(data.place_id),
                            rawData: data,
                        };
                    }

                    setLocationData(locationDetails);
                    setLoading(false);
                } catch (err) {
                    console.error('Error fetching location details:', err);
                    setError(err.message);
                    setLoading(false);
                }
            },
            (geoError) => {
                setError(geoError.message);
                setLoading(false);
            },
            { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
        );
    }, []);

    return { locationData, error, loading };
};
