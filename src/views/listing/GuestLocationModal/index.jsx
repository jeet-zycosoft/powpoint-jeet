'use client';

import SearchBox from '@/components/formComponents/SearchBox';
import { formatLocationLabel } from '@/services/addressFormat';
import { toLocationId } from '@/hooks/useGeolocation';
import { Modal } from 'react-bootstrap';
import { FaMapMarkerAlt } from 'react-icons/fa';
import { useIntl } from 'react-intl';
import { toast } from 'react-toastify';
import './style.scss';

const GuestLocationModal = ({
    isOpen,
    addressValue,
    onAddressChange,
    onLocationSelect,
    onSearch,
}) => {
    const intl = useIntl();

    const handleLocationSelect = (location) => {
        onLocationSelect({
            latitude: Number(location.lat),
            longitude: Number(location.lon),
            location_id: toLocationId(location.place_id) ?? null,
            label: formatLocationLabel(location),
        });
    };

    const handleSearch = () => {
        const searched = onSearch?.();
        if (!searched) {
            toast.info(intl.formatMessage({ id: 'listing.guestModal.locationRequired' }));
        }
    };

    return (
        <Modal
            show={isOpen}
            centered
            backdrop="static"
            keyboard={false}
            className="guest-location-modal"
        >
            <Modal.Body>
                <div className="guest-location-modal__icon" aria-hidden>
                    <FaMapMarkerAlt />
                </div>
                <h3 className="guest-location-modal__title">
                    {intl.formatMessage({ id: 'listing.guestModal.title' })}
                </h3>
                <p className="guest-location-modal__copy">
                    {intl.formatMessage({ id: 'listing.guestModal.copy' })}
                </p>
                <label className="guest-location-modal__label" htmlFor="guest-listing-location">
                    {intl.formatMessage({ id: 'listing.guestModal.locationLabel' })}
                </label>
                <SearchBox
                    value={addressValue || ''}
                    onChange={onAddressChange}
                    onLocationSelect={handleLocationSelect}
                    onButtonClick={handleSearch}
                    placeholder={intl.formatMessage({ id: 'listing.guestModal.placeholder' })}
                    autoFocus
                    inputId="guest-listing-location"
                />
                <button type="button" className="guest-location-modal__search" onClick={handleSearch}>
                    {intl.formatMessage({ id: 'listing.guestModal.searchSitters' })}
                </button>
            </Modal.Body>
        </Modal>
    );
};

export default GuestLocationModal;
