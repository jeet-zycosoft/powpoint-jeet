import apiClient from './apiClient';
import { endpoints } from './endpoints';

export const publicService = {
    sitterList: async (data, config = {}) => {
        const response = await apiClient.post(endpoints.public.sitterList, data, config);
        return response.data;
    },
    sitterDetail: async (data) => {
        const id = typeof data === 'object' ? data?.sitter_id || data?.id : data;
        const response = await apiClient.get(`${endpoints.public.sitterDetail}?sitter_id=${id}`);
        return response.data;
    },
    alternativeSitterList: async (data) => {
        const id = typeof data === 'object' ? data?.sitter_id || data?.id : data;
        const response = await apiClient.get(
            `${endpoints.public.alternativeSitterList}?sitter_id=${id}`,
        );
        return response.data;
    },
    contactUs: async (data) => {
        const response = await apiClient.post(endpoints.public.contactUs, data);
        return response.data;
    },
    languages: async () => {
        const response = await apiClient.get(endpoints.public.languages);
        return response.data;
    },
    favoriteAdd: async (data) => {
        const response = await apiClient.post(endpoints.public.favoriteAdd, data);
        return response.data;
    },
    favoriteList: async (data) => {
        const response = await apiClient.get(endpoints.public.favoriteList, data);
        return response.data;
    },
    favoriteRemove: async (data) => {
        const id = typeof data === 'object' ? data?.sitter_id || data?.id : data;
        const response = await apiClient.delete(`${endpoints.public.favoriteRemove}/${id}`);
        return response.data;
    },
    profilePhotoDel: async (data) => {
        // const id = typeof data === 'object' ? data?.sitter_id || data?.id : data;
        // const response = await apiClient.delete(`${endpoints.public.profilePhotoDel}/${id}`);
        const response = await apiClient.delete(endpoints.public.profilePhotoDel);
        return response.data;
    },
    galleryPhotoDel: async (data) => {
        const id = typeof data === 'object' ? data?.sitter_id || data?.id : data;
        const response = await apiClient.delete(`${endpoints.public.galleryPhotoDel}/${id}`);
        return response.data;
    },
    faqs: async () => {
        const response = await apiClient.get(endpoints.public.faqs);
        return response.data;
    },
    siteSettings: async () => {
        const response = await apiClient.get(endpoints.public.siteSettings, { skipAuth: true });
        return response.data;
    },
    blogs: async (data) => {
        const params = typeof data === 'object' && data !== null ? { ...data } : {};
        if (!params.locale) params.locale = 'en';
        const response = await apiClient.get(endpoints.public.blogs, { params });
        return response.data;
    },
    blogDetail: async (data) => {
        const slug = typeof data === 'object' ? data?.slug || data?.id : data;
        const locale =
            typeof data === 'object' && data?.locale ? data.locale : 'en';
        const url = endpoints.public.blogDetail.includes(':slug')
            ? endpoints.public.blogDetail.replace(':slug', encodeURIComponent(slug))
            : `${endpoints.public.blogDetail}/${encodeURIComponent(slug)}`;
        const response = await apiClient.get(url, { params: { locale } });
        return response.data;
    },
    /** Alternate detail endpoint: GET /blog-detail?slug=&locale= */
    blogDetailByQuery: async (data) => {
        const slug = typeof data === 'object' ? data?.slug || data?.id : data;
        const locale =
            typeof data === 'object' && data?.locale ? data.locale : 'en';
        const response = await apiClient.get(endpoints.public.blogDetailQuery, {
            params: { slug, locale },
        });
        return response.data;
    },
    recentBlog: async (data) => {
        const id = typeof data === 'object' ? data?.id || data?.slug : data;
        const locale =
            typeof data === 'object' && data?.locale ? data.locale : 'en';
        const url =
            id && endpoints.public.recentBlog.includes(':id')
                ? endpoints.public.recentBlog.replace(':id', id)
                : id
                  ? `${endpoints.public.recentBlog}/${id}`
                  : endpoints.public.recentBlog.replace('/:id', '');
        const response = await apiClient.get(url, { params: { locale } });
        return response.data;
    },
    blogNewsletterSubscribe: async ({ email, locale = 'en' } = {}) => {
        const response = await apiClient.post(
            endpoints.public.blogNewsletterSubscribe,
            { email, locale },
            { skipAuth: true },
        );
        return response.data;
    },
};
