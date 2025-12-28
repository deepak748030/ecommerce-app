import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Same as main app server
export const API_BASE_URL = 'https://bhaojan-server.vercel.app/api';

// Token storage keys
const PARTNER_TOKEN_KEY = 'partnerToken';
const PARTNER_DATA_KEY = 'partnerData';

// Types
export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    response?: T;
}

export interface PartnerData {
    id: string;
    name: string;
    phone: string;
    avatar?: string;
    vehicle?: {
        type: string;
        number: string;
        model?: string;
        color?: string;
    };
    vehicleType?: string;
    vehicleNumber?: string;
    documents?: {
        aadhaar: boolean;
        pan: boolean;
        license: boolean;
        selfie: boolean;
    };
    kycStatus?: 'pending' | 'submitted' | 'approved' | 'rejected';
    kycRejectionReason?: string;
    isProfileComplete: boolean;
    isVerified: boolean;
    isBlocked: boolean;
    isOnline?: boolean;
    stats?: {
        totalDeliveries: number;
        rating: number;
        todayDeliveries: number;
    };
    earnings?: {
        today: number;
        week: number;
        month: number;
        total: number;
    };
    memberSince?: string;
}

// Get stored token
export const getPartnerToken = async (): Promise<string | null> => {
    try {
        return await AsyncStorage.getItem(PARTNER_TOKEN_KEY);
    } catch {
        return null;
    }
};

// Store token
export const setPartnerToken = async (token: string): Promise<void> => {
    try {
        await AsyncStorage.setItem(PARTNER_TOKEN_KEY, token);
    } catch (error) {
        console.error('Error storing partner token:', error);
    }
};

// Remove token
export const removePartnerToken = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(PARTNER_TOKEN_KEY);
    } catch (error) {
        console.error('Error removing partner token:', error);
    }
};

// Get stored partner data
export const getPartnerData = async (): Promise<PartnerData | null> => {
    try {
        const data = await AsyncStorage.getItem(PARTNER_DATA_KEY);
        return data ? JSON.parse(data) : null;
    } catch {
        return null;
    }
};

// Store partner data
export const setPartnerData = async (data: PartnerData): Promise<void> => {
    try {
        await AsyncStorage.setItem(PARTNER_DATA_KEY, JSON.stringify(data));
    } catch (error) {
        console.error('Error storing partner data:', error);
    }
};

// Remove partner data
export const removePartnerData = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(PARTNER_DATA_KEY);
    } catch (error) {
        console.error('Error removing partner data:', error);
    }
};

// Clear all partner related data from storage
export const clearAllPartnerData = async (): Promise<void> => {
    try {
        await AsyncStorage.multiRemove([PARTNER_TOKEN_KEY, PARTNER_DATA_KEY]);
        // Also clear any other app-specific keys
        const allKeys = await AsyncStorage.getAllKeys();
        const partnerKeys = allKeys.filter(key =>
            key.startsWith('partner') ||
            key.startsWith('delivery') ||
            key.startsWith('theme')
        );
        if (partnerKeys.length > 0) {
            await AsyncStorage.multiRemove(partnerKeys);
        }
    } catch (error) {
        console.error('Error clearing all partner data:', error);
    }
};

// Check if partner is logged in
export const isPartnerLoggedIn = async (): Promise<boolean> => {
    try {
        const token = await getPartnerToken();
        return !!token;
    } catch {
        return false;
    }
};

// Session expired callback - will be set by the app
let onSessionExpired: (() => void) | null = null;

export const setSessionExpiredCallback = (callback: () => void) => {
    onSessionExpired = callback;
};

// Handle 401 - session expired
const handleSessionExpired = async () => {
    await clearAllPartnerData();
    if (onSessionExpired) {
        onSessionExpired();
    }
};

// API Request helper with authentication
export const authFetch = async <T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<ApiResponse<T>> => {
    try {
        const token = await getPartnerToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        if (token) {
            (headers as any)['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
        });

        // Handle 401 - session expired
        if (response.status === 401) {
            await handleSessionExpired();
            return {
                success: false,
                message: 'Session expired. Please login again.',
                response: null as any,
            };
        }

        const responseText = await response.text();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Response is not valid JSON:', responseText.substring(0, 200));
            return {
                success: false,
                message: response.status === 500
                    ? 'Server error. Please try again later.'
                    : `Server returned an error (${response.status})`,
                response: null as any,
            };
        }

        if (!response.ok) {
            return {
                success: false,
                message: data.message || 'Something went wrong',
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

// Delivery Partner Auth API
export const deliveryPartnerAuthApi = {
    // Send OTP for login/signup
    login: async (phone: string) => {
        return authFetch<{
            phone: string;
            isNewUser: boolean;
            isProfileComplete: boolean;
            isBlocked: boolean;
        }>('/delivery-partner/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    },

    // Verify OTP
    verifyOtp: async (phone: string, otp: string, expoPushToken?: string) => {
        const result = await authFetch<{
            token: string;
            partner: PartnerData;
            isNewUser: boolean;
        }>('/delivery-partner/auth/verify-otp', {
            method: 'POST',
            body: JSON.stringify({ phone, otp, expoPushToken }),
        });

        if (result.success && result.response) {
            await setPartnerToken(result.response.token);
            await setPartnerData(result.response.partner);
        }

        return result;
    },

    // Resend OTP
    resendOtp: async (phone: string) => {
        return authFetch<{ phone: string; otpSent: boolean }>('/delivery-partner/auth/resend-otp', {
            method: 'POST',
            body: JSON.stringify({ phone }),
        });
    },

    // Complete profile with vehicle details and KYC documents
    completeProfile: async (data: {
        partnerId: string;
        name: string;
        vehicleType: string;
        vehicleNumber: string;
        vehicleModel?: string;
        vehicleColor?: string;
        aadhaarImage?: string;
        panImage?: string;
        licenseImage?: string;
        selfieImage?: string;
    }) => {
        const result = await authFetch<{ partner: PartnerData }>('/delivery-partner/auth/complete-profile', {
            method: 'POST',
            body: JSON.stringify(data),
        });

        if (result.success && result.response) {
            await setPartnerData(result.response.partner);
        }

        return result;
    },

    // Get current partner profile
    getMe: async () => {
        const result = await authFetch<PartnerData>('/delivery-partner/auth/me', {
            method: 'GET',
        });

        // Save fresh data to local storage
        if (result.success && result.response) {
            await setPartnerData(result.response);
        }

        return result;
    },

    // Update profile
    updateProfile: async (data: {
        name?: string;
        avatar?: string;
        vehicleType?: string;
        vehicleNumber?: string;
        vehicleModel?: string;
        vehicleColor?: string;
    }) => {
        const result = await authFetch<PartnerData>('/delivery-partner/auth/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });

        // Save updated data to local storage
        if (result.success && result.response) {
            await setPartnerData(result.response);
        }

        return result;
    },

    // Toggle online status
    toggleOnline: async (setOnline?: boolean) => {
        const result = await authFetch<{ isOnline: boolean }>('/delivery-partner/auth/toggle-online', {
            method: 'PUT',
            body: JSON.stringify(typeof setOnline === 'boolean' ? { isOnline: setOnline } : {}),
        });

        // Update local storage with new online status
        if (result.success && result.response) {
            const currentData = await getPartnerData();
            if (currentData) {
                await setPartnerData({ ...currentData, isOnline: result.response.isOnline });
            }
        }

        return result;
    },

    // Logout
    logout: async () => {
        const result = await authFetch<{ loggedOut: boolean }>('/delivery-partner/auth/logout', {
            method: 'POST',
        });

        // Clear all stored data
        await clearAllPartnerData();

        return result;
    },
};

// Delivery Order interface
export interface DeliveryOrderItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
}

export interface DeliveryOrder {
    id: string;
    orderId: string;
    status: string;
    pickupAddress: string;
    deliveryAddress: string;
    customerName: string;
    customerPhone?: string | null;
    vendorPhone?: string | null;
    amount: number;
    tip: number;
    distance: string;
    estimatedTime: string;
    items: DeliveryOrderItem[] | number;
    itemCount?: number;
    paymentMethod?: string;
    subtotal?: number;
    total?: number;
    createdAt: string;
    deliveredAt?: string;
    isAcceptedByMe?: boolean;
    // Vendor-set delivery details
    deliveryPayment?: number;
    deliveryTimeMinutes?: number;
}

// Paginated response interface
export interface PaginatedOrdersResponse {
    count: number;
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
    data: DeliveryOrder[];
}

// Delivery Partner Orders API
export const deliveryOrdersApi = {
    // Get available orders (pending)
    getAvailableOrders: async (page: number = 1, limit: number = 10) => {
        return authFetch<PaginatedOrdersResponse>(`/delivery-partner/orders/available?page=${page}&limit=${limit}`, {
            method: 'GET',
        });
    },

    // Get active orders
    getActiveOrders: async (page: number = 1, limit: number = 10) => {
        return authFetch<PaginatedOrdersResponse>(`/delivery-partner/orders/active?page=${page}&limit=${limit}`, {
            method: 'GET',
        });
    },

    // Get order by ID
    getOrderById: async (orderId: string) => {
        return authFetch<DeliveryOrder>(`/delivery-partner/orders/${orderId}`, {
            method: 'GET',
        });
    },

    // Get order history (completed)
    getOrderHistory: async (page: number = 1, limit: number = 10) => {
        return authFetch<PaginatedOrdersResponse>(`/delivery-partner/orders/history?page=${page}&limit=${limit}`, {
            method: 'GET',
        });
    },

    // Accept an order
    acceptOrder: async (orderId: string) => {
        return authFetch<{ orderId: string; orderNumber: string; status: string }>(`/delivery-partner/orders/${orderId}/accept`, {
            method: 'POST',
        });
    },

    // Initiate pickup - sends OTP to vendor
    initiatePickup: async (orderId: string) => {
        return authFetch<{ orderId: string; orderNumber: string; otpSent: boolean }>(`/delivery-partner/orders/${orderId}/initiate-pickup`, {
            method: 'POST',
        });
    },

    // Verify pickup OTP
    verifyPickupOtp: async (orderId: string, otp: string) => {
        return authFetch<{ orderId: string; orderNumber: string; status: string }>(`/delivery-partner/orders/${orderId}/verify-pickup`, {
            method: 'POST',
            body: JSON.stringify({ otp }),
        });
    },

    // Initiate delivery - sends OTP to customer
    initiateDelivery: async (orderId: string) => {
        return authFetch<{ orderId: string; orderNumber: string; otpSent: boolean }>(`/delivery-partner/orders/${orderId}/initiate-delivery`, {
            method: 'POST',
        });
    },

    // Verify delivery OTP
    verifyDeliveryOtp: async (orderId: string, otp: string) => {
        return authFetch<{ orderId: string; orderNumber: string; status: string }>(`/delivery-partner/orders/${orderId}/verify-delivery`, {
            method: 'POST',
            body: JSON.stringify({ otp }),
        });
    },
};

// Earnings interfaces
export interface EarningsSummary {
    today: number;
    thisWeek: number;
    thisMonth: number;
    total: number;
    todayDeliveries: number;
    totalDeliveries: number;
    totalTips: number;
    avgRating: number;
}

export interface EarningsHistoryItem {
    date: string;
    rawDate: string;
    amount: number;
    tips: number;
    deliveries: number;
}

export interface PaginatedEarningsHistoryResponse {
    count: number;
    total: number;
    page: number;
    totalPages: number;
    hasMore: boolean;
    data: EarningsHistoryItem[];
}

// Earnings API
export const earningsApi = {
    // Get earnings summary
    getEarnings: async () => {
        return authFetch<EarningsSummary>('/delivery-partner/earnings', {
            method: 'GET',
        });
    },

    // Get earnings history with pagination
    getEarningsHistory: async (page: number = 1, limit: number = 10) => {
        return authFetch<PaginatedEarningsHistoryResponse>(`/delivery-partner/earnings/history?page=${page}&limit=${limit}`, {
            method: 'GET',
        });
    },
};

// Wallet Balance Response
export interface WalletBalance {
    balance: number;
    pendingBalance: number;
    totalEarnings: number;
    totalWithdrawn: number;
    currency: string;
    currencySymbol: string;
}

// Withdrawal Request Types
export interface WithdrawalRequest {
    _id: string;
    requestId: string;
    requesterType: 'vendor' | 'delivery_partner';
    amount: number;
    paymentMethod: 'upi' | 'bank_transfer' | 'paytm' | 'phonepe' | 'googlepay';
    paymentDetails: {
        upiId?: string;
        accountHolderName?: string;
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
        mobileNumber?: string;
    };
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    adminNotes?: string;
    rejectionReason?: string;
    transactionReference?: string;
    balanceBefore: number;
    balanceAfter?: number;
    createdAt: string;
    updatedAt: string;
    processedAt?: string;
}

export interface WithdrawalHistoryResponse {
    count: number;
    total: number;
    page: number;
    pages: number;
    data: WithdrawalRequest[];
}

// Wallet Transaction interface
export interface WalletTransaction {
    _id: string;
    transactionId: string;
    type: 'credit' | 'withdrawal';
    amount: number;
    tip?: number;
    description: string;
    status: 'pending' | 'processing' | 'completed' | 'rejected';
    orderNumber?: string;
    createdAt: string;
    processedAt?: string;
}

export interface WalletTransactionsResponse {
    count: number;
    total: number;
    page: number;
    pages: number;
    hasMore: boolean;
    data: WalletTransaction[];
}

// Wallet API
export const walletApi = {
    // Get wallet balance
    getWalletBalance: async () => {
        return authFetch<WalletBalance>('/delivery-partner/wallet/balance', {
            method: 'GET',
        });
    },

    // Get wallet transactions with pagination
    getWalletTransactions: async (page: number = 1, limit: number = 20) => {
        return authFetch<WalletTransactionsResponse>(`/delivery-partner/wallet/transactions?page=${page}&limit=${limit}`, {
            method: 'GET',
        });
    },

    // Request withdrawal
    requestWithdrawal: async (data: {
        amount: number;
        paymentMethod: 'upi' | 'bank_transfer' | 'paytm' | 'phonepe' | 'googlepay';
        upiId?: string;
        accountHolderName?: string;
        accountNumber?: string;
        ifscCode?: string;
        bankName?: string;
        mobileNumber?: string;
    }) => {
        return authFetch<{
            request: WithdrawalRequest;
            wallet: WalletBalance;
        }>('/delivery-partner/wallet/withdraw', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    // Get withdrawal history
    getWithdrawalHistory: async (page: number = 1, limit: number = 20) => {
        return authFetch<WithdrawalHistoryResponse>(`/delivery-partner/wallet/withdrawals?page=${page}&limit=${limit}`, {
            method: 'GET',
        });
    },
};
