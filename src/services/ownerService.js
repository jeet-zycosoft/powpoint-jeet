import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const ownerService = {
    fetchProfile: async (data = {}) => {
        const response = await apiClient.post(endpoints.customer.fetchProfile, data);
        return response.data;
    },
    updateProfile: async (data = {}) => {
        const response = await apiClient.post(endpoints.customer.updateProfile, data);
        return response.data;
    },
    fetchService: async (data = {}) => {
        const response = await apiClient.post(endpoints.customer.fetchService, data);
        return response.data;
    },
    updateService: async (data) => {
        const response = await apiClient.post(endpoints.customer.updateService, data);
        return response.data;
    },
    sitterList: async (data) => {
        const response = await apiClient.post(endpoints.customer.sitterList, data);
        return response.data;
    },
    sitterDetail: async (data) => {
        const params = typeof data === 'object' ? data : { sitter_id: data };
        const response = await apiClient.get(endpoints.customer.sitterDetail, { params });
        return response.data;
    },
    alternativeSitterList: async (data) => {
        const id = typeof data === 'object' ? data?.sitter_id || data?.id : data;
        const response = await apiClient.get(
            `${endpoints.customer.alternativeSitterList}?sitter_id=${id}`,
        );
        return response.data;
    },
    createSubscription: async (data) => {
        const response = await apiClient.post(endpoints.customer.createSubscription, data);
        return response.data;
    },
    fetchPlan: async (data) => {
        const response = await apiClient.get(endpoints.customer.fetchPlan, data);
        return response.data;
    },
    createOrder: async (data) => {
        const response = await apiClient.post(endpoints.customer.createOrder, data);
        return response.data;
    },
    updateOrder: async (data) => {
        const response = await apiClient.post(endpoints.customer.updateOrder, data);
        return response.data;
    },
    getAllOrders: async (data) => {
        const response = await apiClient.post(endpoints.customer.getAllOrders, data);
        return response.data;
    },
    getOrder: async (data) => {
        const response = await apiClient.post(endpoints.customer.getOrder, data);
        return response.data;
    },
    deleteOrder: async (data) => {
        const response = await apiClient.post(endpoints.customer.deleteOrder, data);
        return response.data;
    },
    paymentSuccess: async (data) => {
        const response = await apiClient.post(endpoints.customer.paymentSuccess, data);
        return response.data;
    },
    paymentCancel: async (data) => {
        const response = await apiClient.post(endpoints.customer.paymentCancel, data);
        return response.data;
    },
    paymentConfig: async (data) => {
        const response = await apiClient.get(endpoints.customer.paymentConfig, data);
        return response.data;
    },
    getSubscriptionDetail: async (data) => {
        const response = await apiClient.get(endpoints.customer.getSubscriptionDetail, data);
        return response.data;
    },
    activeSubscriptionsOverview: async (data) => {
        const response = await apiClient.get(endpoints.customer.activeSubscriptionsOverview, data);
        return response.data;
    },
    cancelSubscription: async (data) => {
        const response = await apiClient.get(endpoints.customer.cancelSubscription, data);
        return response.data;
    },
    submitReview: async (data) => {
        const response = await apiClient.post(endpoints.customer.submitReview, data);
        return response.data;
    },
    reviewsGiven: async (data) => {
        const params = typeof data === 'object' ? data : {};
        const response = await apiClient.get(endpoints.customer.reviewsGiven, { params });
        return response.data;
    },
    reviewsReceived: async (data) => {
        const params = typeof data === 'object' ? data : {};
        const response = await apiClient.get(endpoints.customer.reviewsReceived, { params });
        return response.data;
    },
};
