'use client';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import './RateSlider.scss';

const RateSlider = ({ value, onChange }) => {
    const intl = useIntl();
    const [localRate, setLocalRate] = useState(40);

    const isControlled = value !== undefined;
    const currentRate = isControlled ? value : localRate;

    const handleRateChange = (e) => {
        const newRate = parseInt(e.target.value);
        if (isControlled) {
            if (onChange) onChange(newRate);
        } else {
            setLocalRate(newRate);
        }
    };

    const getBackgroundSize = () => {
        const min = 1;
        const max = 250;
        const val = currentRate;
        const percentage = ((val - min) / (max - min)) * 100;
        return {
            backgroundSize: `${percentage}% 100%`,
        };
    };

    return (
        <div className="rate-slider-container">
            <label htmlFor="rate">{intl.formatMessage({ id: 'forms.ratePerNight' })}</label>
            <div className="slider-wrapper">
                <span>$1</span>
                <input
                    type="range"
                    id="rate"
                    min="1"
                    max="250"
                    value={currentRate}
                    onChange={handleRateChange}
                    style={getBackgroundSize()}
                />
                <span>$250</span>
            </div>
        </div>
    );
};

export default RateSlider;
