'use client';
import FieldHint from '@/components/FieldHint';
import ArrayInput from '@/components/formComponents/ArrayInput';
import CustomCheckbox from '@/components/formComponents/CustomCheckbox';
import CustomCheckboxWithValue from '@/components/formComponents/CustomCheckboxWithValue';
import RangeSlider from '@/components/formComponents/RangeSlider';
import RichTextEditor from '@/components/formComponents/RichTextEditor';
import SearchBox from '@/components/formComponents/SearchBox';
import LanguageModal from '@/components/LanguageModal';
import { toLocationId, useGeolocation } from '@/hooks/useGeolocation';
import { formatLocationLabel, getCityName, getCountryName } from '@/services/addressFormat';
import {
    evaluateProfileCompletion,
    hasSelectedLocation,
    mergeServiceDetails,
    normalizeLangIds,
    SITTER_REQUIREMENTS,
    sitterHasServices,
} from '@/services/profileCompletion';
import { sitterService } from '@/services/sitterService';
import { selectUser, updateServiceDetails, updateUserInfo } from '@/store/features/user/userSlice';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useReducer, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import './style.scss';

const SERVICES_CONFIG = [
    {
        id: 'boarding',
        labelKey: 'sitterServices.services.boarding',
        icon: '/icons/suitcase.png',
        descKey: 'sitterServices.services.desc',
        isKey: 'is_boarding',
        chargeKey: 'boarding_charge',
    },
    {
        id: 'houseSitting',
        labelKey: 'sitterServices.services.houseSitting',
        icon: '/icons/home.png',
        descKey: 'sitterServices.services.desc',
        isKey: 'is_house_sitting',
        chargeKey: 'house_sitting_charge',
    },
    {
        id: 'dropInVisits',
        labelKey: 'sitterServices.services.dropInVisits',
        icon: '/icons/coffee-break.png',
        descKey: 'sitterServices.services.desc',
        isKey: 'is_drop_in_visit',
        chargeKey: 'drop_in_visit_charge',
    },
    {
        id: 'dayCare',
        labelKey: 'sitterServices.services.doggyDayCare',
        icon: '/icons/sun.png',
        descKey: 'sitterServices.services.desc',
        isKey: 'is_doggy_day_care',
        chargeKey: 'doggy_day_care_charge',
    },
    {
        id: 'dogWalking',
        labelKey: 'sitterServices.services.dogWalking',
        icon: '/icons/pawprint.png',
        descKey: 'sitterServices.services.desc',
        isKey: 'is_dog_walking',
        chargeKey: 'dog_walking_charge',
    },
];

const LANGUAGE_MAP = {
    Dutch: 116,
    English: 38,
    German: 33,
    French: 48,
    Spanish: 40,
};

const HOUSING_LABEL_KEYS = {
    has_house: 'sitterServices.hasHouse',
    has_fenced_yard: 'sitterServices.hasFencedYard',
    dog_on_furniture: 'sitterServices.dogsOnFurniture',
    dog_on_bed: 'sitterServices.dogsOnBed',
    non_smoking_home: 'sitterServices.nonSmokingHome',
};

const PETS_IN_HOME_LABEL_KEYS = {
    no_dog: 'sitterServices.noDog',
    no_cat: 'sitterServices.noCat',
    one_client_at_a_time: 'sitterServices.oneClient',
    no_caged_pets: 'sitterServices.noCagedPets',
};

const CHILDREN_LABEL_KEYS = {
    no_children: 'sitterServices.noChildren',
    age_0_5: 'sitterServices.children0to5',
    age_6_12: 'sitterServices.children6to12',
};

const ADDITIONAL_SERVICES_LABEL_KEYS = {
    puppy_care: 'sitterServices.puppyCare',
    cat_care: 'sitterServices.catCare',
    unspayed_female_dogs: 'sitterServices.unspayedFemales',
    non_neutered_male_dogs: 'sitterServices.nonNeuteredMales',
    bathing_grooming: 'sitterServices.bathingGrooming',
    dog_first_aid_cpr: 'sitterServices.dogFirstAid',
};

const HOUSING_MAP = {
    'Has house (excludes apartments)': 'has_house',
    'Has fenced yard': 'has_fenced_yard',
    'Dogs allowed on furniture': 'dog_on_furniture',
    'Dogs allowed on bed': 'dog_on_bed',
    'Non-smoking home': 'non_smoking_home',
};

const PETS_IN_HOME_MAP = {
    "Doesn't own a dog": 'no_dog',
    "Doesn't own a cat": 'no_cat',
    'Accepts only one client at a time': 'one_client_at_a_time',
    'Does not own caged pets': 'no_caged_pets',
};

const CHILDREN_MAP = {
    'No children': 'no_children',
    'Children 0-5 years old': 'age_0_5',
    'Children 6-12 years old': 'age_6_12',
};

const ADDITIONAL_SERVICES_MAP = {
    'Puppy care': 'puppy_care',
    'Cat care': 'cat_care',
    'Unspayed female dogs': 'unspayed_female_dogs',
    'Non-neutered male dogs': 'non_neutered_male_dogs',
    'Bathing & grooming': 'bathing_grooming',
    'Dog first aid & CPR': 'dog_first_aid_cpr',
};

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const parseStringArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
        } catch {
            return [];
        }
    }
    return [];
};

const UpdateSitterServices = () => {
    const intl = useIntl();
    const t = (id, values) => intl.formatMessage({ id }, values);
    const dispatchRedux = useDispatch();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    const { userInfo, serviceDetails } = useSelector(selectUser);
    const { locationData } = useGeolocation();

    console.log('userInfo', userInfo);
    console.log('serviceDetails', serviceDetails);

    // useReducer ======================
    const initialState = {
        address: '',
        city: '',
        country: '',
        latitude: '',
        longitude: '',
        location_id: '',
        max_distance:
            serviceDetails?.max_distance != null ? Number(serviceDetails.max_distance) : 20.0,
        types_of_pet: serviceDetails?.types_of_pet || ['PD'],
        dog_size: {
            small: true,
            medium: false,
            large: false,
            extra_large: false,
        },
        is_boarding: serviceDetails?.is_boarding || true,
        boarding_charge:
            serviceDetails?.boarding_charge != null ? Number(serviceDetails.boarding_charge) : 25.0,
        is_house_sitting: serviceDetails?.is_house_sitting || true,
        house_sitting_charge:
            serviceDetails?.house_sitting_charge != null
                ? Number(serviceDetails.house_sitting_charge)
                : 25.0,
        is_drop_in_visit: serviceDetails?.is_drop_in_visit || false,
        drop_in_visit_charge:
            serviceDetails?.drop_in_visit_charge != null
                ? Number(serviceDetails.drop_in_visit_charge)
                : null,
        is_doggy_day_care: serviceDetails?.is_doggy_day_care || true,
        doggy_day_care_charge:
            serviceDetails?.doggy_day_care_charge != null
                ? Number(serviceDetails.doggy_day_care_charge)
                : 25.0,
        is_dog_walking: serviceDetails?.is_dog_walking || true,
        dog_walking_charge:
            serviceDetails?.dog_walking_charge != null
                ? Number(serviceDetails.dog_walking_charge)
                : 25.0,
        pet_sitting_experiences:
            serviceDetails?.pet_sitting_experiences != null
                ? Number(serviceDetails.pet_sitting_experiences)
                : 2,
        lang_ids: normalizeLangIds(serviceDetails?.lang_ids),
        applies: serviceDetails?.applies || {
            dog: true,
            cat: true,
            ironing: false,
        },
        housing_conditions: serviceDetails?.housing_conditions || {
            has_house: true,
            has_fenced_yard: true,
            dog_on_furniture: true,
            dog_on_bed: false,
            non_smoking_home: true,
        },
        pets_in_home: serviceDetails?.pets_in_home || {
            no_dog: false,
            no_cat: true,
            one_client_at_a_time: true,
            no_caged_pets: false,
        },
        children_in_house: serviceDetails?.children_in_house || {
            no_children: false,
            age_0_5: false,
            age_6_12: true,
        },
        additional_services: serviceDetails?.additional_services || {
            puppy_care: true,
            cat_care: true,
            unspayed_female_dogs: false,
            non_neutered_male_dogs: false,
            bathing_grooming: true,
            dog_first_aid_cpr: true,
        },
        weekday_availability: serviceDetails?.weekday_availability || {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: false,
            saturday: false,
            sunday: false,
        },
        description: serviceDetails?.description || userInfo?.description || '',
        experience: serviceDetails?.experience || '',
        safety: serviceDetails?.safety || '',
        communication: parseStringArray(serviceDetails?.communication),
        skills: parseStringArray(serviceDetails?.skills),
    };
    function reducer(state, action) {
        switch (action.type) {
            case 'SET_FIELD':
                return { ...state, [action.field]: action.value };
            case 'RESET_STATE':
                return { ...state, ...action.payload };
            case 'SET_STATE':
                return { ...state, ...action.payload };
            case 'SET_ADDRESS':
                return { ...state, address: action.payload };
            case 'SET_DISTANCE':
                return { ...state, max_distance: Number(action.payload) };
            case 'TOGGLE_SERVICE': {
                const { isKey, chargeKey, checked } = action.payload;
                return {
                    ...state,
                    [isKey]: checked,
                    [chargeKey]: checked ? state[chargeKey] || 25.0 : null,
                };
            }
            case 'UPDATE_SERVICE_PRICE': {
                const { chargeKey, price } = action.payload;
                return {
                    ...state,
                    [chargeKey]: price,
                };
            }
            case 'TOGGLE_PET_TYPE': {
                const pt = action.payload;
                return {
                    ...state,
                    types_of_pet: state.types_of_pet.includes(pt)
                        ? state.types_of_pet.filter((t) => t !== pt)
                        : [...state.types_of_pet, pt],
                };
            }
            case 'TOGGLE_DOG_SIZE': {
                const key = action.payload;
                return {
                    ...state,
                    dog_size: {
                        ...state.dog_size,
                        [key]: !state.dog_size[key],
                    },
                };
            }
            case 'TOGGLE_HOUSING_CONDITION': {
                const key = action.payload;
                return {
                    ...state,
                    housing_conditions: {
                        ...state.housing_conditions,
                        [key]: !state.housing_conditions[key],
                    },
                };
            }
            case 'TOGGLE_PETS_IN_HOME': {
                const key = action.payload;
                return {
                    ...state,
                    pets_in_home: {
                        ...state.pets_in_home,
                        [key]: !state.pets_in_home[key],
                    },
                };
            }
            case 'TOGGLE_CHILDREN_IN_HOUSE': {
                const key = action.payload;
                return {
                    ...state,
                    children_in_house: {
                        ...state.children_in_house,
                        [key]: !state.children_in_house[key],
                    },
                };
            }
            case 'TOGGLE_ADDITIONAL_SERVICE': {
                const key = action.payload;
                return {
                    ...state,
                    additional_services: {
                        ...state.additional_services,
                        [key]: !state.additional_services[key],
                    },
                };
            }
            case 'TOGGLE_AVAILABILITY': {
                const day = action.payload;
                return {
                    ...state,
                    weekday_availability: {
                        ...state.weekday_availability,
                        [day]: !state.weekday_availability[day],
                    },
                };
            }
            case 'TOGGLE_LANGUAGE': {
                const id = Number(action.payload);
                return {
                    ...state,
                    lang_ids: state.lang_ids.includes(id)
                        ? state.lang_ids.filter((lId) => lId !== id)
                        : [...state.lang_ids, id],
                };
            }
            case 'TOGGLE_APPLIES': {
                const key = action.payload;
                return {
                    ...state,
                    applies: {
                        ...state.applies,
                        [key]: !state.applies[key],
                    },
                };
            }
            case 'SET_ARRAY_FIELD': {
                return {
                    ...state,
                    [action.field]: action.value,
                };
            }
            default:
                return state;
        }
    }
    const [state, dispatch] = useReducer(reducer, initialState);
    // useReducer ======================

    const hasLoadedUserInfoRef = useRef(false);
    const hasLoadedGeolocationRef = useRef(false);
    const hasLoadedServiceRef = useRef(false);

    // get user info from redux and update state only if empty
    useEffect(() => {
        if (userInfo && !hasLoadedUserInfoRef.current) {
            dispatch({
                type: 'RESET_STATE',
                payload: {
                    address: userInfo.address || '',
                    city: userInfo.city || '',
                    country: userInfo.country || '',
                    latitude: userInfo.latitude || '',
                    longitude: userInfo.longitude || '',
                    location_id: toLocationId(userInfo.location_id) || '',
                    description: state.description || userInfo.description || '',
                },
            });
            hasLoadedUserInfoRef.current = true;
        }
    }, [userInfo]);

    // Fetch fresh service details from backend on mount
    const hasFetchedRef = useRef(false);
    useEffect(() => {
        if (hasFetchedRef.current) return;
        hasFetchedRef.current = true;
        sitterService
            .fetchService()
            .then((res) => {
                const data = res?.data || res || {};
                dispatchRedux(updateServiceDetails(data));
            })
            .catch((err) => console.error('Error fetching sitter service:', err));
    }, [dispatchRedux]);

    useEffect(() => {
        if (!serviceDetails || hasLoadedServiceRef.current) return;

        const payload = {
            description:
                serviceDetails.description || userInfo?.description || state.description || '',
            experience: serviceDetails.experience || '',
            safety: serviceDetails.safety || '',
            communication: parseStringArray(serviceDetails.communication),
            skills: parseStringArray(serviceDetails.skills),
            lang_ids: normalizeLangIds(serviceDetails.lang_ids),
        };

        if (Array.isArray(serviceDetails.types_of_pet) && serviceDetails.types_of_pet.length > 0) {
            payload.types_of_pet = serviceDetails.types_of_pet;
        }
        if (serviceDetails.max_distance != null) {
            payload.max_distance = Number(serviceDetails.max_distance);
        }
        if (serviceDetails.pet_sitting_experiences != null) {
            payload.pet_sitting_experiences = Number(serviceDetails.pet_sitting_experiences);
        }

        ['is_boarding', 'is_house_sitting', 'is_drop_in_visit', 'is_doggy_day_care', 'is_dog_walking']
            .forEach((key) => {
                if (serviceDetails[key] != null) payload[key] = Boolean(serviceDetails[key]);
            });

        [
            'boarding_charge', 'house_sitting_charge', 'drop_in_visit_charge',
            'doggy_day_care_charge', 'dog_walking_charge',
        ].forEach((key) => {
            if (serviceDetails[key] != null) payload[key] = Number(serviceDetails[key]);
        });

        [
            'dog_size', 'applies', 'housing_conditions', 'pets_in_home',
            'children_in_house', 'additional_services', 'weekday_availability',
        ].forEach((key) => {
            if (
                serviceDetails[key] &&
                typeof serviceDetails[key] === 'object' &&
                Object.keys(serviceDetails[key]).length > 0
            ) {
                payload[key] = serviceDetails[key];
            }
        });

        dispatch({ type: 'RESET_STATE', payload });
        hasLoadedServiceRef.current = true;
    }, [serviceDetails, userInfo]);

    // get location data from geolocator (only if no address is set in userInfo and local address is empty)
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

    const handleAddLanguage = (selectedLang) => {
        // 1. Update LANGUAGE_MAP dynamically
        LANGUAGE_MAP[selectedLang.lang_long] = selectedLang.id;

        // 2. Add the language ID to state.lang_ids
        dispatch({
            type: 'TOGGLE_LANGUAGE',
            payload: selectedLang.id,
        });

        toast.success(t('sitterServices.languages.addedSuccess', { language: selectedLang.lang_long }));
    };

    const handleSubmit = async () => {
        if (isLoading) return;

        const errors = {};
        if (
            !hasSelectedLocation({
                address: state.address,
                latitude: state.latitude,
                longitude: state.longitude,
                location_id: state.location_id,
            })
        ) {
            errors.location = t('sitterServices.location.locationRequired');
        }
        if (!sitterHasServices(state)) {
            errors.services = t('sitterServices.validation.selectService');
        }
        if (!Array.isArray(state.types_of_pet) || state.types_of_pet.length === 0) {
            errors.pets = t('sitterServices.validation.selectPet');
        }
        if (!Object.values(state.weekday_availability || {}).some(Boolean)) {
            errors.days = t('sitterServices.validation.selectDay');
        }
        if (!Array.isArray(state.lang_ids) || state.lang_ids.length === 0) {
            errors.languages = t('sitterServices.validation.selectLanguage');
        }
        setFieldErrors(errors);
        if (Object.keys(errors).length > 0) {
            toast.error(t('sitterServices.validation.requiredFields'));
            requestAnimationFrame(() => {
                document
                    .querySelector('.is-invalid-section')
                    ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
            return;
        }

        setIsLoading(true);
        try {
            // Create copy of state
            const payload = { ...state, lang_ids: normalizeLangIds(state.lang_ids) };
            const locationId = toLocationId(state.location_id);
            if (locationId) {
                payload.location_id = locationId;
            } else {
                delete payload.location_id;
            }
            ['address', 'city', 'country', 'latitude', 'longitude'].forEach((key) => {
                if (payload[key] === '' || payload[key] === null || payload[key] === undefined) {
                    delete payload[key];
                }
            });

            // Trim and filter communication and skills arrays
            if (payload.communication && Array.isArray(payload.communication)) {
                payload.communication = payload.communication
                    .map((item) => (typeof item === 'string' ? item.trim() : ''))
                    .filter(Boolean);
            }
            if (payload.skills && Array.isArray(payload.skills)) {
                payload.skills = payload.skills
                    .map((item) => (typeof item === 'string' ? item.trim() : ''))
                    .filter(Boolean);
            }

            // Trim long text fields
            if (payload.experience && typeof payload.experience === 'string') {
                payload.experience = payload.experience.trim();
            }
            if (payload.safety && typeof payload.safety === 'string') {
                payload.safety = payload.safety.trim();
            }
            if (payload.description && typeof payload.description === 'string') {
                payload.description = payload.description.trim();
            }

            console.log('Submitting form:', payload);

            try {
                await sitterService.updateProfile({
                    first_name: userInfo?.first_name || '',
                    last_name: userInfo?.last_name || '',
                    profile_title: userInfo?.profile_title || '',
                    phone: userInfo?.phone || '',
                    gender: userInfo?.gender || 'M',
                    description: payload.description || '',
                });
                dispatchRedux(updateUserInfo({ description: payload.description || '' }));
            } catch (profileErr) {
                console.error('Error saving bio/description on profile:', profileErr);
            }

            await sitterService
                .updateService(payload)
                .then((data) => {
                    toast.success(t('sitterServices.toasts.updateSuccess'));
                    const savedService = mergeServiceDetails(payload, data?.data);
                    dispatchRedux(updateServiceDetails(savedService));
                    dispatchRedux(
                        updateUserInfo({
                            address: state.address,
                            city: state.city,
                            country: state.country,
                            latitude: state.latitude,
                            longitude: state.longitude,
                            location_id: state.location_id,
                            description: payload.description || '',
                        }),
                    );

                    const completion = evaluateProfileCompletion({
                        userType: 'S',
                        userInfo: {
                            ...userInfo,
                            address: state.address,
                            city: state.city,
                            country: state.country,
                            latitude: state.latitude,
                            longitude: state.longitude,
                            location_id: state.location_id,
                        },
                        serviceDetails: savedService,
                    });

                    if (completion.isComplete) {
                        router.push(completion.listingPath);
                    } else if (completion.missing.length > 0) {
                        toast.info(
                            t('sitterServices.toasts.stillNeeded', {
                                items: completion.missing.join(', '),
                            }),
                        );
                        if (!completion.checks.headline) {
                            router.push('/worker/base-form');
                        }
                    }
                })
                .catch((err) => {
                    toast.error(t('sitterServices.toasts.updateFailed'));
                    console.error('Error submitting form:', err);
                    setIsLoading(false);
                });
            //
        } catch (error) {
            toast.error(t('sitterServices.toasts.saveError'));
            console.error('Error submitting form:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="form-container-2 container">
            <div className={`form-section${fieldErrors.location ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('sitterServices.location.title')}
                    required
                    infoTitle={t('sitterServices.location.infoTitle')}
                    infoItems={SITTER_REQUIREMENTS}
                />
                <p>
                    {t('sitterServices.location.desc')}
                    <br />
                    <strong>{t('sitterServices.location.selectHint')}</strong>{' '}
                    {t('sitterServices.location.selectNote')}
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
                                city: getCityName(addressObj) || location.name || '',
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

            <div className="form-section d-flex flex-column align-items-center gap-md-4 gap-2">
                <h2>{t('sitterServices.travelDistance')}</h2>
                <RangeSlider
                    data={{
                        min: 1,
                        max: 25,
                        steps: 0.5,
                        value: state.max_distance,
                        onChange: (val) => dispatch({ type: 'SET_DISTANCE', payload: val }),
                    }}
                />
                <Link href={'/'} className="underline">
                    {t('sitterServices.showWorkArea')}
                </Link>
            </div>
            <div className="row mt-5 mb-2">
                <h2 className="heading1">{t('sitterServices.serviceSelection')}</h2>

                <FieldHint
                    title={t('sitterServices.whichServices')}
                    required
                    as="h4"
                    className="subheading1"
                    infoTitle={t('sitterServices.location.infoTitle')}
                    infoItems={SITTER_REQUIREMENTS}
                />
                {fieldErrors.services && (
                    <span className="field-error-text">{fieldErrors.services}</span>
                )}
            </div>

            <div className="row">
                {SERVICES_CONFIG.map((service) => (
                    <div className="col-md-6" key={service.id}>
                        <CustomCheckboxWithValue
                            label={t(service.labelKey)}
                            icon={service.icon}
                            checked={state[service.isKey]}
                            desc={t(service.descKey)}
                            value={state[service.chargeKey]}
                            onChange={(e) =>
                                dispatch({
                                    type: 'TOGGLE_SERVICE',
                                    payload: {
                                        isKey: service.isKey,
                                        chargeKey: service.chargeKey,
                                        checked: e.target.checked,
                                    },
                                })
                            }
                            onValueChange={(val) =>
                                dispatch({
                                    type: 'UPDATE_SERVICE_PRICE',
                                    payload: {
                                        chargeKey: service.chargeKey,
                                        price: val,
                                    },
                                })
                            }
                        />
                    </div>
                ))}
            </div>

            <div
                className={`form-section d-flex flex-column flex-md-row justify-content-between align-items-center${fieldErrors.pets ? ' is-invalid-section' : ''}`}
            >
                <FieldHint
                    title={t('sitterServices.petTypes')}
                    required
                    infoTitle={t('sitterServices.location.infoTitle')}
                    infoItems={SITTER_REQUIREMENTS}
                />
                <div className="checkbox-group">
                    {['Dog', 'Cat'].map((type) => {
                        const petCode = type === 'Dog' ? 'PD' : 'PC';
                        return (
                            <CustomCheckbox
                                key={type}
                                label={
                                    type === 'Dog'
                                        ? t('sitterServices.dog')
                                        : t('sitterServices.cat')
                                }
                                checked={state.types_of_pet.includes(petCode)}
                                onChange={() => {
                                    setFieldErrors((prev) => {
                                        if (!prev.pets) return prev;
                                        const next = { ...prev };
                                        delete next.pets;
                                        return next;
                                    });
                                    dispatch({ type: 'TOGGLE_PET_TYPE', payload: petCode });
                                }}
                            />
                        );
                    })}
                </div>
                {fieldErrors.pets && <span className="field-error-text">{fieldErrors.pets}</span>}
            </div>

            <div className="form-section d-flex flex-column flex-md-row justify-content-between align-items-center">
                <h2>{t('sitterServices.dogSize')}</h2>
                <div className="checkbox-group">
                    {Object.entries({
                        '0-15': 'small',
                        '16-40': 'medium',
                        '41-100': 'large',
                        '101+': 'extra_large',
                    }).map(([label, key]) => (
                        <CustomCheckbox
                            key={label}
                            label={label}
                            checked={state.dog_size[key]}
                            onChange={() => dispatch({ type: 'TOGGLE_DOG_SIZE', payload: key })}
                        />
                    ))}
                </div>
            </div>

            <div className="row g-4">
                <div className="col-md-6">
                    <div className="custom-checkbox-group">
                        <div className="w-100">
                            <h4 className="heading">{t('sitterServices.housingConditions')}</h4>
                        </div>
                        <div className="checkbox-group">
                            {Object.entries(HOUSING_MAP).map(([label, key]) => (
                                <div key={key} className="checkbox-item">
                                    <CustomCheckbox
                                        label={t(HOUSING_LABEL_KEYS[key])}
                                        checked={state.housing_conditions[key]}
                                        onChange={() =>
                                            dispatch({
                                                type: 'TOGGLE_HOUSING_CONDITION',
                                                payload: key,
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="custom-checkbox-group">
                        <div className="w-100">
                            <h4 className="heading">{t('sitterServices.petsInHome')}</h4>
                        </div>
                        <div className="checkbox-group">
                            {Object.entries(PETS_IN_HOME_MAP).map(([label, key]) => (
                                <div key={key} className="checkbox-item">
                                    <CustomCheckbox
                                        label={t(PETS_IN_HOME_LABEL_KEYS[key])}
                                        checked={state.pets_in_home[key]}
                                        onChange={() =>
                                            dispatch({ type: 'TOGGLE_PETS_IN_HOME', payload: key })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="row g-4 mb-md-5 mt-1 mb-4">
                <div className="col-md-6">
                    <div className="custom-checkbox-group">
                        <div className="w-100">
                            <h4 className="heading">{t('sitterServices.childrenInHouse')}</h4>
                        </div>
                        <div className="checkbox-group">
                            {Object.entries(CHILDREN_MAP).map(([label, key]) => (
                                <div key={key} className="checkbox-item">
                                    <CustomCheckbox
                                        label={t(CHILDREN_LABEL_KEYS[key])}
                                        checked={state.children_in_house[key]}
                                        onChange={() =>
                                            dispatch({
                                                type: 'TOGGLE_CHILDREN_IN_HOUSE',
                                                payload: key,
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="custom-checkbox-group">
                        <div className="w-100">
                            <h4 className="heading">{t('sitterServices.additionalServices')}</h4>
                        </div>
                        <div className="checkbox-group">
                            {Object.entries(ADDITIONAL_SERVICES_MAP).map(([label, key]) => (
                                <div key={key} className="checkbox-item">
                                    <CustomCheckbox
                                        label={t(ADDITIONAL_SERVICES_LABEL_KEYS[key])}
                                        checked={state.additional_services[key]}
                                        onChange={() =>
                                            dispatch({
                                                type: 'TOGGLE_ADDITIONAL_SERVICE',
                                                payload: key,
                                            })
                                        }
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className={`form-section${fieldErrors.days ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('sitterServices.days.title')}
                    required
                    infoTitle={t('sitterServices.location.infoTitle')}
                    infoItems={SITTER_REQUIREMENTS}
                />
                <div className="checkbox-group">
                    {DAYS.map((day) => (
                        <CustomCheckbox
                            key={day}
                            label={t(`sitterServices.days.${day}`)}
                            checked={state.weekday_availability[day]}
                            onChange={() => {
                                setFieldErrors((prev) => {
                                    if (!prev.days) return prev;
                                    const next = { ...prev };
                                    delete next.days;
                                    return next;
                                });
                                dispatch({ type: 'TOGGLE_AVAILABILITY', payload: day });
                            }}
                        />
                    ))}
                </div>
                {fieldErrors.days && <span className="field-error-text">{fieldErrors.days}</span>}
            </div>

            <div className={`form-section${fieldErrors.languages ? ' is-invalid-section' : ''}`}>
                <FieldHint
                    title={t('sitterServices.languages.title')}
                    required
                    infoTitle={t('sitterServices.location.infoTitle')}
                    infoItems={SITTER_REQUIREMENTS}
                />
                <div className="checkbox-group">
                    {Object.entries(LANGUAGE_MAP).map(([langName, langId]) => (
                        <CustomCheckbox
                            key={langName}
                            label={t(`sitterServices.languages.${langName.toLowerCase()}`)}
                            checked={state.lang_ids.includes(Number(langId))}
                            onChange={() => {
                                setFieldErrors((prev) => {
                                    if (!prev.languages) return prev;
                                    const next = { ...prev };
                                    delete next.languages;
                                    return next;
                                });
                                dispatch({ type: 'TOGGLE_LANGUAGE', payload: Number(langId) });
                            }}
                        />
                    ))}
                </div>
                <button
                    type="button"
                    className="add-language-btn"
                    onClick={() => setShowLangModal(true)}
                >
                    {t('sitterServices.languages.addLanguage')}
                </button>
                {fieldErrors.languages && (
                    <span className="field-error-text">{fieldErrors.languages}</span>
                )}
            </div>

            <div className="form-section">
                <h2>{t('sitterServices.exclusions.title')}</h2>
                <div className="checkbox-group">
                    <CustomCheckbox
                        label={t('sitterServices.exclusions.noDogs')}
                        checked={!state.applies.dog}
                        onChange={() => dispatch({ type: 'TOGGLE_APPLIES', payload: 'dog' })}
                    />
                    <CustomCheckbox
                        label={t('sitterServices.exclusions.noCats')}
                        checked={!state.applies.cat}
                        onChange={() => dispatch({ type: 'TOGGLE_APPLIES', payload: 'cat' })}
                    />
                    <CustomCheckbox
                        label={t('sitterServices.exclusions.noIroning')}
                        checked={!state.applies.ironing}
                        onChange={() => dispatch({ type: 'TOGGLE_APPLIES', payload: 'ironing' })}
                    />
                </div>
            </div>

            <div className="form-section">
                <h2>{t('sitterServices.bio.title')}</h2>
                <p>{t('sitterServices.bio.desc')}</p>
                <RichTextEditor
                    value={state.description}
                    placeholder={t('sitterServices.bio.placeholder')}
                    onChange={(value) =>
                        dispatch({ type: 'SET_FIELD', field: 'description', value })
                    }
                />
            </div>

            <div className="form-section">
                <h2>{t('sitterServices.experience.title')}</h2>
                <p>{t('sitterServices.experience.desc')}</p>
                <RichTextEditor
                    value={state.experience}
                    placeholder={t('sitterServices.experience.placeholder')}
                    onChange={(value) =>
                        dispatch({ type: 'SET_FIELD', field: 'experience', value })
                    }
                />
            </div>

            <div className="form-section">
                <h2>{t('sitterServices.safety.title')}</h2>
                <p>{t('sitterServices.safety.desc')}</p>
                <RichTextEditor
                    value={state.safety}
                    placeholder={t('sitterServices.safety.placeholder')}
                    onChange={(value) => dispatch({ type: 'SET_FIELD', field: 'safety', value })}
                />
            </div>

            <div className="row g-4 mb-4">
                <div className="col-md-6">
                    <div className="form-section">
                        <h2>{t('sitterServices.communication.title')}</h2>
                        <p>{t('sitterServices.communication.desc')}</p>
                        <ArrayInput
                            items={state.communication}
                            onChange={(value) =>
                                dispatch({ type: 'SET_ARRAY_FIELD', field: 'communication', value })
                            }
                            placeholder={t('sitterServices.communication.placeholder')}
                            maxItems={20}
                            maxLength={255}
                        />
                    </div>
                </div>
                <div className="col-md-6">
                    <div className="form-section">
                        <h2>{t('sitterServices.skills.title')}</h2>
                        <p>{t('sitterServices.skills.desc')}</p>
                        <ArrayInput
                            items={state.skills}
                            onChange={(value) =>
                                dispatch({ type: 'SET_ARRAY_FIELD', field: 'skills', value })
                            }
                            placeholder={t('sitterServices.skills.placeholder')}
                            maxItems={20}
                            maxLength={255}
                        />
                    </div>
                </div>
            </div>

            <button className="btn-primary" onClick={handleSubmit} disabled={isLoading}>
                {isLoading ? <span className="spinner"></span> : t('sitterServices.submit.submitContinue')}
            </button>

            <LanguageModal
                show={showLangModal}
                onHide={() => setShowLangModal(false)}
                onAddLanguage={handleAddLanguage}
                excludeLanguages={Object.keys(LANGUAGE_MAP)}
            />
        </div>
    );
};

export default UpdateSitterServices;
