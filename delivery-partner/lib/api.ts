// API Base URL - change this to your server URL
export const API_BASE_URL = 'https://your-server-url.vercel.app/api';

// Helper function to make authenticated requests
export const authFetch = async (endpoint: string, options: RequestInit = {}) => {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const token = await AsyncStorage.getItem('partnerToken');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
    };

    if (token) {
        (headers as any)['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
    });
};
