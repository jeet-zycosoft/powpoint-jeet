'use client';
import { useState } from 'react';
import { useIntl } from 'react-intl';
import './RangeSlider.scss';

const RangeSlider = (data) => {
    const intl = useIntl();
    const km = intl.formatMessage({ id: 'common.km' });
    const { min, max, defaultValue, steps, onChange, label, value } = data.data;
    // Use controlled value if provided, otherwise fallback to defaultValue/internal state
    // But for this refactor, we prefer controlled.
    const [internalValue, setInternalValue] = useState(defaultValue || min);

    const isControlled = value !== undefined;
    const displayValue = isControlled ? value : internalValue;

    const handleValueChange = (e) => {
        const newValue = parseFloat(e.target.value);
        if (!isControlled) {
            setInternalValue(newValue);
        }
        if (onChange) {
            onChange(newValue);
        }
    };

    const getBackgroundSize = (val, min, max) => {
        const percentage = ((val - min) / (max - min)) * 100;
        return {
            backgroundSize: `${percentage}% 100%`,
        };
    };

    const percentage = ((displayValue - min) / (max - min)) * 100;

    return (
        <div className="range-slider-container">
            {label && <label htmlFor="value">{label}</label>}
            <div className="slider-wrapper">
                <span>
                    {min}
                    {km}
                </span>
                <div className="slider-input-container">
                    <div
                        className="slider-tooltip"
                        style={{
                            left: `calc(${percentage}% + (${10 - percentage * 0.2}px))`,
                        }}
                    >
                        {displayValue}
                        {km}
                    </div>
                    <input
                        type="range"
                        id="value"
                        min={min}
                        max={max}
                        step={steps}
                        value={displayValue}
                        onChange={handleValueChange}
                        style={getBackgroundSize(displayValue, min, max)}
                    />
                </div>
                <span>
                    {max}
                    {km}
                </span>
            </div>
        </div>
    );
};

export default RangeSlider;
