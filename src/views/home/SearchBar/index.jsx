'use client';
import SearchBox from '@/components/formComponents/SearchBox';
import Select from '@/components/formComponents/Select';
import { formatLocationLabel } from '@/services/addressFormat';
import {
    clearPendingSearchLocation,
    selectPendingSearchLocation,
} from '@/store/features/filter/filterSlice';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IoSearch } from 'react-icons/io5';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import './style.scss';

const SearchBar = ({ variant = 'default' }) => {
    const intl = useIntl();
    const router = useRouter();
    const dispatch = useDispatch();
    const pendingSearchLocation = useSelector(selectPendingSearchLocation);
    const [address, setAddress] = useState('');
    const [service, setService] = useState('Dog Boarding');
    const [locationHighlight, setLocationHighlight] = useState(false);

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
        if (!pendingSearchLocation) return;

        setAddress(pendingSearchLocation);
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

    const handleSubmit = (e) => {
        e.preventDefault();
        const queryParams = new URLSearchParams();
        if (address) {
            queryParams.set('address', address);
        }
        if (service) {
            queryParams.set('service', service);
        }
        router.push(`/sitter/listing?${queryParams.toString()}`);
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
                                    onChange={setAddress}
                                    onLocationSelect={(location) => {
                                        setAddress(formatLocationLabel(location));
                                    }}
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
