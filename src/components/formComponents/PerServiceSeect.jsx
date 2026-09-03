'use client';

import { useState } from 'react';
import { useIntl } from 'react-intl';
import './PetServiceSelect.scss';
import RateSlider from './RateSlider';

import Select from './Select';

const PetServiceSelect = ({
    isSitterListing,
    serviceType,
    petTypes,
    maxPrice,
    dogSize,
    onServiceChange,
    onPetTypeChange,
    onDogSizeChange,
    onMaxPriceChange,
}) => {
    const intl = useIntl();
    const [localService, setLocalService] = useState('Dog Boarding');
    const [localPetType, setLocalPetType] = useState('Dog');
    const [localDogSize, setLocalDogSize] = useState('16-40');
    const [localRate, setLocalRate] = useState(40);

    const isControlled = serviceType !== undefined;

    const getUiServiceFromPayload = (serviceTypeObj) => {
        if (!serviceTypeObj) return 'Dog Boarding';
        if (serviceTypeObj.is_boarding) return 'Dog Boarding';
        if (serviceTypeObj.is_house_sitting) return 'House Sitting';
        if (serviceTypeObj.is_doggy_day_care) return 'Doggy Day Care';
        if (serviceTypeObj.is_dog_walking) return 'Dog Walking';
        return 'Dog Boarding';
    };

    const getUiPetTypeFromPayload = (petTypesObj) => {
        if (!petTypesObj) return 'Dog';
        if (petTypesObj.is_dog) return 'Dog';
        if (petTypesObj.is_cat) return 'Cat';
        return 'Dog';
    };

    const currentService = isControlled ? getUiServiceFromPayload(serviceType) : localService;
    const currentPetType = isControlled ? getUiPetTypeFromPayload(petTypes) : localPetType;
    const currentDogSize = isControlled ? dogSize : localDogSize;
    const currentMaxPrice = isControlled ? maxPrice : localRate;

    const handleServiceChange = (val) => {
        if (isControlled) {
            if (onServiceChange) onServiceChange(val);
        } else {
            setLocalService(val);
        }
    };

    const handlePetTypeChange = (val) => {
        if (isControlled) {
            if (onPetTypeChange) onPetTypeChange(val);
        } else {
            setLocalPetType(val);
        }
    };

    const handlePetSizeChange = (val) => {
        if (isControlled) {
            if (onDogSizeChange) onDogSizeChange(val);
        } else {
            setLocalDogSize(val);
        }
    };

    const handleRateChange = (val) => {
        if (isControlled) {
            if (onMaxPriceChange) onMaxPriceChange(val);
        } else {
            setLocalRate(val);
        }
    };

    const serviceSelectData = {
        label: intl.formatMessage({ id: 'services.serviceType' }),
        id: 'service',
        options: [
            {
                value: 'Dog Boarding',
                label: intl.formatMessage({ id: 'services.boarding' }),
            },
            {
                value: 'House Sitting',
                label: intl.formatMessage({ id: 'services.sitting' }),
            },
            {
                value: 'Doggy Day Care',
                label: intl.formatMessage({ id: 'services.daycare' }),
            },
            {
                value: 'Dog Walking',
                label: intl.formatMessage({ id: 'services.walking' }),
            },
        ],
    };

    const petTypeOptions = [
        { type: 'Dog', labelId: 'services.dog' },
        { type: 'Cat', labelId: 'services.cat' },
    ];

    return (
        <div className="pet-service">
            <Select
                SelectData={serviceSelectData}
                value={currentService}
                onChange={handleServiceChange}
            />

            <label>{intl.formatMessage({ id: 'services.petType' })}</label>
            <div className="pet-options">
                {petTypeOptions.map(({ type, labelId }) => (
                    <label
                        key={type}
                        className={`pet-option ${currentPetType === type ? 'active' : ''}`}
                    >
                        <input
                            type="radio"
                            name="petType"
                            value={type}
                            checked={currentPetType === type}
                            onChange={() => handlePetTypeChange(type)}
                        />
                        <span className="label-text">
                            {intl.formatMessage({ id: labelId })}
                        </span>
                        <span className="radio-circle"></span>
                    </label>
                ))}
            </div>
            {isSitterListing && (
                <>
                    <label>
                        {intl.formatMessage({ id: 'services.dogSize' })} (lbs)*
                    </label>
                    <div className="pet-options">
                        {['0-15', '16-40', '41-100', '101+'].map((type) => (
                            <label
                                key={type}
                                className={`pet-option ${currentDogSize === type ? 'active' : ''}`}
                            >
                                <input
                                    type="radio"
                                    name="dogSize"
                                    value={type}
                                    checked={currentDogSize === type}
                                    onChange={() => handlePetSizeChange(type)}
                                />
                                <span className="label-text">{type}</span>
                                <span className="radio-circle"></span>
                            </label>
                        ))}
                    </div>
                    <RateSlider value={currentMaxPrice} onChange={handleRateChange} />
                </>
            )}
        </div>
    );
};

export default PetServiceSelect;
