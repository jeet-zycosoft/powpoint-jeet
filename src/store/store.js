import { combineSlices, configureStore } from '@reduxjs/toolkit';
import filterSlice from './features/filter/filterSlice';
import siteSettingsSlice from './features/siteSettings/siteSettingsSlice';
import userSlice from './features/user/userSlice';

const rootReducer = combineSlices(filterSlice, userSlice, siteSettingsSlice);

const loadState = () => {
    try {
        if (typeof window === 'undefined') return undefined;
        const serializedState = localStorage.getItem('reduxState');
        if (serializedState === null) {
            return undefined;
        }
        return JSON.parse(serializedState);
    } catch {
        return undefined;
    }
};

const saveState = (state) => {
    try {
        if (typeof window === 'undefined') return;
        const serializedState = JSON.stringify(state);
        localStorage.setItem('reduxState', serializedState);
    } catch {
        // ignore write errors
    }
};

export const makeStore = () => {
    const preloadedState = loadState();
    const store = configureStore({
        reducer: rootReducer,
        preloadedState,
    });

    store.subscribe(() => {
        const user = store.getState().user;
        // After logout, do not re-write an empty reduxState blob back to disk
        if (!user?.isAuthenticated) {
            try {
                localStorage.removeItem('reduxState');
            } catch {
                // ignore
            }
            return;
        }
        saveState({
            user,
        });
    });

    return store;
};
