// Mock Data for SwiftDrop Partner App

export interface Delivery {
    id: string;
    orderId: string;
    customerName: string;
    customerPhone: string;
    pickupAddress: string;
    deliveryAddress: string;
    distance: string;
    estimatedTime: string;
    amount: number;
    tip: number;
    status: 'pending' | 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'cancelled';
    items: string[];
    createdAt: Date;
    pickupTime?: Date;
    deliveryTime?: Date;
}

export interface EarningsData {
    today: number;
    thisWeek: number;
    thisMonth: number;
    totalDeliveries: number;
    totalTips: number;
    avgRating: number;
}

export interface Partner {
    id: string;
    name: string;
    phone: string;
    email: string;
    avatar?: string;
    vehicleType: 'bike' | 'scooter' | 'car';
    vehicleNumber: string;
    isOnline: boolean;
    rating: number;
    totalDeliveries: number;
    joinedAt: Date;
}

// Mock Partner Profile
export const mockPartner: Partner = {
    id: 'p1',
    name: 'Rahul Sharma',
    phone: '+91 98765 43210',
    email: 'rahul.partner@swiftdrop.com',
    vehicleType: 'bike',
    vehicleNumber: 'MH 02 AB 1234',
    isOnline: true,
    rating: 4.8,
    totalDeliveries: 156,
    joinedAt: new Date('2024-06-15'),
};

// Mock Active Deliveries
export const mockActiveDeliveries: Delivery[] = [
    {
        id: 'd1',
        orderId: 'ORD-2024-001',
        customerName: 'Priya Patel',
        customerPhone: '+91 98765 11111',
        pickupAddress: 'Fresh Mart, Sector 15, Noida',
        deliveryAddress: '42, Green Valley Apartments, Sector 18, Noida',
        distance: '3.2 km',
        estimatedTime: '15 mins',
        amount: 45,
        tip: 10,
        status: 'accepted',
        items: ['Milk 1L', 'Bread', 'Eggs (6 pcs)'],
        createdAt: new Date(),
    },
    {
        id: 'd2',
        orderId: 'ORD-2024-002',
        customerName: 'Amit Kumar',
        customerPhone: '+91 98765 22222',
        pickupAddress: 'Spice Garden Restaurant, Sector 21',
        deliveryAddress: '78, Sunshine Complex, Sector 22, Noida',
        distance: '2.1 km',
        estimatedTime: '10 mins',
        amount: 35,
        tip: 0,
        status: 'pending',
        items: ['Chicken Biryani', 'Raita', 'Gulab Jamun'],
        createdAt: new Date(),
    },
];

// Mock Pending Deliveries (Available for pickup)
export const mockPendingDeliveries: Delivery[] = [
    {
        id: 'd3',
        orderId: 'ORD-2024-003',
        customerName: 'Sneha Roy',
        customerPhone: '+91 98765 33333',
        pickupAddress: 'QuickMeds Pharmacy, Sector 12',
        deliveryAddress: '15, Silver Oak, Sector 14, Noida',
        distance: '1.8 km',
        estimatedTime: '8 mins',
        amount: 30,
        tip: 5,
        status: 'pending',
        items: ['Medicines (Prescription)'],
        createdAt: new Date(),
    },
    {
        id: 'd4',
        orderId: 'ORD-2024-004',
        customerName: 'Vikram Singh',
        customerPhone: '+91 98765 44444',
        pickupAddress: 'BookWorm Store, Sector 18',
        deliveryAddress: '99, Palm Residency, Sector 19, Noida',
        distance: '2.5 km',
        estimatedTime: '12 mins',
        amount: 40,
        tip: 15,
        status: 'pending',
        items: ['Books (3)', 'Notebook Set'],
        createdAt: new Date(),
    },
];

// Mock Completed Deliveries
export const mockCompletedDeliveries: Delivery[] = [
    {
        id: 'd5',
        orderId: 'ORD-2024-005',
        customerName: 'Neha Gupta',
        customerPhone: '+91 98765 55555',
        pickupAddress: 'Pizza Palace, Sector 16',
        deliveryAddress: '33, Crystal Tower, Sector 17, Noida',
        distance: '1.5 km',
        estimatedTime: '7 mins',
        amount: 35,
        tip: 20,
        status: 'delivered',
        items: ['Large Pizza', 'Garlic Bread', 'Coke 500ml'],
        createdAt: new Date(Date.now() - 3600000),
        deliveryTime: new Date(Date.now() - 3000000),
    },
    {
        id: 'd6',
        orderId: 'ORD-2024-006',
        customerName: 'Rajesh Khanna',
        customerPhone: '+91 98765 66666',
        pickupAddress: 'Fashion Hub, Sector 20',
        deliveryAddress: '66, Rose Garden, Sector 21, Noida',
        distance: '2.8 km',
        estimatedTime: '14 mins',
        amount: 50,
        tip: 10,
        status: 'delivered',
        items: ['T-Shirt (M)', 'Jeans (32)'],
        createdAt: new Date(Date.now() - 7200000),
        deliveryTime: new Date(Date.now() - 6600000),
    },
];

// Mock Earnings Data
export const mockEarnings: EarningsData = {
    today: 485,
    thisWeek: 2840,
    thisMonth: 12560,
    totalDeliveries: 156,
    totalTips: 1250,
    avgRating: 4.8,
};

// Mock Earnings History
export const mockEarningsHistory = [
    { date: 'Today', deliveries: 12, amount: 485, tips: 65 },
    { date: 'Yesterday', deliveries: 15, amount: 580, tips: 80 },
    { date: 'Dec 19', deliveries: 10, amount: 420, tips: 45 },
    { date: 'Dec 18', deliveries: 14, amount: 545, tips: 70 },
    { date: 'Dec 17', deliveries: 11, amount: 460, tips: 55 },
    { date: 'Dec 16', deliveries: 8, amount: 350, tips: 40 },
];
