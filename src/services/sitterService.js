import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const sitterService = {
    fetchProfile: async (data = {}) => {
        const response = await apiClient.post(endpoints.sitter.fetchProfile, data);
        return response.data;
    },
    updateProfile: async (data = {}) => {
        const response = await apiClient.post(endpoints.sitter.updateProfile, data);
        return response.data;
    },
    fetchService: async (data = {}) => {
        const response = await apiClient.post(endpoints.sitter.fetchService, data);
        return response.data;
    },
    updateService: async (data) => {
        const response = await apiClient.post(endpoints.sitter.updateService, data);
        return response.data;
    },
    ownerList: async (data) => {
        const response = await apiClient.post(endpoints.sitter.ownerList, data);
        return response.data;
    },
    ownerDetail: async (data) => {
        const params = typeof data === 'object' ? data : { sitter_id: data };
        const response = await apiClient.get(endpoints.sitter.ownerDetail, { params });
        return response.data;
    },
    submitReview: async (data) => {
        const response = await apiClient.post(endpoints.sitter.submitReview, data);
        return response.data;
    },
    reviewsGiven: async (data) => {
        const params = typeof data === 'object' ? data : {};
        const response = await apiClient.get(endpoints.sitter.reviewsGiven, { params });
        return response.data;
    },
    reviewsReceived: async (data) => {
        const params = typeof data === 'object' ? data : {};
        const response = await apiClient.get(endpoints.sitter.reviewsReceived, { params });
        return response.data;
    },
};
