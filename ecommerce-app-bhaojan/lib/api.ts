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

        // Get the response text first to handle non-JSON responses
        const responseText = await response.text();

        // Try to parse as JSON
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            // Response is not JSON (likely HTML error page from Vercel)
            console.error('Response is not valid JSON:', responseText.substring(0, 200));
            return {
                success: false,
                message: response.status === 500
                    ? 'Server error. Please try again later.'
                    : `Server returned an error (${response.status})`,
                response: null as any,
            };
        }

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

    // GET /auth/notification-settings - Get notification settings (Protected)
    getNotificationSettings: async () => {
        return apiRequest<{
            pushEnabled: boolean;
            orderUpdates: boolean;
            promotions: boolean;
        }>('/auth/notification-settings', {
            method: 'GET',
        });
    },

    // PUT /auth/notification-settings - Update notification settings (Protected)
    updateNotificationSettings: async (settings: {
        pushEnabled?: boolean;
        orderUpdates?: boolean;
        promotions?: boolean;
    }) => {
        return apiRequest<{
            pushEnabled: boolean;
            orderUpdates: boolean;
            promotions: boolean;
        }>('/auth/notification-settings', {
            method: 'PUT',
            body: JSON.stringify(settings),
        });
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
    getAll: async (params?: {
        category?: string;
        search?: string;
        limit?: number;
        page?: number;
        minPrice?: number;
        maxPrice?: number;
        minRating?: number;
        sort?: 'price_low_to_high' | 'price_high_to_low' | 'rating';
    }) => {
        const query = new URLSearchParams();
        if (params?.category) query.append('category', params.category);
        if (params?.search) query.append('search', params.search);
        if (params?.limit) query.append('limit', params.limit.toString());
        if (params?.page) query.append('page', params.page.toString());
        if (params?.minPrice) query.append('minPrice', params.minPrice.toString());
        if (params?.maxPrice) query.append('maxPrice', params.maxPrice.toString());
        if (params?.minRating) query.append('minRating', params.minRating.toString());
        if (params?.sort) query.append('sort', params.sort);

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

// Order Types
export interface OrderItem {
    product: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export interface Order {
    _id: string;
    orderNumber: string;
    user: string;
    items: OrderItem[];
    shippingAddress: {
        name: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    paymentMethod: string;
    subtotal: number;
    discount: number;
    shipping: number;
    tax: number;
    total: number;
    status: string;
    timeline: { status: string; date: string; completed: boolean }[];
    promoCode?: string;
    deliveredAt?: string;
    createdAt: string;
    updatedAt: string;
}

// Order Response with Transaction
export interface OrderWithTransaction {
    order: Order;
    transaction: Transaction;
}

// Orders API (All Protected)
export const ordersApi = {
    create: async (data: {
        items: { productId: string; quantity: number }[];
        shippingAddress: {
            name: string;
            phone: string;
            address: string;
            city: string;
            state: string;
            pincode: string;
        };
        paymentMethod: string;
        paymentDetails?: {
            upiId?: string;
            cardLast4?: string;
            walletName?: string;
        };
        promoCode?: string;
    }) => {
        return apiRequest<OrderWithTransaction>('/orders', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getAll: async () => {
        return apiRequest<{ count: number; data: Order[] }>('/orders');
    },

    getById: async (id: string) => {
        return apiRequest<Order & { transactions: Transaction[] }>(`/orders/${id}`);
    },

    cancel: async (id: string, reason?: string) => {
        return apiRequest<{ order: Order; refundTransaction: Transaction }>(`/orders/${id}/cancel`, {
            method: 'PUT',
            body: JSON.stringify({ reason }),
        });
    },

    getTransactions: async () => {
        return apiRequest<{ count: number; data: Transaction[] }>('/orders/transactions');
    },
};

// Transaction Types
export interface Transaction {
    _id: string;
    transactionId: string;
    user: string;
    order: {
        _id: string;
        orderNumber: string;
        items: OrderItem[];
        total: number;
        status: string;
    } | string;
    amount: number;
    paymentMethod: string;
    paymentDetails?: {
        upiId?: string;
        cardLast4?: string;
        walletName?: string;
    };
    status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
    type: 'payment' | 'refund';
    description: string;
    refundReason?: string;
    refundedAt?: string;
    createdAt: string;
    updatedAt: string;
}

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

// Banner Types
export interface Banner {
    _id: string;
    title: string;
    subtitle: string;
    image: string;
    badge: string;
    gradient: string[];
    linkType: 'category' | 'product' | 'search' | 'external';
    linkValue: string;
    isActive: boolean;
    order: number;
}

// Banners API (Public GET, Admin POST/PUT/DELETE)
export const bannersApi = {
    getAll: async () => {
        return apiRequest<{ count: number; data: Banner[] }>('/banners');
    },

    getById: async (id: string) => {
        return apiRequest<Banner>(`/banners/${id}`);
    },

    create: async (data: Partial<Banner>) => {
        return apiRequest<Banner>('/banners', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: Partial<Banner>) => {
        return apiRequest<Banner>(`/banners/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiRequest<{ id: string }>(`/banners/${id}`, {
            method: 'DELETE',
        });
    },
};

// Address Types
export interface Address {
    _id: string;
    user: string;
    type: 'Home' | 'Office' | 'Other';
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

// Addresses API (All Protected)
export const addressesApi = {
    getAll: async () => {
        return apiRequest<{ count: number; data: Address[] }>('/addresses');
    },

    getById: async (id: string) => {
        return apiRequest<Address>(`/addresses/${id}`);
    },

    create: async (data: {
        type: string;
        name: string;
        phone: string;
        address: string;
        city: string;
        state?: string;
        pincode: string;
        isDefault?: boolean;
    }) => {
        return apiRequest<Address>('/addresses', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (id: string, data: Partial<Address>) => {
        return apiRequest<Address>(`/addresses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    delete: async (id: string) => {
        return apiRequest<{ id: string }>(`/addresses/${id}`, {
            method: 'DELETE',
        });
    },

    setDefault: async (id: string) => {
        return apiRequest<Address>(`/addresses/${id}/default`, {
            method: 'PUT',
        });
    },
};

// Coupon Types
export interface Coupon {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    discountAmount: number;
    maxDiscount: number | null;
    minOrderValue: number;
    description: string;
}

// Coupons API
export const couponsApi = {
    validate: async (code: string, orderTotal: number) => {
        return apiRequest<Coupon>('/coupons/validate', {
            method: 'POST',
            body: JSON.stringify({ code, orderTotal }),
        });
    },

    getAll: async () => {
        return apiRequest<{ count: number; data: Coupon[] }>('/coupons');
    },
};

// Notification Types
export interface AppNotification {
    _id: string;
    user: string;
    title: string;
    message: string;
    type: 'order' | 'promo' | 'system' | 'booking';
    data?: {
        orderId?: string;
        orderNumber?: string;
        productId?: string;
        status?: string;
    };
    read: boolean;
    createdAt: string;
    updatedAt: string;
}

// Notifications API (All Protected)
export const notificationsApi = {
    getAll: async () => {
        return apiRequest<{ notifications: AppNotification[]; unreadCount: number }>('/notifications');
    },

    markAsRead: async (id: string) => {
        return apiRequest<AppNotification>(`/notifications/${id}/read`, {
            method: 'PUT',
        });
    },

    markAllAsRead: async () => {
        return apiRequest<{ message: string }>('/notifications/read-all', {
            method: 'PUT',
        });
    },

    delete: async (id: string) => {
        return apiRequest<{ message: string }>(`/notifications/${id}`, {
            method: 'DELETE',
        });
    },

    deleteAll: async () => {
        return apiRequest<{ message: string }>('/notifications/all', {
            method: 'DELETE',
        });
    },
};

// Review Types
export interface Review {
    id: string;
    userName: string;
    userAvatar: string;
    rating: number;
    comment: string;
    images?: string[];
    date: string;
    isVerifiedPurchase: boolean;
}

export interface ReviewsResponse {
    reviews: Review[];
    total: number;
    page: number;
    pages: number;
    ratingDistribution: {
        5: number;
        4: number;
        3: number;
        2: number;
        1: number;
    };
}

export interface ReviewableProduct {
    productId: string;
    name: string;
    image: string;
}

export interface CanReviewResponse {
    canReview: boolean;
    reason?: string;
    reviewableProducts: ReviewableProduct[];
    alreadyReviewed?: number;
}

// Reviews API
export const reviewsApi = {
    // Get reviews for a product (Public)
    getProductReviews: async (productId: string, page: number = 1, limit: number = 10) => {
        return apiRequest<ReviewsResponse>(`/reviews/product/${productId}?page=${page}&limit=${limit}`);
    },

    // Create a review (Protected)
    create: async (data: {
        productId: string;
        orderId: string;
        rating: number;
        comment?: string;
        images?: string[];
        deliveryRating?: number;
    }) => {
        return apiRequest<Review>('/reviews', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Get user's reviews (Protected)
    getMyReviews: async () => {
        return apiRequest<{ count: number; reviews: any[] }>('/reviews/my-reviews');
    },

    // Check if user can review products in an order (Protected)
    canReviewOrder: async (orderId: string) => {
        return apiRequest<CanReviewResponse>(`/reviews/can-review/${orderId}`);
    },

    // Delete a review (Protected)
    delete: async (id: string) => {
        return apiRequest<{ message: string }>(`/reviews/${id}`, {
            method: 'DELETE',
        });
    },
};

// Vendor Order Types
export interface VendorOrder {
    _id: string;
    orderNumber: string;
    user: {
        _id: string;
        name: string;
        phone: string;
        email: string;
    };
    items: OrderItem[];
    shippingAddress: {
        name: string;
        phone: string;
        address: string;
        city: string;
        state: string;
        pincode: string;
    };
    paymentMethod: string;
    status: string;
    vendorSubtotal: number;
    vendorItemsCount: number;
    createdAt: string;
    updatedAt: string;
}

// Vendor Analytics Types
export interface VendorAnalytics {
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    totalItemsSold: number;
    pendingOrders: number;
    deliveredOrders: number;
    cancelledOrders: number;
    topProducts: {
        productId: string;
        name: string;
        image: string;
        totalSold: number;
        revenue: number;
    }[];
    recentOrders: {
        _id: string;
        orderNumber: string;
        customerName: string;
        status: string;
        itemsCount: number;
        total: number;
        createdAt: string;
    }[];
    revenueByStatus: Record<string, { count: number; revenue: number }>;
    ordersByMonth: {
        month: string;
        orders: number;
        revenue: number;
    }[];
    wallet: {
        balance: number;
        pendingBalance: number;
        totalEarnings: number;
        totalWithdrawn: number;
        currency: string;
        currencySymbol: string;
    };
}

// Vendor API (All Protected)
export const vendorApi = {
    // Get vendor's own products
    getProducts: async (params?: { page?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());

        return apiRequest<{ count: number; total: number; data: Product[] }>(`/vendor/products?${query.toString()}`);
    },

    // Create a product
    createProduct: async (data: {
        title: string;
        description?: string;
        price: number;
        mrp?: number;
        category: string;
        image?: string;
        images?: string[];
        badge?: string;
        location?: string;
        fullLocation?: string;
        date?: string;
        time?: string;
        services?: string[];
    }) => {
        return apiRequest<Product>('/vendor/products', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Update a product
    updateProduct: async (id: string, data: Partial<Product>) => {
        return apiRequest<Product>(`/vendor/products/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    // Delete a product
    deleteProduct: async (id: string) => {
        return apiRequest<{ id: string }>(`/vendor/products/${id}`, {
            method: 'DELETE',
        });
    },

    // Get orders for vendor's products
    getOrders: async (params?: { status?: string; page?: number; limit?: number }) => {
        const query = new URLSearchParams();
        if (params?.status) query.append('status', params.status);
        if (params?.page) query.append('page', params.page.toString());
        if (params?.limit) query.append('limit', params.limit.toString());

        return apiRequest<{ count: number; total: number; data: VendorOrder[] }>(`/vendor/orders?${query.toString()}`);
    },

    // Update order status
    updateOrderStatus: async (orderId: string, status: string) => {
        return apiRequest<Order>(`/vendor/orders/${orderId}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    // Get vendor analytics
    getAnalytics: async () => {
        return apiRequest<VendorAnalytics>('/vendor/analytics');
    },

    // Request wallet withdrawal
    requestWithdrawal: async (data: { amount: number; upiId?: string; accountDetails?: string }) => {
        return apiRequest<{
            transaction: any;
            wallet: {
                balance: number;
                pendingBalance: number;
                totalEarnings: number;
                totalWithdrawn: number;
            };
        }>('/wallet/withdraw', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
