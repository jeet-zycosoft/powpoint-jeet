'use client';
import { useModal } from '@/app/ModalProvider';
import FieldHint from '@/components/FieldHint';
import CustomCheckbox from '@/components/formComponents/CustomCheckbox';
import SearchBox from '@/components/formComponents/SearchBox';
import LanguageModal from '@/components/LanguageModal';
import { toLocationId, useGeolocation } from '@/hooks/useGeolocation';
import { formatLocationLabel, getCityName, getCountryName } from '@/services/addressFormat';
import { ownerService } from '@/services/ownerService';
import {
    evaluateProfileCompletion,
    hasSelectedLocation,
    mergeServiceDetails,
    normalizeLangIds,
    OWNER_REQUIREMENTS,
} from '@/services/profileCompletion';
import { selectUser, updateServiceDetails, updateUserInfo } from '@/store/features/user/userSlice';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './style.scss';

// Static mapping objects to avoid recreation on renders
const PET_MAP = {
    Dog: 'PD',
    Cat: 'PC',
};

const SERVICE_MAP = {
    Boarding: 'SB',
    'House Sitting': 'SH',
    'Drop-in Visits': 'SD',
    'Doggy Day Care': 'SG',
    'Dog Walking': 'SW',
};

const LANG_MAP = {
    Dutch: 116,
    English: 38,
    German: 33,
    French: 48,
    Spanish: 40,
};

const APPLIES_MAP = {
    'There is a dog': 'AD',
    'There is a cat': 'AC',
    'There is ironing': 'AI',
};

const reverseMap = (m) => Object.fromEntries(Object.entries(m).map(([k, v]) => [v, k]));
const PET_MAP_REV = reverseMap(PET_MAP);
const SERVICE_MAP_REV = reverseMap(SERVICE_MAP);
const APPLIES_MAP_REV = reverseMap(APPLIES_MAP);
const LANG_MAP_REV = () => Object.fromEntries(Object.entries(LANG_MAP).map(([k, v]) => [v, k]));

const UpdateOwnerServices = () => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const dispatchRedux = useDispatch();
    const router = useRouter();
    const { showModal } = useModal();
    const { userInfo, serviceDetails } = useSelector(selectUser);
    const { locationData } = useGeolocation();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [returnTo, setReturnTo] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    // Language Popup states
    const [showLangModal, setShowLangModal] = useState(false);

    // Check for returnTo query parameter
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const queryParams = new URLSearchParams(window.location.search);
            const returnToParam = queryParams.get('returnTo');
            if (returnToParam) {
                setReturnTo(returnToParam);
            }
        }
    }, []);

    // console.log('userInfo', userInfo);
    // console.log('serviceDetails', serviceDetails);

    // useReducer ======================
    const initialState = {
        pets: { Dog: true, Cat: true },
        services: {
            Boarding: true,
            'House Sitting': false,
            'Drop-in Visits': false,
            'Doggy Day Care': false,
            'Dog Walking': false,
        },
        days: {
            Monday: true,
            Tuesday: true,
            Wednesday: true,
            Thursday: true,
            Friday: true,
            Saturday: false,
            Sunday: false,
        },
        languages: { Dutch: true, English: false, German: false, French: false, Spanish: false },
        applies: { 'There is a dog': true, 'There is a cat': false, 'There is ironing': false },
        charge: '750',
        // max_distance: 20,
        // is_blocked: false,
        // is_deleted: false,
        address: '',
        city: '',
        country: '',
        latitude: '',
        longitude: '',
        location_id: '',
    };

    const reducer = (state, action) => {
        switch (action.type) {
            case 'SET_FIELD':
                return {
                    ...state,
                    [action.field]: action.value,
                };
            case 'TOGGLE':
                return {
                    ...state,
                    [action.category]: {
                        ...state[action.category],
                        [action.name]: !state[action.category][action.name],
                    },
                };
            case 'SET_STATE':
                return {
                    ...state,
                    ...action.payload,
                };
            default:
                return state;
        }
    };

    const [state, dispatch] = useReducer(reducer, initialState);
    // useReducer ======================

    const hasLoadedUserInfoRef = useRef(false);
    const hasLoadedGeolocationRef = useRef(false);

    // Populate form with existing location details from Redux on mount/change
    useEffect(() => {
        if (userInfo && !hasLoadedUserInfoRef.current) {
            dispatch({
                type: 'SET_STATE',
                payload: {
                    address: userInfo.address || '',
                    city: userInfo.city || '',
                    country: userInfo.country || '',
                    latitude: userInfo.latitude || '',
                    longitude: userInfo.longitude || '',
                    location_id: toLocationId(userInfo.location_id) || '',
                },
            });
            hasLoadedUserInfoRef.current = true;
        }
    }, [userInfo]);

    // Populate geolocation info when it arrives (only if no address is set in userInfo and local address is empty)
    useEffect(() => {
        if (
            locationData &&
            !userInfo?.address &&
            !state.address &&
            !hasLoadedGeolocationRef.current
        ) {
            dispatch({
                type: 'SET_STATE',
                payload: {
                    address: locationData.address,
                    city: locationData.city,
                    country: locationData.country,
                    latitude: locationData.lat,
                    longitude: locationData.lng,
                    location_id:
                        toLocationId(locationData.location_id || locationData.rawData?.place_id) ||
                        '',
                },
            });
            hasLoadedGeolocationRef.current = true;
        }
    }, [locationData, userInfo, state.address]);

    // Fetch fresh service details from backend on mount so Redux (and therefore
    // the header gate check) always has the truth, not stale/empty data.
    const hasFetchedRef = useRef(false);
    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        ownerService
            .fetchService()
            .then((res) => {
                const data = res?.data || res || {};
                dispatchRedux(updateServiceDetails(data));
            })
            .catch((err) => console.error('Error fetching owner service:', err));
    }, [dispatchRedux]);

    // Hydrate checkbox groups from saved serviceDetails. Categories with no
    // saved data keep the friendly defaults (first-time users).
    const hasHydratedRef = useRef(false);
    useEffect(() => {
        if (!serviceDetails || hasHydratedRef.current) return;
        hasHydratedRef.current = true;

        const payload = {};

        // --- Pets ---
        if (Array.isArray(serviceDetails.types_of_pet) && serviceDetails.types_of_pet.length > 0) {
            const obj = Object.fromEntries(Object.keys(initialState.pets).map((k) => [k, false]));
            serviceDetails.types_of_pet.forEach((code) => {
                const name = PET_MAP_REV[code];
                if (name) obj[name] = true;
            });
            payload.pets = obj;
        }

        // --- Services ---
        if (
            Array.isArray(serviceDetails.types_of_service) &&
            serviceDetails.types_of_service.length > 0
        ) {
            const obj = Object.fromEntries(
                Object.keys(initialState.services).map((k) => [k, false]),
            );
            serviceDetails.types_of_service.forEach((code) => {
                const name = SERVICE_MAP_REV[code];
                if (name) obj[name] = true;
            });
            payload.services = obj;
        }

        // --- Days ---
        const rawDays = serviceDetails.available_days || serviceDetails.days;
        if (rawDays && typeof rawDays === 'object' && Object.keys(rawDays).length > 0) {
            const obj = {};
            Object.keys(initialState.days).forEach((d) => {
                obj[d] = Boolean(rawDays[d.toLowerCase()]);
            });
            payload.days = obj;
        }

        // --- Languages (including outside/added ones) ---
        const langIds = normalizeLangIds(serviceDetails.lang_ids);
        if (langIds.length > 0) {
            const obj = Object.fromEntries(
                Object.keys(initialState.languages).map((k) => [k, false]),
            );
            const currentRev = LANG_MAP_REV();

            // Try to resolve unknown IDs via the languages array from backend
            // or the sessionStorage cache from LanguageModal
            let allLangs = [];
            if (Array.isArray(serviceDetails.languages) && serviceDetails.languages.length > 0) {
                allLangs = serviceDetails.languages;
            } else {
                try {
                    const cached = sessionStorage.getItem('pawpoint_languages');
                    if (cached) allLangs = JSON.parse(cached);
                } catch { /* ignore */ }
            }

            langIds.forEach((id) => {
                let name = currentRev[id];
                if (!name) {
                    const match = allLangs.find(
                        (item) =>
                            Number(item?.id) === id ||
                            Number(item?.lang_id) === id,
                    );
                    name = match?.lang_long || match?.long;
                    if (name) LANG_MAP[name] = id;
                }
                if (name) obj[name] = true;
            });
            payload.languages = obj;
        }

        // --- Applies ---
        if (Array.isArray(serviceDetails.applies) && serviceDetails.applies.length > 0) {
            const obj = Object.fromEntries(
                Object.keys(initialState.applies).map((k) => [k, false]),
            );
            serviceDetails.applies.forEach((code) => {
                const name = APPLIES_MAP_REV[code];
                if (name) obj[name] = true;
            });
            payload.applies = obj;
        }

        // --- Charge ---
        if (serviceDetails.charge != null && serviceDetails.charge !== '') {
            payload.charge = String(serviceDetails.charge);
        }

        if (Object.keys(payload).length > 0) {
            dispatch({ type: 'SET_STATE', payload });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [serviceDetails]);

    const petLabel = (name) =>
        name === 'Dog' ? t('ownerServices.pets.dog') : t('ownerServices.pets.cat');

    const serviceLabel = (name) => {
        const map = {
            Boarding: t('ownerServices.services.boarding'),
            'House Sitting': t('ownerServices.services.houseSitting'),
            'Drop-in Visits': t('ownerServices.services.dropInVisits'),
            'Doggy Day Care': t('ownerServices.services.doggyDayCare'),
            'Dog Walking': t('ownerServices.services.dogWalking'),
        };
        return map[name] || name;
    };

    const dayLabel = (name) => t(`ownerServices.days.${name.toLowerCase()}`);

    const languageLabel = (name) => t(`ownerServices.languages.${name.toLowerCase()}`);

    const appliesLabel = (name) => {
        const map = {
            'There is a dog': t('ownerServices.applies.thereIsDog'),
            'There is a cat': t('ownerServices.applies.thereIsCat'),
            'There is ironing': t('ownerServices.applies.thereIsIroning'),
        };
        return map[name] || name;
    };

    const handleAddLanguage = (selectedLang) => {
        // 1. Update LANG_MAP dynamically
        LANG_MAP[selectedLang.lang_long] = selectedLang.id;

        // 2. Dispatch state update to include this language as checked: true
        dispatch({
            type: 'SET_FIELD',
            field: 'languages',
            value: {
                ...state.languages,
                [selectedLang.lang_long]: true,
            },
        });

        toast.success(t('ownerServices.languages.addedSuccess', { language: selectedLang.lang_long }));
    };

    const handleToggle = (category, name) => {
        setFieldErrors((prev) => {
            if (!prev[category]) return prev;
            const next = { ...prev };
            delete next[category];
            return next;
        });
        dispatch({ type: 'TOGGLE', category, name });
    };

    const validateOwnerForm = () => {
        const errors = {};
        if (
            !hasSelectedLocation({
                address: state.address,
                latitude: state.latitude,
                longitude: state.longitude,
                location_id: state.location_id,
            })
        ) {
            errors.location = t('ownerServices.location.locationRequired');
        }
        if (!Object.values(state.pets || {}).some(Boolean)) {
            errors.pets = t('ownerServices.validation.selectPet');
        }
        if (!Object.values(state.services || {}).some(Boolean)) {
            errors.services = t('ownerServices.validation.selectService');
        }
        if (!Object.values(state.days || {}).some(Boolean)) {
            errors.days = t('ownerServices.validation.selectDay');
        }
        if (!Object.values(state.languages || {}).some(Boolean)) {
            errors.languages = t('ownerServices.validation.selectLanguage');
        }
        if (!Object.values(state.applies || {}).some(Boolean)) {
            errors.applies = t('ownerServices.validation.selectApplies');
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async () => {
        if (isLoading) return;

        if (!validateOwnerForm()) {
            toast.error(t('ownerServices.validation.requiredFields'));
            requestAnimationFrame(() => {
                document
                    .querySelector('.is-invalid-section')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            return;
        }

        // Check if location changed
        const locationChanged =
            state.latitude !== userInfo?.latitude || state.longitude !== userInfo?.longitude;

        // If location changed, check for active subscriptions and warn
        if (locationChanged && userInfo?.user_type === 'O') {
            try {
                const subsRes = await ownerService.activeSubscriptionsOverview();
                const hasActiveSubscriptions = (subsRes?.data?.active_subscription_count || 0) > 0;

                if (hasActiveSubscriptions) {
                    // Show warning about existing packages
                    const shouldContinue = await new Promise((resolve) => {
                        showModal({
                            type: 'warning',
                            title: t('ownerServices.modals.locationChangeTitle'),
                            message: t('ownerServices.modals.locationChangeMessage', {
                                city: userInfo?.city || t('ownerServices.modals.oldAreaFallback'),
                            }),
                            buttons: [
                                {
                                    text: t('ownerServices.modals.cancel'),
                                    variant: 'outline-secondary',
                                    onClick: () => resolve(false),
                                },
                                {
                                    text: t('ownerServices.modals.continue'),
                                    variant: 'primary',
                                    onClick: () => resolve(true),
                                },
                            ],
                        });
                    });

                    if (!shouldContinue) {
                        return;
                    }
                }
            } catch (err) {
                console.error('Error checking subscriptions:', err);
                // Continue anyway if check fails
            }
        }

        setIsLoading(true);
        setError(null);

        // Map inputs using centralized mapping helpers
        const types_of_pet = Object.entries(state.pets)
            .filter(([_, checked]) => checked)
            .map(([name]) => PET_MAP[name])
            .filter(Boolean);

        const types_of_service = Object.entries(state.services)
            .filter(([_, checked]) => checked)
            .map(([name]) => SERVICE_MAP[name])
            .filter(Boolean);

        const available_days = Object.entries(state.days).reduce((acc, [name, checked]) => {
            acc[name.toLowerCase()] = checked;
            return acc;
        }, {});

        const lang_ids = Object.entries(state.languages)
            .filter(([_, checked]) => checked)
            .map(([name]) => LANG_MAP[name])
            .filter(Boolean);

        const applies = Object.entries(state.applies)
            .filter(([_, checked]) => checked)
            .map(([name]) => APPLIES_MAP[name])
            .filter(Boolean);

        const payload = {
            types_of_pet,
            types_of_service,
            applies,
            lang_ids,
            // max_distance: state.max_distance,
            charge: state.charge,
            // is_blocked: state.is_blocked,
            // is_deleted: state.is_deleted,
            available_days,
        };

        const locationFields = {
            address: state.address,
            city: state.city,
            country: state.country,
            latitude: state.latitude,
            longitude: state.longitude,
        };
        Object.entries(locationFields).forEach(([key, value]) => {
            if (value !== '' && value !== null && value !== undefined) {
                payload[key] = value;
            }
        });

        const locationId = toLocationId(state.location_id);
        if (locationId) {
            payload.location_id = locationId;
        }

        console.log('Submitting owner services payload:', payload);

        ownerService
            .updateService(payload)
            .then((res) => {
                if (res && res.status) {
                    setIsLoading(false);
                    toast.success(t('ownerServices.toasts.updateSuccess'));

                    const formSnapshot = {
                        ...payload,
                        pets: state.pets,
                        services: state.services,
                        days: state.days,
                        languages: state.languages,
                        applies: state.applies,
                    };
                    const savedService = mergeServiceDetails(formSnapshot, res.data || {});
                    dispatchRedux(updateServiceDetails(savedService));
                    dispatchRedux(
                        updateUserInfo({
                            address: payload.address ?? state.address,
                            city: payload.city ?? state.city,
                            country: payload.country ?? state.country,
                            latitude: payload.latitude ?? state.latitude,
                            longitude: payload.longitude ?? state.longitude,
                            location_id: payload.location_id ?? state.location_id,
                        }),
                    );

                    // If returnTo is set, redirect back
                    if (returnTo) {
                        router.push(returnTo);
                        return;
                    }

                    const completion = evaluateProfileCompletion({
                        userType: 'O',
                        userInfo: {
                            ...userInfo,
                            address: payload.address ?? state.address,
                            city: payload.city ?? state.city,
                            country: payload.country ?? state.country,
                            latitude: payload.latitude ?? state.latitude,
                            longitude: payload.longitude ?? state.longitude,
                            location_id: payload.location_id ?? state.location_id,
                        },
                        serviceDetails: savedService,
                    });

                    if (completion.isComplete) {
                        router.push(completion.listingPath);
                        return;
                    }

                    // If location changed, offer to buy premium for new location
                    if (locationChanged) {
                        showModal({
                            type: 'info',
                            title: t('ownerServices.modals.locationUpdatedTitle'),
                            message: t('ownerServices.modals.locationUpdatedMessage', {
                                city: state.city || t('ownerServices.modals.updatedFallback'),
                            }),
                            buttons: [
                                {
                                    text: t('ownerServices.modals.notNow'),
                                    variant: 'outline-secondary',
                                },
                                {
                                    text: t('ownerServices.modals.buyPremium'),
                                    variant: 'primary',
                                    onClick: () =>
                                        router.push('/premium-activation?reason=location'),
                                },
                            ],
                        });
                    } else if (completion.missing.length > 0) {
                        toast.info(
                            t('ownerServices.modals.stillNeeded', {
                                items: completion.missing.join(', '),
                            }),
                        );
                        if (!completion.checks.headline) {
                            router.push('/customer/base-form');
                        }
                    }
                } else {
                    setIsLoading(false);
                    setError(t('ownerServices.toasts.updateFailed'));
                    toast.error(t('ownerServices.toasts.updateFailed'));
                }
            })
            .catch((error) => {
                setIsLoading(false);
                setError(t('ownerServices.toasts.saveError'));
                toast.error(t('ownerServices.toasts.saveError'));
                console.error('Error submitting form:', error);
            });
    };

    return (
        <div className="form-container-2 container">
            <div className={`form-section${fieldErrors.location ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('ownerServices.location.title')}
                    required
                    infoTitle={t('ownerServices.location.infoTitle')}
                    infoItems={OWNER_REQUIREMENTS}
                />
                <p>
                    {t('ownerServices.location.desc')}{' '}
                    <span>{t('ownerServices.location.privacyNote')}</span>.
                    <br />
                    <strong>{t('ownerServices.location.selectHint')}</strong>{' '}
                    {t('ownerServices.location.selectNote')}
                </p>
                <SearchBox
                    value={state.address}
                    onChange={(val) => {
                        setFieldErrors((prev) => {
                            if (!prev.location) return prev;
                            const next = { ...prev };
                            delete next.location;
                            return next;
                        });
                        // Typing invalidates a previous suggestion pick
                        dispatch({
                            type: 'SET_STATE',
                            payload: {
                                address: val,
                                city: '',
                                country: '',
                                latitude: '',
                                longitude: '',
                                location_id: '',
                            },
                        });
                    }}
                    onLocationSelect={(location) => {
                        setFieldErrors((prev) => {
                            if (!prev.location) return prev;
                            const next = { ...prev };
                            delete next.location;
                            return next;
                        });
                        const addressObj = location.address || {};
                        dispatch({
                            type: 'SET_STATE',
                            payload: {
                                address: formatLocationLabel(location),
                                city: getCityName(addressObj),
                                country: getCountryName(addressObj),
                                latitude: location.lat,
                                longitude: location.lon,
                                location_id: toLocationId(location.place_id),
                            },
                        });
                    }}
                    onButtonClick={() => console.log('Search clicked', state.address)}
                />
                {fieldErrors.location && (
                    <span className="field-error-text">{fieldErrors.location}</span>
                )}
            </div>

            <div className={`form-section${fieldErrors.pets ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('ownerServices.pets.title')}
                    required
                    infoTitle={t('ownerServices.location.infoTitle')}
                    infoItems={OWNER_REQUIREMENTS}
                />
                <div className="checkbox-group">
                    {Object.entries(state.pets).map(([name, checked]) => (
                        <CustomCheckbox
                            key={name}
                            label={petLabel(name)}
                            checked={checked}
                            onChange={() => handleToggle('pets', name)}
                        />
                    ))}
                </div>
                {fieldErrors.pets && <span className="field-error-text">{fieldErrors.pets}</span>}
            </div>

            <div className={`form-section${fieldErrors.services ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('ownerServices.services.title')}
                    required
                    infoTitle={t('ownerServices.location.infoTitle')}
                    infoItems={OWNER_REQUIREMENTS}
                />
                <div className="checkbox-group">
                    {Object.entries(state.services).map(([name, checked]) => (
                        <CustomCheckbox
                            key={name}
                            label={serviceLabel(name)}
                            checked={checked}
                            onChange={() => handleToggle('services', name)}
                        />
                    ))}
                </div>
                {fieldErrors.services && (
                    <span className="field-error-text">{fieldErrors.services}</span>
                )}
            </div>

            <div className={`form-section${fieldErrors.days ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('ownerServices.days.title')}
                    required
                    infoTitle={t('ownerServices.location.infoTitle')}
                    infoItems={OWNER_REQUIREMENTS}
                />
                <div className="checkbox-group">
                    {Object.entries(state.days).map(([name, checked]) => (
                        <CustomCheckbox
                            key={name}
                            label={dayLabel(name)}
                            checked={checked}
                            onChange={() => handleToggle('days', name)}
                        />
                    ))}
                </div>
                {fieldErrors.days && <span className="field-error-text">{fieldErrors.days}</span>}
            </div>

            <div className={`form-section${fieldErrors.languages ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('ownerServices.languages.title')}
                    required
                    infoTitle={t('ownerServices.location.infoTitle')}
                    infoItems={OWNER_REQUIREMENTS}
                />
                <div className="checkbox-group">
                    {Object.entries(state.languages).map(([name, checked]) => (
                        <CustomCheckbox
                            key={name}
                            label={languageLabel(name)}
                            checked={checked}
                            onChange={() => handleToggle('languages', name)}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    className="add-language-btn"
                    onClick={() => setShowLangModal(true)}
                >
                    {t('ownerServices.languages.addLanguage')}
                </button>
                {fieldErrors.languages && (
                    <span className="field-error-text">{fieldErrors.languages}</span>
                )}
            </div>

            <div className={`form-section${fieldErrors.applies ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('ownerServices.applies.title')}
                    required
                    infoTitle={t('ownerServices.location.infoTitle')}
                    infoItems={OWNER_REQUIREMENTS}
                />
                <div className="checkbox-group">
                    {Object.entries(state.applies).map(([name, checked]) => (
                        <CustomCheckbox
                            key={name}
                            label={appliesLabel(name)}
                            checked={checked}
                            onChange={() => handleToggle('applies', name)}
                        />
                    ))}
                </div>
                {fieldErrors.applies && (
                    <span className="field-error-text">{fieldErrors.applies}</span>
                )}
            </div>

            <button className="btn-primary" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? (
                    <>
                        <span className="spinner"></span>
                        {t('ownerServices.submit.saving')}
                    </>
                ) : (
                    t('ownerServices.submit.submitContinue')
                )}
            </button>

            <LanguageModal
                show={showLangModal}
                onHide={() => setShowLangModal(false)}
                onAddLanguage={handleAddLanguage}
                excludeLanguages={Object.keys(state.languages)}
            />
        </div>
    );
};

export default UpdateOwnerServices;
