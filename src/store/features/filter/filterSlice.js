import { createAppSlice } from '@/store/createAppSlice';

const initialFilterState = {
    filters: {},
    searchResults: [],
    pendingSearchLocation: '',
};

// If you are not using async thunks you can use the standalone `createSlice`.
const filterSlice = createAppSlice({
    name: 'filters',
    initialState: initialFilterState,
    reducers: (create) => ({
        updateFilters: create.reducer((state, action) => {
            state.filters = action.payload;
        }),
        updateSearchResults: create.reducer((state, action) => {
            state.searchResults = action.payload;
        }),
        setPendingSearchLocation: create.reducer((state, action) => {
            state.pendingSearchLocation = action.payload || '';
        }),
        clearPendingSearchLocation: create.reducer((state) => {
            state.pendingSearchLocation = '';
        }),
    }),
    selectors: {
        selectFilters: (state) => state.filters,
        selectSearchResults: (state) => state.searchResults,
        selectPendingSearchLocation: (state) => state.pendingSearchLocation,
    },
});

export const {
    updateFilters,
    updateSearchResults,
    setPendingSearchLocation,
    clearPendingSearchLocation,
} = filterSlice.actions;
export const { selectFilters, selectSearchResults, selectPendingSearchLocation } =
    filterSlice.selectors;
export default filterSlice;
