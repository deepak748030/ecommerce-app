import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Bhaojan Server
const API_BASE_URL = 'https://bhaojan-server.vercel.app/api';

// Token storage keys
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'auth_user';

// Types
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    request?: any;
    response?: T;
}

export interface AuthUser {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar: string;
    isBlocked: boolean;
    memberSince: string;
}

export interface LoginResponse {
    token: string;
    user: AuthUser;
}

// Get stored token
export const getToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(TOKEN_KEY);
    } catch {
        return null;
    }
};

// Store token
export const setToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (error) {
        console.error('Error storing token:', error);
    }
};

// Remove token
export const removeToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (error) {
        console.error('Error removing token:', error);
    }
};

// Get stored user
export const getStoredUser = async (): Promise<AuthUser | null> => {
    try {
        const user = await AsyncStorage.getItem(USER_KEY);
        return user ? JSON.parse(user) : null;
    } catch {
        return null;
    }
};

// Store user
export const setStoredUser = async (user: AuthUser): Promise<void> => {
    try {
        await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error) {
        console.error('Error storing user:', error);
    }
};

// Remove user
export const removeStoredUser = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(USER_KEY);
    } catch (error) {
        console.error('Error removing user:', error);
    }
};

// API Request helper
const apiRequest = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    try {
        const token = await getToken();

        console.log(`API Request: ${options.method || 'GET'} ${endpoint}`);

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...options.headers,
        };

        if (token) {
            (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        const data = await response.json();
        console.log(`API Response: ${response.status} - ${data.success ? 'Success' : data.message}`);

        if (!response.ok) {
            return {
                success: false,
                message: data.message || 'Something went wrong',
                request: data.request,
                response: null as any,
            };
        }

        return data;
    } catch (error) {
        console.error('API Request error:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Network error. Please check your connection.',
            response: null as any,
        };
    }
};

// Auth API calls - Only routes available on the server
export const authApi = {
    // POST /auth/login - Login existing user
    login: async (phone: string) => {
        return apiRequest<{ phone: string; isNewUser: boolean; isBlocked: boolean }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    },

    // POST /auth/verify-otp - Verify OTP
    verifyOtp: async (phone: string, otp: string, expoPushToken?: string) => {
        const result = await apiRequest<LoginResponse>('/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, otp, expoPushToken }),
        });

        // Store token and user on successful verification
        if (result.success && result.response) {
            await setToken(result.response.token);
            await setStoredUser(result.response.user);
        }

        return result;
    },

    // POST /auth/resend-otp - Resend OTP
    resendOtp: async (phone: string) => {
        return apiRequest<{ phone: string; otpSent: boolean }>('/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    },

    // POST /auth/register - Register new user
    register: async (data: { name: string; email: string; phone: string; avatar?: string }) => {
        return apiRequest<{ phone: string; isNewUser: boolean }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // GET /auth/me - Get current user profile (Protected)
    getMe: async () => {
        return apiRequest<AuthUser>('/auth/me', {
            method: 'GET',
        });
    },

    // PUT /auth/profile - Update profile (Protected)
    updateProfile: async (data: { name?: string; email?: string; avatar?: string }) => {
        const result = await apiRequest<AuthUser>('/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        // Update stored user on success
        if (result.success && result.response) {
            await setStoredUser(result.response);
        }

        return result;
    },

    // PUT /auth/push-token - Update push token (Protected)
    updatePushToken: async (expoPushToken: string) => {
        return apiRequest<{ tokenUpdated: boolean; isBlocked: boolean }>('/auth/push-token', {
            method: 'PUT',
            body: JSON.stringify({ expoPushToken }),
        });
    },

    // POST /auth/logout - Logout (Protected)
    logout: async () => {
        const result = await apiRequest<{ loggedOut: boolean }>('/auth/logout', {
            method: 'POST',
        });

        // Clear stored data
        await removeToken();
        await removeStoredUser();

        return result;
    },
};

// Product Types
export interface Product {
    _id: string;
    title: string;
    description: string;
    price: number;
    mrp: number;
    category: { _id: string; name: string; color: string } | string;
    image: string;
    images: string[];
    badge: string;
    location: string;
    fullLocation: string;
    rating: number;
    reviews: number;
    date: string;
    time: string;
    services: string[];
    isActive: boolean;
}

export interface Category {
    _id: string;
    name: string;
    image: string;
    color: string;
    itemsCount: number;
    isActive: boolean;
}

// Products API (Public GET, Admin POST/PUT/DELETE)
export const productsApi = {
    getAll: async (params?: { category?: string; search?: string; limit?: number; page?: number }) => {
        const query = new URLSearchParams();
        if (params?.category) query.append('category', params.category);
        if (params?.search) query.append('search', params.search);
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.page) query.append('page', params.page.toString());

        return apiRequest<{ count: number; total: number; data: Product[] }>(`/products?${query.toString()}`);
    },

    getById: async (id: string) => {
        return apiRequest<Product>(`/products/${id}`);
    },

    getByCategory: async (categoryId: string, params?: { limit?: number; page?: number }) => {
        const query = new URLSearchParams();
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.page) query.append('page', params.page.toString());

        return apiRequest<{ count: number; total: number; data: Product[] }>(`/products/category/${categoryId}?${query.toString()}`);
    },

    create: async (data: Partial<Product>) => {
        return apiRequest<Product>('/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: Partial<Product>) => {
        return apiRequest<Product>(`/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiRequest<{ id: string }>(`/products/${id}`, {
            method: 'DELETE',
        });
    },
};

// Categories API (Public GET, Admin POST/PUT/DELETE)
export const categoriesApi = {
    getAll: async () => {
        return apiRequest<{ count: number; data: Category[] }>('/categories');
    },

    getById: async (id: string) => {
        return apiRequest<Category>(`/categories/${id}`);
    },

    create: async (data: Partial<Category>) => {
        return apiRequest<Category>('/categories', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: Partial<Category>) => {
        return apiRequest<Category>(`/categories/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiRequest<{ id: string }>(`/categories/${id}`, {
            method: 'DELETE',
        });
    },
};

// Seed API (Public - no token required)
export const seedApi = {
    seedAll: async () => {
        return apiRequest<{ users: number; categories: number; products: number }>('/seed/all');
    },
    seedCategories: async () => {
        return apiRequest<{ count: number; data: Category[] }>('/seed/categories');
    },
    seedProducts: async () => {
        return apiRequest<{ count: number; data: Product[] }>('/seed/products');
    },
    seedUsers: async () => {
        return apiRequest<{ count: number; data: any[] }>('/seed/users');
    },
};

// Helper to get image URL - supports base64, URLs, and relative paths
export const getImageUrl = (image: string | undefined | null): string => {
    if (!image) {
        return 'https://via.placeholder.com/300x200?text=No+Image';
    }

    // If it's already a base64 string, return as-is
    if (image.startsWith('data:image')) {
        return image;
    }

    // If it's a full URL, return as-is
    if (image.startsWith('http://') || image.startsWith('https://')) {
        return image;
    }

    // Otherwise treat as relative path (placeholder for now)
    return image;
};
