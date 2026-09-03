'use client';
import { injectStore } from '@/services/apiClient';
import { makeStore } from '@/store/store.js';
import { useRef } from 'react';
import { Provider } from 'react-redux';

export default function StoreProvider({ children }) {
    const storeRef = useRef();
    if (!storeRef.current) {
        // Create the store instance the first time this renders
        storeRef.current = makeStore();
        injectStore(storeRef.current);
    }
    return <Provider store={storeRef.current}>{children}</Provider>;
}
