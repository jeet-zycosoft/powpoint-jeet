'use client';
import { useEffect, useRef, useState } from 'react';
import './Select.scss';

const DownArrow = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
            d="M11.707 13.1991L6.414 7.99997L5 9.41397L11.707 16.121L18.414 9.41397L17 7.99997L11.707 13.1991Z"
            fill="black"
        />
    </svg>
);

const Select = ({ SelectData, value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [internalSelected, setInternalSelected] = useState(SelectData.options[0]);
    const containerRef = useRef(null);

    const isObjectOptions =
        SelectData.options.length > 0 && typeof SelectData.options[0] === 'object';

    let selectedDisplay;
    if (isObjectOptions) {
        const selectedOpt = SelectData.options.find((opt) => opt.value === value);
        selectedDisplay = selectedOpt
            ? selectedOpt.label
            : value
              ? value
              : SelectData.placeholder || internalSelected?.label;
    } else {
        selectedDisplay =
            value !== undefined && value !== ''
                ? value
                : SelectData.placeholder || internalSelected;
    }

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    const handleSelect = (option) => {
        if (onChange) {
            onChange(isObjectOptions ? option.value : option);
        } else {
            setInternalSelected(option);
        }
        setIsOpen(false);
    };

    return (
        <div
            className={`form-group custom-select-container${isOpen ? ' is-open' : ''}`}
            ref={containerRef}
        >
            {SelectData.label && <label htmlFor={SelectData.id}>{SelectData.label}</label>}
            <div
                className="select-trigger"
                onClick={() => setIsOpen(!isOpen)}
                role="combobox"
                aria-expanded={isOpen}
                aria-controls={SelectData.id ? `${SelectData.id}-listbox` : undefined}
                aria-haspopup="listbox"
            >
                {selectedDisplay}
                <span className={`arrow ${isOpen ? 'open' : ''}`}>
                    <DownArrow />
                </span>
            </div>

            {isOpen && (
                <ul
                    className="options-list"
                    id={SelectData.id ? `${SelectData.id}-listbox` : undefined}
                    role="listbox"
                >
                    {SelectData.options.map((option, index) => (
                        <li key={index} role="option" onClick={() => handleSelect(option)}>
                            {isObjectOptions ? option.label : option}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default Select;
