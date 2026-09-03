'use client';

import dynamic from 'next/dynamic';

import MapLoadingState from './MapLoadingState';

const DynamicMap = dynamic(() => import('./MapComponent'), {
    ssr: false,
    loading: () => <MapLoadingState />,
});

export default function MapViewWrapper(props) {
    return <DynamicMap {...props} />;
}
