import apiClient from './apiClient';
import { endpoints } from './endpoints';

const formService = {
    /**
     * Submit the base form data including file uploads
     * @param {FormData} formData - The form data containing user inputs and files
     * @returns {Promise} - Axios response promise
     */
    submitBaseForm: async (formData) => {
        return apiClient.post(endpoints.form.baseForm, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
};

export default formService;
