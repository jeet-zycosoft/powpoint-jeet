'use client';
import SearchBox from '@/components/formComponents/SearchBox';
import Select from '@/components/formComponents/Select';
import {
    isValidListingSearch,
    readLastListingSearch,
    writeLastListingSearch,
} from '@/services/listingSearchStorage';
import { formatLocationLabel } from '@/services/addressFormat';
import { toLocationId } from '@/hooks/useGeolocation';
import {
    clearPendingSearchLocation,
    selectPendingSearchLocation,
} from '@/store/features/filter/filterSlice';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './style.scss';

const SearchBar = ({ variant = 'default' }) => {
    const intl = useIntl();
    const router = useRouter();
    const dispatch = useDispatch();
    const pendingSearchLocation = useSelector(selectPendingSearchLocation);
    const [address, setAddress] = useState('');
    const [service, setService] = useState('Dog Boarding');
    const [locationHighlight, setLocationHighlight] = useState(false);
    // Only a confirmed suggestion pick may drive a search; typed text alone never qualifies.
    const [selectedLocation, setSelectedLocation] = useState(null);

    const SelectData = {
        label: intl.formatMessage({ id: 'home.searchBar.lookingFor' }),
        id: 'looking-for',
        options: [
            {
                label: intl.formatMessage({ id: 'home.searchBar.options.boarding' }),
                value: 'Dog Boarding',
            },
            {
                label: intl.formatMessage({ id: 'home.searchBar.options.sitting' }),
                value: 'House Sitting',
            },
            {
                label: intl.formatMessage({ id: 'home.searchBar.options.daycare' }),
                value: 'Doggy Day Care',
            },
            {
                label: intl.formatMessage({ id: 'home.searchBar.options.walking' }),
                value: 'Dog Walking',
            },
        ],
    };

    useEffect(() => {
        if (pendingSearchLocation) return;

        const saved = readLastListingSearch('sitter');
        if (!isValidListingSearch(saved)) return;

        setAddress(saved.address || '');
        setSelectedLocation({
            latitude: saved.latitude,
            longitude: saved.longitude,
            location_id: saved.location_id ?? null,
            label: saved.address || '',
        });
        if (saved.service) {
            setService(saved.service);
        }
        // Restore once on mount. Footer "pending" fills take over via the effect below.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!pendingSearchLocation) return;

        setAddress(pendingSearchLocation);
        setSelectedLocation(null);
        setLocationHighlight(true);
        dispatch(clearPendingSearchLocation());

        const highlightTimer = window.setTimeout(() => setLocationHighlight(false), 1800);
        const focusTimer = window.setTimeout(() => {
            document.getElementById('home-search-bar')?.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
            });
            document.querySelector('#home-search-bar input')?.focus({ preventScroll: true });
        }, 80);

        return () => {
            window.clearTimeout(highlightTimer);
            window.clearTimeout(focusTimer);
        };
    }, [pendingSearchLocation, dispatch]);

    const buildListingUrl = (location) => {
        const queryParams = new URLSearchParams();
        const addressLabel = location?.label || address;
        if (addressLabel) {
            queryParams.set('address', addressLabel);
        }
        if (service) {
            queryParams.set('service', service);
        }
        if (location?.latitude != null && location?.longitude != null) {
            queryParams.set('lat', location.latitude);
            queryParams.set('lng', location.longitude);
        }
        if (location?.location_id != null) {
            queryParams.set('location_id', location.location_id);
        }
        return `/sitter/listing?${queryParams.toString()}`;
    };

    const persistListingSearch = (location) => {
        if (!location) return;
        writeLastListingSearch('sitter', {
            address: location.label || address,
            latitude: location.latitude,
            longitude: location.longitude,
            location_id: location.location_id ?? null,
            service,
        });
    };

    // Typing away from the confirmed suggestion (or clearing the field) drops the selection,
    // so a stale address text can never sneak through as a "selected" location.
    const handleAddressChange = (value) => {
        setAddress(value);
        setSelectedLocation((prev) => (prev && prev.label === value ? prev : null));
    };

    // Picking a suggestion is itself the search action — jump straight to the listing page.
    const handleLocationSelect = (place) => {
        const label = formatLocationLabel(place);
        const location = {
            latitude: Number(place.lat),
            longitude: Number(place.lon),
            location_id: toLocationId(place.place_id) ?? null,
            label,
        };
        setAddress(label);
        setSelectedLocation(location);
        persistListingSearch(location);
        router.push(buildListingUrl(location));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!selectedLocation || selectedLocation.label !== address) {
            toast.info(intl.formatMessage({ id: 'home.searchBar.selectLocationFirst' }));
            return;
        }
        persistListingSearch(selectedLocation);
        router.push(buildListingUrl(selectedLocation));
    };

    return (
        <div
            id="home-search-bar"
            className={`search-bar-section search-bar-section--${variant}${locationHighlight ? ' is-location-filled' : ''}`}
        >
            <div className="container">
                <form onSubmit={handleSubmit} className="search-bar">
                    <div className="search-bar__fields">
                        <div className="search-bar__field">
                            <Select SelectData={SelectData} value={service} onChange={setService} />
                            <input type="hidden" name="service" value={service} />
                        </div>
                        <div className="search-bar__field">
                            <div className="form-group address-field">
                                <label htmlFor="address">
                                    {intl.formatMessage({ id: 'home.searchBar.addressLabel' })}
                                </label>
                                <SearchBox
                                    value={address}
                                    onChange={handleAddressChange}
                                    onLocationSelect={handleLocationSelect}
                                />
                                <input type="hidden" name="address" value={address} />
                            </div>
                        </div>
                        <div className="search-bar__action">
                            <button
                                className="search-bar__icon-btn"
                                type="submit"
                                aria-label={intl.formatMessage({ id: 'home.searchBar.button' })}
                            >
                                <IoSearch size={22} />
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SearchBar;
