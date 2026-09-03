'use client';

import { useState } from 'react';
import { useIntl } from 'react-intl';
import './CheckboxDropdown.scss';

import CustomCheckbox from '@/components/formComponents/CustomCheckbox';

const CheckboxDropdown = ({ title, options = [], selectedValues = [], onChange }) => {
    const intl = useIntl();
    const [isOpen, setIsOpen] = useState(true);
    const toggleDropdown = () => {
        setIsOpen(!isOpen);
    };

    const isAllSelected =
        options.length > 0 && options.every((opt) => selectedValues.includes(opt.value));

    const handleAllChange = () => {
        if (!onChange) return;
        if (isAllSelected) {
            // Uncheck everything
            onChange([]);
        } else {
            // Check everything
            onChange(options.map((opt) => opt.value));
        }
    };

    const handleCheckboxChange = (value) => {
        if (!onChange) return;

        const newSelectedValues = selectedValues.includes(value)
            ? selectedValues.filter((v) => v !== value)
            : [...selectedValues, value];

        onChange(newSelectedValues);
    };

    return (
        <div className={`checkbox-dropdown ${isOpen ? 'open' : ''}`}>
            <div className="checkbox-dropdown-title" onClick={toggleDropdown}>
                <p>{title}</p>
                <span>
                    <svg
                        className="chevron"
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M6 9L12 15L18 9"
                            stroke="#4a766e"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </span>
            </div>

            <div
                className="checkbox-group"
                style={{
                    height: isOpen ? `calc(var(--item-height) * ${options.length + 1})` : '0',
                }}
            >
                <CustomCheckbox
                    key="all"
                    label={intl.formatMessage({ id: 'common.all' })}
                    checked={isAllSelected}
                    onChange={handleAllChange}
                />
                {options.map((option) => (
                    <CustomCheckbox
                        key={option.value}
                        label={option.label}
                        checked={selectedValues.includes(option.value)}
                        onChange={() => handleCheckboxChange(option.value)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CheckboxDropdown;
