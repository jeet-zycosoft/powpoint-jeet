import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const authService = {
    register: async (data) => {
        const response = await apiClient.post(endpoints.auth.register, data, { skipAuth: true });
        return response.data;
    },
    login: async (data) => {
        const response = await apiClient.post(endpoints.auth.login, data, { skipAuth: true });
        return response.data;
    },
    changePassword: async (data) => {
        const response = await apiClient.post(endpoints.auth.changePassword, data);
        return response.data;
    },
    forgotPassword: async (data) => {
        const response = await apiClient.post(endpoints.auth.forgotPassword, data);
        return response.data;
    },
    recoverPassword: async (data) => {
        const response = await apiClient.post(endpoints.auth.recoverPassword, data);
        return response.data;
    },
    logout: async () => {
        const response = await apiClient.post(endpoints.auth.logout);
        return response.data;
    },
    verifyEmailOtp: async (data) => {
        const response = await apiClient.post(endpoints.auth.verifyEmailOtp, data, {
            skipAuth: true,
        });
        return response.data;
    },
    verifyEmailToken: async (data) => {
        const response = await apiClient.post(endpoints.auth.verifyEmailToken, data, {
            skipAuth: true,
        });
        return response.data;
    },
    requestEmailVerificationOtp: async (data) => {
        const response = await apiClient.post(endpoints.auth.requestEmailVerificationOtp, data, {
            skipAuth: true,
        });
        return response.data;
    },
};
