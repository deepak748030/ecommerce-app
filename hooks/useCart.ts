import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product, productsApi, getImageUrl } from '@/lib/api';

const CART_STORAGE_KEY = 'cart_items';

export interface CartItem {
    productId: string;
    product: Product | null;
    quantity: number;
}

export interface CartItemDisplay {
    productId: string;
    name: string;
    price: number;
    mrp: number;
    quantity: number;
    image: string;
    unit: string;
}

let cartListeners: (() => void)[] = [];

const notifyListeners = () => {
    cartListeners.forEach(listener => listener());
};

export function useCart() {
    const [cartItems, setCartItems] = useState<CartItemDisplay[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCart = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (!stored) {
                setCartItems([]);
                setLoading(false);
                return;
            }

            const items: { productId: string; quantity: number }[] = JSON.parse(stored);

            // Fetch product details for each item
            const displayItems: CartItemDisplay[] = [];

            for (const item of items) {
                try {
                    const result = await productsApi.getById(item.productId);
                    if (result.success && result.response) {
                        const product = result.response;
                        displayItems.push({
                            productId: product._id,
                            name: product.title,
                            price: product.price,
                            mrp: product.mrp,
                            quantity: item.quantity,
                            image: getImageUrl(product.image),
                            unit: 'pc',
                        });
                    }
                } catch (err) {
                    console.error('Error fetching product:', item.productId, err);
                }
            }

            setCartItems(displayItems);
        } catch (error) {
            console.error('Error loading cart:', error);
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCart();

        // Subscribe to cart changes
        const listener = () => loadCart();
        cartListeners.push(listener);

        return () => {
            cartListeners = cartListeners.filter(l => l !== listener);
        };
    }, [loadCart]);

    const addToCart = async (productId: string, quantity: number = 1) => {
        try {
            const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
            let items: { productId: string; quantity: number }[] = stored ? JSON.parse(stored) : [];

            const existingIndex = items.findIndex(item => item.productId === productId);

            if (existingIndex >= 0) {
                items[existingIndex].quantity += quantity;
            } else {
                items.push({ productId, quantity });
            }

            await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            notifyListeners();
        } catch (error) {
            console.error('Error adding to cart:', error);
        }
    };

    const updateQuantity = async (productId: string, delta: number) => {
        try {
            const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (!stored) return;

            let items: { productId: string; quantity: number }[] = JSON.parse(stored);
            const index = items.findIndex(item => item.productId === productId);

            if (index >= 0) {
                const newQty = Math.max(1, items[index].quantity + delta);
                items[index].quantity = newQty;
                await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
                notifyListeners();
            }
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    };

    const removeFromCart = async (productId: string) => {
        try {
            const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
            if (!stored) return;

            let items: { productId: string; quantity: number }[] = JSON.parse(stored);
            items = items.filter(item => item.productId !== productId);

            await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
            notifyListeners();
        } catch (error) {
            console.error('Error removing from cart:', error);
        }
    };

    const clearCart = async () => {
        try {
            await AsyncStorage.removeItem(CART_STORAGE_KEY);
            notifyListeners();
        } catch (error) {
            console.error('Error clearing cart:', error);
        }
    };

    const getCartForOrder = async (): Promise<{ productId: string; quantity: number }[]> => {
        try {
            const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error getting cart for order:', error);
            return [];
        }
    };

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
        refreshCart: loadCart,
        subtotal,
        mrpTotal,
        discount,
        delivery,
        tax,
        total,
        itemCount: cartItems.length,
    };
}
