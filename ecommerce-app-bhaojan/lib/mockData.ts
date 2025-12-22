import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Vendor {
  id: string;
  name: string;
  avatar: string;
  phone: string;
  email: string;
  experience: string;
}

export interface Event {
  id: string;
  title: string;
  image: string;
  images: string[];
  location: string;
  fullLocation: string;
  category: string;
  price: number;
  mrp: number;
  rating: number;
  reviews: number;
  badge?: string;
  description: string;
  date: string;
  time: string;
  services: string[];
  vendor: Vendor;
}

export interface Booking {
  id: string;
  eventId: string;
  event: Event;
  date: string;
  time: string;
  tickets: number;
  price: number;
  status: "Confirmed" | "Pending" | "Cancelled";
  bookingDate: string;
}

export interface Banner {
  id: string;
  image: string;
  eventId: string;
  badge: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  isBlocked?: boolean;
  memberSince: string;
}

export interface Review {
  id: string;
  eventId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "booking" | "offer" | "cancellation";
  timestamp: string;
  read: boolean;
}

export type MessageStatus = 'pending' | 'sent' | 'delivered' | 'seen';

export interface Message {
  id: string;
  vendorId: string;
  vendorName: string;
  message: string;
  timestamp: string;
  isVendor: boolean;
  status?: MessageStatus;
}

// Mock Vendors
export const mockVendors: Vendor[] = [
  {
    id: "1",
    name: "Elegant Events Mumbai",
    avatar: "https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=200&h=200",
    phone: "+91 98765 43210",
    email: "contact@elegantevents.com",
    experience: "8+ years experience",
  },
  {
    id: "2",
    name: "Royal Celebrations",
    avatar: "https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=200&h=200",
    phone: "+91 98765 43211",
    email: "info@royalcelebrations.com",
    experience: "12+ years experience",
  },
  {
    id: "3",
    name: "Dream Weddings Co.",
    avatar: "https://images.pexels.com/photos/1181690/pexels-photo-1181690.jpeg?auto=compress&cs=tinysrgb&w=200&h=200",
    phone: "+91 98765 43212",
    email: "hello@dreamweddings.com",
    experience: "5+ years experience",
  }
];

// Mock Events
export const mockEvents: Event[] = [
  {
    id: "1",
    title: "Traditional Indian Wedding Package",
    image: "https://images.pexels.com/photos/1983046/pexels-photo-1983046.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
    images: [
      "https://images.pexels.com/photos/1983046/pexels-photo-1983046.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
      "https://images.pexels.com/photos/169193/pexels-photo-169193.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
      "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400&h=300"
    ],
    location: "Mumbai",
    fullLocation: "Mumbai, Maharashtra, India",
    category: "Weddings",
    price: 75000,
    mrp: 107000,
    rating: 4.8,
    reviews: 124,
    badge: "30% OFF",
    description: "Complete traditional Indian wedding package with decoration, catering, and photography services.",
    date: "2025-02-15",
    time: "6:00 PM - 11:00 PM",
    services: [
      "Mandap decoration",
      "Catering for 500 guests",
      "Photography & Videography",
      "DJ & Sound system",
      "Flower arrangements"
    ],
    vendor: mockVendors[0],
  },
  {
    id: "2",
    title: "Birthday Party Celebration",
    image: "https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
    images: [
      "https://images.pexels.com/photos/1857157/pexels-photo-1857157.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
      "https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400&h=300"
    ],
    location: "Delhi",
    fullLocation: "New Delhi, Delhi, India",
    category: "Birthday Parties",
    price: 25000,
    mrp: 30000,
    rating: 4.6,
    reviews: 89,
    badge: "₹500 OFF",
    description: "Fun-filled birthday party package with themes, decorations, and entertainment.",
    date: "2025-01-20",
    time: "4:00 PM - 8:00 PM",
    services: [
      "Theme decoration",
      "Birthday cake",
      "Entertainment activities",
      "Photo booth setup",
      "Party favors"
    ],
    vendor: mockVendors[1],
  },
  {
    id: "3",
    title: "Corporate Event Management",
    image: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
    images: [
      "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
      "https://images.pexels.com/photos/2422294/pexels-photo-2422294.jpeg?auto=compress&cs=tinysrgb&w=400&h=300"
    ],
    location: "Bangalore",
    fullLocation: "Bangalore, Karnataka, India",
    category: "Corporate Events",
    price: 50000,
    mrp: 65000,
    rating: 4.7,
    reviews: 156,
    badge: "BUY 1 GET 1",
    description: "Professional corporate event management for conferences, seminars, and team building.",
    date: "2025-01-25",
    time: "9:00 AM - 6:00 PM",
    services: [
      "Venue setup",
      "AV equipment",
      "Catering service",
      "Registration management",
      "Event coordination"
    ],
    vendor: mockVendors[2],
  },
  {
    id: "4",
    title: "Live Music Concert",
    image: "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
    images: [
      "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
      "https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg?auto=compress&cs=tinysrgb&w=400&h=300"
    ],
    location: "Goa",
    fullLocation: "Panaji, Goa, India",
    category: "Concerts & Music",
    price: 15000,
    mrp: 20000,
    rating: 4.9,
    reviews: 201,
    description: "Experience amazing live music concerts with top artists and performers.",
    date: "2025-02-10",
    time: "7:00 PM - 12:00 AM",
    services: [
      "Live band performance",
      "Sound & lighting system",
      "Stage setup",
      "Security arrangements",
      "Parking management"
    ],
    vendor: mockVendors[0],
  },
  {
    id: "5",
    title: "Engagement Ceremony",
    image: "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
    images: [
      "https://images.pexels.com/photos/1444442/pexels-photo-1444442.jpeg?auto=compress&cs=tinysrgb&w=400&h=300"
    ],
    location: "Pune",
    fullLocation: "Pune, Maharashtra, India",
    category: "Weddings",
    price: 35000,
    mrp: 45000,
    rating: 4.5,
    reviews: 67,
    description: "Beautiful engagement ceremony arrangements with traditional decorations.",
    date: "2025-03-05",
    time: "5:00 PM - 9:00 PM",
    services: [
      "Ring ceremony setup",
      "Floral decorations",
      "Photography",
      "Catering",
      "Music arrangements"
    ],
    vendor: mockVendors[1],
  },
  {
    id: "6",
    title: "Kids Birthday Party",
    image: "https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400&h=300",
    images: [
      "https://images.pexels.com/photos/1684187/pexels-photo-1684187.jpeg?auto=compress&cs=tinysrgb&w=400&h=300"
    ],
    location: "Mumbai",
    fullLocation: "Mumbai, Maharashtra, India",
    category: "Birthday Parties",
    price: 18000,
    mrp: 25000,
    rating: 4.8,
    reviews: 92,
    description: "Exciting kids birthday party with games, activities, and cartoon themes.",
    date: "2025-01-30",
    time: "3:00 PM - 7:00 PM",
    services: [
      "Cartoon theme decoration",
      "Magic show",
      "Game activities",
      "Birthday cake",
      "Return gifts"
    ],
    vendor: mockVendors[2],
  }
];

// Trending Products (Fruits)
export const trendingProducts: Event[] = [
  {
    id: 'trend-1',
    title: 'Fresh Apples',
    price: 120,
    mrp: 150,
    rating: 4.8,
    reviews: 234,
    image: 'https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?auto=compress&cs=tinysrgb&w=300',
    images: ['https://images.pexels.com/photos/1510392/pexels-photo-1510392.jpeg?auto=compress&cs=tinysrgb&w=400'],
    badge: '20% OFF',
    location: 'Fresh Market',
    fullLocation: 'Fresh Market, Mumbai',
    category: 'Fruits',
    description: 'Premium quality fresh apples sourced directly from Kashmir orchards. Rich in fiber and vitamins.',
    date: 'Available Daily',
    time: '8:00 AM - 10:00 PM',
    services: ['Fresh Quality', 'Same Day Delivery', 'Easy Returns', '100% Organic'],
    vendor: mockVendors[0]
  },
  {
    id: 'trend-2',
    title: 'Organic Bananas',
    price: 60,
    mrp: 80,
    rating: 4.9,
    reviews: 456,
    image: 'https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=300',
    images: ['https://images.pexels.com/photos/2872755/pexels-photo-2872755.jpeg?auto=compress&cs=tinysrgb&w=400'],
    badge: 'Organic',
    location: 'Farm Fresh',
    fullLocation: 'Farm Fresh Store, Delhi',
    category: 'Fruits',
    description: 'Certified organic bananas grown without pesticides. Perfect for smoothies and healthy snacks.',
    date: 'Available Daily',
    time: '8:00 AM - 10:00 PM',
    services: ['Certified Organic', 'Farm Fresh', 'No Pesticides', 'Rich in Potassium'],
    vendor: mockVendors[1]
  },
  {
    id: 'trend-3',
    title: 'Premium Mangoes',
    price: 250,
    mrp: 300,
    rating: 4.7,
    reviews: 189,
    image: 'https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=300',
    images: ['https://images.pexels.com/photos/918643/pexels-photo-918643.jpeg?auto=compress&cs=tinysrgb&w=400'],
    badge: 'Premium',
    location: 'Tropical Store',
    fullLocation: 'Tropical Store, Bangalore',
    category: 'Fruits',
    description: 'Alphonso mangoes - the king of fruits. Sweet, juicy, and aromatic.',
    date: 'Seasonal',
    time: '9:00 AM - 9:00 PM',
    services: ['Alphonso Quality', 'Hand Picked', 'Ripened Naturally', 'Export Quality'],
    vendor: mockVendors[2]
  },
  {
    id: 'trend-4',
    title: 'Fresh Oranges',
    price: 90,
    mrp: 110,
    rating: 4.6,
    reviews: 321,
    image: 'https://images.pexels.com/photos/42059/citrus-diet-food-fresh-42059.jpeg?auto=compress&cs=tinysrgb&w=300',
    images: ['https://images.pexels.com/photos/42059/citrus-diet-food-fresh-42059.jpeg?auto=compress&cs=tinysrgb&w=400'],
    badge: 'Fresh',
    location: 'City Market',
    fullLocation: 'City Market, Pune',
    category: 'Fruits',
    description: 'Juicy Nagpur oranges packed with Vitamin C. Perfect for fresh juice.',
    date: 'Available Daily',
    time: '8:00 AM - 10:00 PM',
    services: ['Rich in Vitamin C', 'Nagpur Special', 'Fresh Stock', 'Bulk Available'],
    vendor: mockVendors[0]
  },
];

// Fashion Products
export const fashionProducts: Event[] = [
  {
    id: 'fashion-1',
    title: 'Summer T-Shirt',
    price: 599,
    mrp: 999,
    rating: 4.5,
    reviews: 567,
    image: 'https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=300',
    images: ['https://images.pexels.com/photos/996329/pexels-photo-996329.jpeg?auto=compress&cs=tinysrgb&w=400'],
    badge: 'Trending',
    location: 'Fashion Hub',
    fullLocation: 'Fashion Hub, Mumbai',
    category: 'Fashion',
    description: 'Comfortable cotton t-shirt perfect for summer. Available in multiple colors and sizes.',
    date: 'In Stock',
    time: 'Ships in 2-3 days',
    services: ['100% Cotton', 'Multiple Colors', 'All Sizes', 'Easy Returns'],
    vendor: mockVendors[1]
  },
  {
    id: 'fashion-2',
    title: 'Denim Jeans',
    price: 1299,
    mrp: 1999,
    rating: 4.7,
    reviews: 892,
    image: 'https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=300',
    images: ['https://images.pexels.com/photos/1598507/pexels-photo-1598507.jpeg?auto=compress&cs=tinysrgb&w=400'],
    badge: 'Bestseller',
    location: 'Style Store',
    fullLocation: 'Style Store, Delhi',
    category: 'Fashion',
    description: 'Classic fit denim jeans with premium quality fabric. Comfortable and durable.',
    date: 'In Stock',
    time: 'Ships in 2-3 days',
    services: ['Premium Denim', 'Classic Fit', 'Durable', 'All Waist Sizes'],
    vendor: mockVendors[2]
  },
  {
    id: 'fashion-3',
    title: 'Sneakers',
    price: 2499,
    mrp: 3999,
    rating: 4.8,
    reviews: 1234,
    image: 'https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=300',
    images: ['https://images.pexels.com/photos/2529148/pexels-photo-2529148.jpeg?auto=compress&cs=tinysrgb&w=400'],
    badge: 'Hot Deal',
    location: 'Shoe Palace',
    fullLocation: 'Shoe Palace, Bangalore',
    category: 'Fashion',
    description: 'Trendy sneakers with cushioned sole for maximum comfort. Perfect for daily wear.',
    date: 'In Stock',
    time: 'Ships in 1-2 days',
    services: ['Cushioned Sole', 'Breathable', 'All Sizes', 'Lightweight'],
    vendor: mockVendors[0]
  },
  {
    id: 'fashion-4',
    title: 'Sunglasses',
    price: 799,
    mrp: 1499,
    rating: 4.4,
    reviews: 445,
    image: 'https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=300',
    images: ['https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=400'],
    badge: 'New',
    location: 'Eye Wear',
    fullLocation: 'Eye Wear Store, Goa',
    category: 'Fashion',
    description: 'Stylish UV protection sunglasses. Lightweight frame with polarized lenses.',
    date: 'In Stock',
    time: 'Ships in 2-3 days',
    services: ['UV Protection', 'Polarized Lens', 'Lightweight', 'Unisex'],
    vendor: mockVendors[1]
  },
];

// All Products Combined
export const allProducts: Event[] = [...mockEvents, ...trendingProducts, ...fashionProducts];

// Mock Banners
export const mockBanners: Banner[] = [
  {
    id: "1",
    image: "https://images.pexels.com/photos/1983046/pexels-photo-1983046.jpeg?auto=compress&cs=tinysrgb&w=500&h=300",
    eventId: "1",
    badge: "30% OFF"
  },
  {
    id: "2",
    image: "https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=500&h=300",
    eventId: "4",
    badge: "₹500 OFF"
  },
  {
    id: "3",
    image: "https://images.pexels.com/photos/1181396/pexels-photo-1181396.jpeg?auto=compress&cs=tinysrgb&w=500&h=300",
    eventId: "3",
    badge: "BUY 1 GET 1"
  }
];

// Mock Categories - Updated to match all product categories
export const mockCategories = [
  { id: "all", name: "All Products" },
  { id: "Fruits", name: "Fruits" },
  { id: "Fashion", name: "Fashion" },
  { id: "Weddings", name: "Weddings" },
  { id: "Birthday Parties", name: "Birthday Parties" },
  { id: "Corporate Events", name: "Corporate Events" },
  { id: "Concerts & Music", name: "Concerts & Music" },
];

// Mock Reviews
export const mockReviews: Review[] = [
  {
    id: "1",
    eventId: "1",
    userName: "Priya Sharma",
    userAvatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    rating: 5,
    comment: "Amazing wedding arrangements! Everything was perfect and the team was very professional.",
    date: "2024-12-15"
  },
  {
    id: "2",
    eventId: "1",
    userName: "Rahul Verma",
    userAvatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100&h=100",
    rating: 4,
    comment: "Great service and beautiful decorations. Highly recommended for weddings.",
    date: "2024-12-10"
  }
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: "1",
    title: "Booking Confirmed",
    message: "Your booking for Traditional Indian Wedding Package has been confirmed!",
    type: "booking",
    timestamp: "2025-01-15T10:30:00Z",
    read: false
  },
  {
    id: "2",
    title: "Special Offer",
    message: "Get 20% off on all birthday party bookings this week!",
    type: "offer",
    timestamp: "2025-01-14T15:45:00Z",
    read: false
  },
  {
    id: "3",
    title: "Booking Cancelled",
    message: "Your booking for Corporate Event has been cancelled as requested.",
    type: "cancellation",
    timestamp: "2025-01-13T09:15:00Z",
    read: true
  }
];

// Storage functions
export const getAuthUser = async (): Promise<User | null> => {
  try {
    const user = await AsyncStorage.getItem('authUser');
    return user ? JSON.parse(user) : null;
  } catch (error) {
    return null;
  }
};

export const setAuthUser = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem('authUser', JSON.stringify(user));
  } catch (error) {
    console.error('Error saving user:', error);
  }
};

export const removeAuthUser = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('authUser');
  } catch (error) {
    console.error('Error removing user:', error);
  }
};

export const getFavorites = async (): Promise<string[]> => {
  try {
    const favorites = await AsyncStorage.getItem('favorites');
    return favorites ? JSON.parse(favorites) : [];
  } catch (error) {
    return [];
  }
};

export const toggleFavorite = async (eventId: string): Promise<boolean> => {
  try {
    const favorites = await getFavorites();
    const index = favorites.indexOf(eventId);

    if (index === -1) {
      favorites.push(eventId);
    } else {
      favorites.splice(index, 1);
    }

    await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
    return index === -1; // Returns true if added, false if removed
  } catch (error) {
    return false;
  }
};

export const getBookings = async (): Promise<Booking[]> => {
  try {
    const bookings = await AsyncStorage.getItem('bookings');
    return bookings ? JSON.parse(bookings) : [];
  } catch (error) {
    return [];
  }
};

export const addBooking = async (booking: Booking): Promise<void> => {
  try {
    const bookings = await getBookings();
    bookings.push(booking);
    await AsyncStorage.setItem('bookings', JSON.stringify(bookings));

    // Add a notification for the new booking
    const notifications = await getNotifications();
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: 'Booking Confirmed',
      message: `Your prebooking for "${booking.event.title}" has been confirmed!`,
      type: 'booking',
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotification);
    await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Error adding booking:', error);
  }
};

export const getNotifications = async (): Promise<Notification[]> => {
  try {
    const notifications = await AsyncStorage.getItem('notifications');
    return notifications ? JSON.parse(notifications) : mockNotifications;
  } catch (error) {
    return mockNotifications;
  }
};

export const markNotificationRead = async (id: string): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

export const getMessages = async (vendorId: string): Promise<Message[]> => {
  try {
    const messages = await AsyncStorage.getItem(`messages_${vendorId}`);
    return messages ? JSON.parse(messages) : [];
  } catch (error) {
    return [];
  }
};

export const addMessage = async (vendorId: string, message: Message): Promise<void> => {
  try {
    const messages = await getMessages(vendorId);
    messages.push(message);
    await AsyncStorage.setItem(`messages_${vendorId}`, JSON.stringify(messages));
  } catch (error) {
    console.error('Error adding message:', error);
  }
};

// Add notification from push notification
export const addNotificationFromPush = async (title: string, body: string): Promise<void> => {
  try {
    const notifications = await getNotifications();
    const newNotification: Notification = {
      id: Date.now().toString(),
      title: title,
      message: body,
      type: 'booking', // Default type for push notifications
      timestamp: new Date().toISOString(),
      read: false,
    };
    notifications.unshift(newNotification);
    await AsyncStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.error('Error adding notification from push:', error);
  }
};

export const getMessageLimit = async (vendorId: string): Promise<number> => {
  try {
    const messages = await getMessages(vendorId);
    const userMessages = messages.filter(m => !m.isVendor);
    return Math.max(0, 5 - userMessages.length);
  } catch (error) {
    return 5;
  }
};

export const getReviews = async (eventId: string): Promise<Review[]> => {
  try {
    const reviews = await AsyncStorage.getItem(`reviews_${eventId}`);
    return reviews ? JSON.parse(reviews) : mockReviews.filter(r => r.eventId === eventId);
  } catch (error) {
    return mockReviews.filter(r => r.eventId === eventId);
  }
};

export const addReview = async (eventId: string, review: Review): Promise<void> => {
  try {
    const reviews = await getReviews(eventId);
    reviews.unshift(review);
    await AsyncStorage.setItem(`reviews_${eventId}`, JSON.stringify(reviews));
  } catch (error) {
    console.error('Error adding review:', error);
  }
};

export const getBookingById = async (id: string): Promise<Booking | null> => {
  try {
    const bookings = await getBookings();
    return bookings.find(b => b.id === id) || null;
  } catch (error) {
    return null;
  }
};

export const updateBookingStatus = async (id: string, status: 'Confirmed' | 'Pending' | 'Cancelled'): Promise<void> => {
  try {
    const bookings = await getBookings();
    const bookingIndex = bookings.findIndex(b => b.id === id);
    if (bookingIndex !== -1) {
      bookings[bookingIndex].status = status;
      await AsyncStorage.setItem('bookings', JSON.stringify(bookings));
    }
  } catch (error) {
    console.error('Error updating booking status:', error);
  }
};