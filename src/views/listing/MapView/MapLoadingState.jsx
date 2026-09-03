'use client';

import { Spinner } from 'react-bootstrap';
import { useIntl } from 'react-intl';

export default function MapLoadingState() {
    const intl = useIntl();

    return (
        <div
            style={{
                height: '100%',
                width: '100%',
                minHeight: '300px',
                background: '#f8f6f1',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '1.5rem',
                border: '1px solid #f0ece2',
                color: '#4a766e',
                fontWeight: 'bold',
                padding: '2rem',
            }}
        >
            <Spinner
                animation="border"
                variant="primary"
                style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    color: '#4a766e',
                    marginBottom: '1rem',
                }}
            />
            <span>{intl.formatMessage({ id: 'listing.map.loadingCoordinates' })}</span>
        </div>
    );
}
