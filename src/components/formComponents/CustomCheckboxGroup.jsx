'use client';
import './CustomCheckboxGroup.scss';
const CustomCheckboxGroup = ({
    label,
    items,
    selectedItems = [],
    onChange,
    isDisabled = false,
}) => {
    const handleCheckboxChange = (e, item) => {
        const isChecked = e.target.checked;
        let newSelectedItems = [...selectedItems];

        if (isChecked) {
            if (!newSelectedItems.includes(item)) {
                newSelectedItems.push(item);
            }
        } else {
            newSelectedItems = newSelectedItems.filter((i) => i !== item);
        }

        onChange(newSelectedItems);
    };

    return (
        <div className="custom-checkbox-group">
            <div className="w-100">
                <h4 className="heading">{label}</h4>
            </div>
            <div className="checkbox-group">
                {items?.map((item, index) => (
                    <div key={index} className="checkbox-item">
                        <label className="checkbox">
                            <input
                                type="checkbox"
                                checked={selectedItems.includes(item)}
                                onChange={(e) => handleCheckboxChange(e, item)}
                                disabled={isDisabled}
                            />
                            <span className="checkmark"></span>
                            <p>{item}</p>
                        </label>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CustomCheckboxGroup;
