'use client';
import { formatLocationLabel, searchPlaces } from '@/services/addressFormat';
import { useEffect, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import './SearchBox.scss';

const addressDisplayCache = new Map();

const getDisplayAddress = (addressStr) => {
    if (!addressStr) return '';
    if (addressDisplayCache.has(addressStr)) {
        return addressDisplayCache.get(addressStr);
    }
    return addressStr;
};

// Main App component
const SearchBox = ({
    onButtonClick,
    value,
    onChange,
    onLocationSelect,
    placeholder,
    autoFocus = false,
    inputId,
}) => {
    const intl = useIntl();
    const resolvedPlaceholder =
        placeholder ?? intl.formatMessage({ id: 'searchBox.placeholder' });
    const [localValue, setLocalValue] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);

    const isControlled = value !== undefined;
    const [displayValue, setDisplayValue] = useState('');
    const userTypingRef = useRef(false);
    const containerRef = useRef(null);
    const preventNextFetchRef = useRef(false);

    // Sync display value with controlled or local state
    useEffect(() => {
        if (isControlled) {
            if (userTypingRef.current) {
                setDisplayValue(value);
                userTypingRef.current = false;
            } else {
                setDisplayValue(getDisplayAddress(value));
                // Parent restored/set the value — don't open suggestions until the user types.
                preventNextFetchRef.current = true;
                setShowSuggestions(false);
            }
        } else {
            setDisplayValue(localValue);
        }
    }, [value, localValue, isControlled]);

    const handleChange = (e) => {
        const newValue = e.target.value;
        if (!isControlled) {
            setLocalValue(newValue);
        } else {
            userTypingRef.current = true;
        }
        if (onChange) {
            onChange(newValue);
        }
    };

    // Debounce location search: cities, landmarks, streets, and postcodes
    useEffect(() => {
        if (preventNextFetchRef.current) {
            preventNextFetchRef.current = false;
            return;
        }

        if (!displayValue || displayValue.trim().length < 3) {
            setSuggestions([]);
            return;
        }

        const delayDebounceFn = setTimeout(async () => {
            setIsLoading(true);
            setShowSuggestions(true);
            try {
                const lang = String(intl.locale || 'en').slice(0, 2);
                const data = await searchPlaces(displayValue, { lang });
                setSuggestions(data || []);
            } catch (error) {
                console.error('Error fetching location suggestions:', error);
                setSuggestions([]);
            } finally {
                setIsLoading(false);
            }
        }, 400);

        return () => clearTimeout(delayDebounceFn);
    }, [displayValue, intl.locale]);

    // Close dropdown on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setActiveIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSelectLocation = (location) => {
        const formatted = formatLocationLabel(location);
        addressDisplayCache.set(location.display_name, formatted);
        addressDisplayCache.set(formatted, formatted);

        preventNextFetchRef.current = true;
        if (!isControlled) {
            setLocalValue(formatted);
        } else {
            userTypingRef.current = false;
        }
        if (onChange) {
            onChange(formatted);
        }
        if (onLocationSelect) {
            onLocationSelect(location);
        }
        setSuggestions([]);
        setShowSuggestions(false);
        setActiveIndex(-1);
    };

    const handleSearch = () => {
        console.log('Searching for:', displayValue);
        if (onButtonClick) {
            onButtonClick(displayValue);
        }
        setShowSuggestions(false);
    };

    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            if (showSuggestions && activeIndex >= 0 && activeIndex < suggestions.length) {
                event.preventDefault();
                handleSelectLocation(suggestions[activeIndex]);
            } else {
                handleSearch();
            }
        } else if (event.key === 'ArrowDown') {
            if (showSuggestions && suggestions.length > 0) {
                event.preventDefault();
                setActiveIndex((prev) => (prev + 1) % suggestions.length);
            } else if (!showSuggestions && suggestions.length > 0) {
                setShowSuggestions(true);
            }
        } else if (event.key === 'ArrowUp') {
            if (showSuggestions && suggestions.length > 0) {
                event.preventDefault();
                setActiveIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
            }
        } else if (event.key === 'Escape') {
            setShowSuggestions(false);
            setActiveIndex(-1);
        }
    };

    return (
        <div className="search-box" ref={containerRef}>
            <div className="search-input-wrapper">
                <input
                    type="text"
                    id={inputId}
                    value={displayValue}
                    onChange={handleChange}
                    onKeyDown={handleKeyPress}
                    placeholder={resolvedPlaceholder}
                    className="search-input"
                    aria-label={intl.formatMessage({ id: 'searchBox.searchAria' })}
                    autoComplete="off"
                    autoFocus={autoFocus}
                    onFocus={() => {
                        if (suggestions.length > 0) {
                            setShowSuggestions(true);
                        }
                    }}
                />

                <button
                    className="search-button"
                    aria-label={intl.formatMessage({ id: 'searchBox.submitAria' })}
                    onClick={handleSearch}
                >
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#212121"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-6 w-6"
                    >
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                </button>
            </div>

            {showSuggestions && (isLoading || suggestions.length > 0) && (
                <div className="suggestions-dropdown">
                    {isLoading ? (
                        <div className="suggestion-loading">
                            <span className="spinner-dots"></span>
                            {intl.formatMessage({ id: 'searchBox.searching' })}
                        </div>
                    ) : (
                        <ul className="suggestions-list">
                            {suggestions.map((item, index) => (
                                <li
                                    key={`${item.place_id || item.osm_id || item.lat}-${index}`}
                                    className={`suggestion-item ${index === activeIndex ? 'active' : ''}`}
                                    onClick={() => handleSelectLocation(item)}
                                    onMouseEnter={() => setActiveIndex(index)}
                                >
                                    <div className="suggestion-icon-wrapper">
                                        <svg
                                            className="location-marker-icon"
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                                            <circle cx="12" cy="10" r="3"></circle>
                                        </svg>
                                    </div>
                                    <span className="suggestion-text">
                                        {formatLocationLabel(item)}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBox;
