// File: src/lib/api.ts
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_user')
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export interface Admin {
    _id: string
    name: string
    email: string
    avatar: string
    role: string
}

export interface User {
    _id: string
    name: string
    email: string
    phone: string
    avatar: string
    isBlocked: boolean
    memberSince: string
    createdAt: string
}

export interface VendorKYC {
    name?: string
    phone?: string
    email?: string
    aadhaarFrontImage?: string
    aadhaarBackImage?: string
    panCardImage?: string
    bankAccountHolderName?: string
    bankAccountNumber?: string
    bankName?: string
    ifscCode?: string
    ownerLivePhoto?: string
    verificationStatus?: 'pending' | 'verified' | 'rejected'
    rejectionReason?: string
    submittedAt?: string
    verifiedAt?: string
}

export interface Vendor {
    _id: string
    name: string
    email: string
    phone: string
    avatar: string
    businessName: string
    category: string
    rating: number
    reviewCount: number
    isVerified: boolean
    isBlocked: boolean
    kycStatus: 'not_submitted' | 'pending' | 'verified' | 'rejected'
    isActive: boolean
    createdAt: string
    description?: string
    experienceYears?: number
    address?: {
        street?: string
        city?: string
        state?: string
        pincode?: string
    }
    kyc?: VendorKYC
    bankDetails?: {
        accountHolderName?: string
        accountNumber?: string
        bankName?: string
        ifscCode?: string
        upiId?: string
    }
}

export interface VendorDetailResponse {
    success: boolean
    response: {
        vendor: Vendor
    }
}

export interface Pagination {
    page: number
    limit: number
    total: number
    pages: number
}

export interface DashboardStats {
    totalUsers: number
    activeUsers: number
    blockedUsers: number
    totalVendors: number
    activeVendors: number
    blockedVendors: number
    pendingKYC: number
    verifiedVendors: number
    recentUsers: number
    recentVendors: number
}

export interface ChartDataPoint {
    name: string
    users?: number
    vendors?: number
    revenue?: number
    bookings?: number
}

export interface PieChartDataPoint {
    name: string
    value: number
    color: string
}

export interface DashboardAnalytics {
    overview: {
        totalUsers: number
        activeUsers: number
        blockedUsers: number
        totalVendors: number
        activeVendors: number
        blockedVendors: number
        pendingKYC: number
        verifiedVendors: number
        totalBookings: number
        pendingBookings: number
        confirmedBookings: number
        completedBookings: number
        cancelledBookings: number
        totalRevenue: number
        totalEvents: number
        activeEvents: number
        featuredEvents: number
        inactiveEvents: number
    }
    periodStats: {
        users: number
        vendors: number
        bookings: number
        events: number
        revenue: number
        filter: string
    }
    charts: {
        userGrowth: ChartDataPoint[]
        bookingStatusDistribution: PieChartDataPoint[]
        vendorKycDistribution: PieChartDataPoint[]
        revenueTrend: ChartDataPoint[]
        bookingsTrend: ChartDataPoint[]
        eventsTrend: ChartDataPoint[]
    }
}

export interface Category {
    _id: string
    name: string
    slug: string
    description?: string
    isActive: boolean
    order: number
    createdAt: string
    updatedAt: string
}

export interface Banner {
    _id: string
    title: string
    image: string
    publicId?: string
    badge?: string
    type: 'event' | 'category'
    eventId?: string
    categorySlug?: string
    isActive: boolean
    order: number
    createdAt: string
    updatedAt: string
}

export interface Event {
    _id: string
    title: string
    description?: string
    category?: string
    image?: string
    images?: string[]
    date?: string
    time?: string
    location: string
    fullLocation?: string
    price: number
    mrp?: number
    badge?: string
    services?: string[]
    capacity?: number
    bookedCount?: number
    rating?: number
    reviews?: number
    isFeatured?: boolean
    isActive: boolean
    createdAt?: string
    updatedAt?: string
    vendor?: {
        _id: string
        name: string
        businessName?: string
        avatar?: string
        email?: string
        phone?: string
    }
}

// Auth APIs
export const adminLogin = async (email: string, password: string) => {
    const response = await api.post('/admin/login', { email, password })
    return response.data
}

export const getAdminProfile = async () => {
    const response = await api.get('/admin/me')
    return response.data
}

export const setupAdmin = async () => {
    const response = await api.post('/admin/setup')
    return response.data
}

// User APIs
export const getUsers = async (params: {
    page?: number
    limit?: number
    search?: string
    status?: string
}) => {
    const response = await api.get('/admin/users', { params })
    return response.data
}

export const getUserById = async (id: string) => {
    const response = await api.get(`/admin/users/${id}`)
    return response.data
}

export const toggleUserBlock = async (id: string, reason?: string) => {
    const response = await api.put(`/admin/users/${id}/block`, { reason })
    return response.data
}

// Vendor APIs
export const getVendors = async (params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    kycStatus?: string
}) => {
    const response = await api.get('/admin/vendors', { params })
    return response.data
}

export const getVendorById = async (id: string): Promise<VendorDetailResponse> => {
    const response = await api.get(`/admin/vendors/${id}`)
    return response.data
}

export const toggleVendorBlock = async (id: string, reason?: string) => {
    const response = await api.put(`/admin/vendors/${id}/block`, { reason })
    return response.data
}

export const updateVendorKYC = async (id: string, status: 'verified' | 'rejected', rejectionReason?: string) => {
    const response = await api.put(`/admin/vendors/${id}/kyc`, { status, rejectionReason })
    return response.data
}

// Category APIs
export const getCategoriesAdmin = async (params: {
    page?: number
    limit?: number
    search?: string
    status?: string
}) => {
    const response = await api.get('/admin/categories', { params })
    return response.data
}

export const getCategoryByIdAdmin = async (id: string) => {
    const response = await api.get(`/admin/categories/${id}`)
    return response.data
}

export const createCategory = async (data: {
    name: string
    slug: string
    description?: string
    isActive?: boolean
    order?: number
}) => {
    const response = await api.post('/admin/categories', data)
    return response.data
}

export const updateCategory = async (id: string, data: {
    name?: string
    slug?: string
    description?: string
    isActive?: boolean
    order?: number
}) => {
    const response = await api.put(`/admin/categories/${id}`, data)
    return response.data
}

export const deleteCategory = async (id: string) => {
    const response = await api.delete(`/admin/categories/${id}`)
    return response.data
}

// Banner APIs
export const getBannersAdmin = async (params: {
    page?: number
    limit?: number
    search?: string
    status?: string
}) => {
    const response = await api.get('/admin/banners', { params })
    return response.data
}

export const getBannerByIdAdmin = async (id: string) => {
    const response = await api.get(`/admin/banners/${id}`)
    return response.data
}

export const createBanner = async (data: FormData) => {
    const response = await api.post('/admin/banners', data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
    return response.data
}

export const updateBanner = async (id: string, data: FormData) => {
    const response = await api.put(`/admin/banners/${id}`, data, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
    return response.data
}

export const deleteBanner = async (id: string) => {
    const response = await api.delete(`/admin/banners/${id}`)
    return response.data
}

// Events APIs (for banner selection)
export const getEventsAdmin = async (params: {
    page?: number
    limit?: number
    search?: string
    status?: string
    category?: string
    featured?: string
    sortBy?: string
    sortOrder?: string
}) => {
    const response = await api.get('/admin/events', { params })
    return response.data
}

export const getEventByIdAdmin = async (id: string) => {
    const response = await api.get(`/admin/events/${id}`)
    return response.data
}

export const updateEventAdmin = async (id: string, data: Partial<Event>) => {
    const response = await api.put(`/admin/events/${id}`, data)
    return response.data
}

export const toggleEventStatusAdmin = async (id: string) => {
    const response = await api.patch(`/admin/events/${id}/toggle-status`)
    return response.data
}

export const toggleEventFeaturedAdmin = async (id: string) => {
    const response = await api.patch(`/admin/events/${id}/toggle-featured`)
    return response.data
}

export const deleteEventAdmin = async (id: string) => {
    const response = await api.delete(`/admin/events/${id}`)
    return response.data
}

// Stats APIs
export const getDashboardStats = async () => {
    const response = await api.get('/admin/stats')
    return response.data
}

export const getDashboardAnalytics = async (filter: 'today' | 'weekly' | 'monthly' | 'yearly' = 'monthly') => {
    const response = await api.get('/admin/analytics', { params: { filter } })
    return response.data as { success: boolean; response: DashboardAnalytics }
}

export default api