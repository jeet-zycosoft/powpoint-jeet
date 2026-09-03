import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const chatService = {
    canChat: async (data) => {
        const response = await apiClient.post(endpoints.chat.canChat, data);
        return response.data;
    },
    start: async (data) => {
        const response = await apiClient.post(endpoints.chat.start, data);
        return response.data;
    },
    acceptConversation: async (data) => {
        const response = await apiClient.post(endpoints.chat.acceptConversation, data);
        return response.data;
    },
    declineConversation: async (data) => {
        const response = await apiClient.post(endpoints.chat.declineConversation, data);
        return response.data;
    },
    sendMessage: async (data) => {
        const response = await apiClient.post(endpoints.chat.sendMessage, data);
        return response.data;
    },
    messages: async (data) => {
        const response = await apiClient.post(endpoints.chat.messages, data);
        return response.data;
    },
    conversations: async () => {
        const response = await apiClient.get(endpoints.chat.conversations);
        return response.data;
    },
};
