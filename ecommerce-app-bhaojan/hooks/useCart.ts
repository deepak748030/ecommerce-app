import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_STORAGE_KEY = 'cart_items_local';

export interface CartItemDisplay {
    productId: string;
    name: string;
    price: number;
    mrp: number;
    quantity: number;
    image: string;
    unit: string;
}

// Global cart state for instant updates across components
let globalCartItems: CartItemDisplay[] = [];
let cartListeners: Set<(items: CartItemDisplay[]) => void> = new Set();

const notifyListeners = (items: CartItemDisplay[]) => {
    globalCartItems = items;
    cartListeners.forEach(listener => listener(items));
};

// Save to storage in background (non-blocking)
const saveToStorage = (items: CartItemDisplay[]) => {
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch(err => {
        console.error('Error saving cart:', err);
    });
};

// Load from storage on app start
let isInitialized = false;
const initializeCart = async () => {
    if (isInitialized) return;
    isInitialized = true;

    try {
        const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (stored) {
            const items = JSON.parse(stored);
            globalCartItems = items;
            notifyListeners(items);
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
};

export function useCart() {
    const [cartItems, setCartItems] = useState<CartItemDisplay[]>(globalCartItems);
    const [loading, setLoading] = useState(!isInitialized);

    useEffect(() => {
        // Subscribe to global cart updates
        const listener = (items: CartItemDisplay[]) => {
            setCartItems([...items]);
        };
        cartListeners.add(listener);

        // Initialize cart if not done
        if (!isInitialized) {
            initializeCart().then(() => {
                setCartItems([...globalCartItems]);
                setLoading(false);
            });
        } else {
            setCartItems([...globalCartItems]);
            setLoading(false);
        }

        return () => {
            cartListeners.delete(listener);
        };
    }, []);

    const addToCart = useCallback((product: {
        productId: string;
        name: string;
        price: number;
        mrp: number;
        image: string;
        unit?: string;
    }, quantity: number = 1) => {
        const existingIndex = globalCartItems.findIndex(item => item.productId === product.productId);
        let newItems: CartItemDisplay[];

        if (existingIndex >= 0) {
            newItems = [...globalCartItems];
            newItems[existingIndex] = {
                ...newItems[existingIndex],
                quantity: newItems[existingIndex].quantity + quantity,
            };
        } else {
            newItems = [...globalCartItems, {
                productId: product.productId,
                name: product.name,
                price: product.price,
                mrp: product.mrp,
                image: product.image,
                unit: product.unit || 'pc',
                quantity,
            }];
        }

        notifyListeners(newItems);
        saveToStorage(newItems);
    }, []);

    const updateQuantity = useCallback((productId: string, delta: number) => {
        const index = globalCartItems.findIndex(item => item.productId === productId);
        if (index < 0) return;

        const newItems = [...globalCartItems];
        const newQty = Math.max(1, newItems[index].quantity + delta);
        newItems[index] = { ...newItems[index], quantity: newQty };

        notifyListeners(newItems);
        saveToStorage(newItems);
    }, []);

    const removeFromCart = useCallback((productId: string) => {
        const newItems = globalCartItems.filter(item => item.productId !== productId);
        notifyListeners(newItems);
        saveToStorage(newItems);
    }, []);

    const clearCart = useCallback(() => {
        notifyListeners([]);
        AsyncStorage.removeItem(CART_STORAGE_KEY).catch(err => {
            console.error('Error clearing cart:', err);
        });
    }, []);

    const getCartForOrder = useCallback((): { productId: string; quantity: number }[] => {
        return globalCartItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity
        }));
    }, []);

    const refreshCart = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (stored) {
                const items = JSON.parse(stored);
                notifyListeners(items);
            }
        } catch (error) {
            console.error('Error refreshing cart:', error);
        }
    }, []);

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const mrpTotal = cartItems.reduce((sum, item) => sum + (item.mrp * item.quantity), 0);
    const discount = Math.round(subtotal * 0.1);
    const delivery = subtotal > 500 ? 0 : 40;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal - discount + delivery + tax;

    return {
        cartItems,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartForOrder,
        refreshCart,
        subtotal,
        mrpTotal,
        discount,
        delivery,
        tax,
        total,
        itemCount: cartItems.length,
    };
}
