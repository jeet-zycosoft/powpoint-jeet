'use client';
import CheckboxDropdown from '@/components/formComponents/CheckboxDropdown';
import PetServiceSelect from '@/components/formComponents/PerServiceSeect';
import { getFooterLocationBySlug } from '@/data/footerLocations';
import SearchBox from '@/components/formComponents/SearchBox';
import { toLocationId } from '@/hooks/useGeolocation';
import { formatLocationLabel } from '@/services/addressFormat';
import {
    clearPendingSearchLocation,
    selectPendingSearchLocation,
} from '@/store/features/filter/filterSlice';
import { useEffect, useMemo } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import './style.scss';

// Conversions for availability days
const longToShortDay = {
    sunday: 'sun',
    monday: 'mon',
    tuesday: 'tue',
    wednesday: 'wed',
    thursday: 'thu',
    friday: 'fri',
    saturday: 'sat',
};

// Conversions for languages
const langToId = {
    dutch: 116,
    english: 38,
    others: 0,
};

const idToLang = {
    116: 'dutch',
    38: 'english',
    0: 'others',
};

const ListingFilter = ({ slug, filterState: state, dispatch: activeDispatch, onInstantFetch }) => {
    const intl = useIntl();
    const reduxDispatch = useDispatch();
    const pendingSearchLocation = useSelector(selectPendingSearchLocation);

    const formSections = useMemo(
        () => [
            {
                id: 'additional-services',
                title: intl.formatMessage({ id: 'listing.filterPanel.additionalServices' }),
                type: 'checkbox-group',
                options: [
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.puppyCare' }),
                        value: 'puppy_care',
                        selected: false,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.ownDog' }),
                        value: 'own_dog',
                        selected: false,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.acceptsUnspayed' }),
                        value: 'accepts_unspayed',
                        selected: true,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.bathingGrooming' }),
                        value: 'grooming',
                        selected: false,
                    },
                ],
            },
            {
                id: 'language-preference',
                title: intl.formatMessage({ id: 'listing.filterPanel.chooseLanguage' }),
                type: 'checkbox-group',
                options: [
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.dutch' }),
                        value: 'dutch',
                        selected: false,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.english' }),
                        value: 'english',
                        selected: true,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.others' }),
                        value: 'others',
                        selected: false,
                    },
                ],
            },
            {
                id: 'availability',
                title: intl.formatMessage({ id: 'listing.filterPanel.availability' }),
                type: 'checkbox-group',
                options: [
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.sunday' }),
                        value: 'sun',
                        selected: false,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.monday' }),
                        value: 'mon',
                        selected: true,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.tuesday' }),
                        value: 'tue',
                        selected: false,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.wednesday' }),
                        value: 'wed',
                        selected: false,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.thursday' }),
                        value: 'thu',
                        selected: false,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.friday' }),
                        value: 'fri',
                        selected: false,
                    },
                    {
                        label: intl.formatMessage({ id: 'listing.filterPanel.saturday' }),
                        value: 'sat',
                        selected: false,
                    },
                ],
            },
        ],
        [intl],
    );

    useEffect(() => {
        if (!pendingSearchLocation) return;

        // Footer city shortcuts only carry text (no coordinates), so this just prefills the
        // address box - it intentionally does NOT set a selectedLocation or trigger a geo
        // search. The user still needs to pick a suggestion to actually run a location search.
        activeDispatch({
            type: 'UPDATE_ADDRESS_TEXT',
            payload: pendingSearchLocation,
        });
        reduxDispatch(clearPendingSearchLocation());
    }, [pendingSearchLocation, activeDispatch, reduxDispatch]);

    // Helper functions for controlled payload transformations
    const getSelectedDays = (availableDaysObj) => {
        if (!availableDaysObj) return [];
        return Object.keys(availableDaysObj)
            .filter((day) => availableDaysObj[day])
            .map((day) => longToShortDay[day.toLowerCase()])
            .filter(Boolean);
    };

    const getSelectedLangs = (langIdsArray) => {
        if (!langIdsArray) return [];
        return langIdsArray.map((id) => idToLang[id] || 'others').filter(Boolean);
    };

    const getSelectedAdditionalServices = (stateObj) => {
        const selected = [];
        if (stateObj.filters?.applies?.apply_is_dog) selected.push('own_dog');

        const addServices = stateObj.filters?.additional_services || {};
        if (addServices.puppy_care) selected.push('puppy_care');
        if (addServices.unspayed_female_dogs) selected.push('accepts_unspayed');
        if (addServices.bathing_grooming) selected.push('grooming');

        return selected;
    };

    const handleAdditionalServicesChange = (newSelectedValues) => {
        const isPuppyCare = newSelectedValues.includes('puppy_care');
        const isOwnDog = newSelectedValues.includes('own_dog');
        const isAcceptsUnspayed = newSelectedValues.includes('accepts_unspayed');
        const isGrooming = newSelectedValues.includes('grooming');

        activeDispatch({
            type: 'UPDATE_FIELD',
            payload: {
                path: 'filters.applies',
                value: {
                    apply_is_dog: isOwnDog,
                    apply_is_cat: state.filters?.applies?.apply_is_cat ?? true,
                    apply_is_ironing: state.filters?.applies?.apply_is_ironing ?? true,
                },
            },
        });

        activeDispatch({
            type: 'UPDATE_FIELD',
            payload: {
                path: 'filters.additional_services',
                value: {
                    puppy_care: isPuppyCare,
                    cat_care: true,
                    unspayed_female_dogs: isAcceptsUnspayed,
                    non_neutered_male_dogs: true,
                    bathing_grooming: isGrooming,
                    dog_first_aid_cpr: true,
                },
            },
        });
    };

    const mapUiServiceToPayload = (uiService) => {
        return {
            is_boarding: uiService === 'Dog Boarding',
            is_house_sitting: uiService === 'House Sitting',
            is_doggy_day_care: uiService === 'Doggy Day Care',
            is_dog_walking: uiService === 'Dog Walking',
            is_drop_in_visit: false,
        };
    };

    const mapUiPetTypeToPayload = (uiPetType) => {
        return {
            is_dog: uiPetType === 'Dog',
            is_cat: uiPetType === 'Cat',
        };
    };

    const getUiDogSizeFromPayload = (dogSizeObj) => {
        if (!dogSizeObj) return '16-40';
        if (dogSizeObj.small) return '0-15';
        if (dogSizeObj.medium) return '16-40';
        if (dogSizeObj.large) return '41-100';
        if (dogSizeObj.extra_large) return '101+';
        return '16-40';
    };

    const mapUiDogSizeToPayload = (uiDogSize) => {
        return {
            small: uiDogSize === '0-15',
            medium: uiDogSize === '16-40',
            large: uiDogSize === '41-100',
            extra_large: uiDogSize === '101+',
        };
    };

    return (
        <aside className="filters">
            <div className="filter-group address-search">
                <label>{intl.formatMessage({ id: 'listing.filterPanel.addressLabel' })}</label>
                <SearchBox
                    value={state.addressInputValue || ''}
                    onChange={(val) => {
                        const value = val || '';
                        activeDispatch({
                            type: 'UPDATE_ADDRESS_TEXT',
                            payload: value,
                        });

                        // Fully clearing the box drops the selected location - fall back to the
                        // old non-geo search behavior right away.
                        if (value === '' && onInstantFetch) {
                            onInstantFetch();
                        }
                    }}
                    onLocationSelect={(location) => {
                        activeDispatch({
                            type: 'SET_SELECTED_LOCATION',
                            payload: {
                                latitude: Number(location.lat),
                                longitude: Number(location.lon),
                                location_id: toLocationId(location.place_id) ?? null,
                                label: formatLocationLabel(location),
                            },
                        });

                        // New location pick = new first search (radius omitted, page reset).
                        if (onInstantFetch) {
                            onInstantFetch();
                        }
                    }}
                    onButtonClick={() => {
                        if (onInstantFetch) {
                            onInstantFetch();
                        }
                    }}
                />
            </div>

            <PetServiceSelect
                isSitterListing={
                    slug === 'sitter' || slug === 'customer' || Boolean(getFooterLocationBySlug(slug))
                }
                serviceType={state.filters?.service_type}
                petTypes={state.filters?.pet_types}
                maxPrice={state.filters?.max_price}
                dogSize={getUiDogSizeFromPayload(state.filters?.dog_size)}
                onServiceChange={(val) => {
                    activeDispatch({
                        type: 'UPDATE_FIELD',
                        payload: {
                            path: 'filters.service_type',
                            value: mapUiServiceToPayload(val),
                        },
                    });
                }}
                onPetTypeChange={(val) => {
                    activeDispatch({
                        type: 'UPDATE_FIELD',
                        payload: {
                            path: 'filters.pet_types',
                            value: mapUiPetTypeToPayload(val),
                        },
                    });
                }}
                onDogSizeChange={(val) => {
                    activeDispatch({
                        type: 'UPDATE_FIELD',
                        payload: {
                            path: 'filters.dog_size',
                            value: mapUiDogSizeToPayload(val),
                        },
                    });
                }}
                onMaxPriceChange={(val) => {
                    activeDispatch({
                        type: 'UPDATE_FIELD',
                        payload: {
                            path: 'filters.max_price',
                            value: val,
                        },
                    });
                }}
            />

            {formSections.map((section) => {
                if (section.type === 'checkbox-group') {
                    let selectedValues = [];
                    let onChangeHandler = () => {};

                    if (section.id === 'availability') {
                        selectedValues = getSelectedDays(state.filters?.available_days);
                        onChangeHandler = (newVals) => {
                            activeDispatch({
                                type: 'UPDATE_FIELD',
                                payload: {
                                    path: 'filters.available_days',
                                    value: {
                                        monday: newVals.includes('mon'),
                                        tuesday: newVals.includes('tue'),
                                        wednesday: newVals.includes('wed'),
                                        thursday: newVals.includes('thu'),
                                        friday: newVals.includes('fri'),
                                        saturday: newVals.includes('sat'),
                                        sunday: newVals.includes('sun'),
                                    },
                                },
                            });
                        };
                    } else if (section.id === 'language-preference') {
                        selectedValues = getSelectedLangs(state.filters?.lang_ids);
                        onChangeHandler = (newVals) => {
                            activeDispatch({
                                type: 'UPDATE_FIELD',
                                payload: {
                                    path: 'filters.lang_ids',
                                    value: newVals
                                        .map((lang) => langToId[lang])
                                        .filter((val) => val !== undefined),
                                },
                            });
                        };
                    } else if (section.id === 'additional-services') {
                        selectedValues = getSelectedAdditionalServices(state);
                        onChangeHandler = handleAdditionalServicesChange;
                    }

                    return (
                        <CheckboxDropdown
                            key={section.id}
                            title={section.title}
                            options={section.options}
                            selectedValues={selectedValues}
                            onChange={onChangeHandler}
                        />
                    );
                }
                return null;
            })}
        </aside>
    );
};

export default ListingFilter;
