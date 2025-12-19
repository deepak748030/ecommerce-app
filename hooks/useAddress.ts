import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ADDRESS_STORAGE_KEY = 'saved_addresses';
const SELECTED_ADDRESS_KEY = 'selected_address';

export interface Address {
    id: string;
    type: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

let addressListeners: (() => void)[] = [];

const notifyListeners = () => {
    addressListeners.forEach(listener => listener());
};

export function useAddress() {
    const [addresses, setAddresses] = useState<Address[]>([]);
    const [selectedAddress, setSelectedAddressState] = useState<Address | null>(null);
    const [loading, setLoading] = useState(true);

    const loadAddresses = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
            const savedAddresses: Address[] = stored ? JSON.parse(stored) : [];
            setAddresses(savedAddresses);

            const selectedId = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);
            if (selectedId && savedAddresses.length > 0) {
                const selected = savedAddresses.find(a => a.id === selectedId);
                setSelectedAddressState(selected || savedAddresses.find(a => a.isDefault) || savedAddresses[0]);
            } else if (savedAddresses.length > 0) {
                const defaultAddr = savedAddresses.find(a => a.isDefault) || savedAddresses[0];
                setSelectedAddressState(defaultAddr);
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
            setAddresses([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadAddresses();

        const listener = () => loadAddresses();
        addressListeners.push(listener);

        return () => {
            addressListeners = addressListeners.filter(l => l !== listener);
        };
    }, [loadAddresses]);

    const addAddress = async (address: Omit<Address, 'id'>) => {
        try {
            const newAddress: Address = {
                ...address,
                id: Date.now().toString(),
            };

            const stored = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
            const currentAddresses: Address[] = stored ? JSON.parse(stored) : [];

            if (newAddress.isDefault) {
                currentAddresses.forEach(a => a.isDefault = false);
            }

            currentAddresses.push(newAddress);
            await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(currentAddresses));
            notifyListeners();

            return newAddress;
        } catch (error) {
            console.error('Error adding address:', error);
            throw error;
        }
    };

    const updateAddress = async (id: string, updates: Partial<Address>) => {
        try {
            const stored = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
            let currentAddresses: Address[] = stored ? JSON.parse(stored) : [];

            const index = currentAddresses.findIndex(a => a.id === id);
            if (index >= 0) {
                if (updates.isDefault) {
                    currentAddresses.forEach(a => a.isDefault = false);
                }
                currentAddresses[index] = { ...currentAddresses[index], ...updates };
                await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(currentAddresses));
                notifyListeners();
            }
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            const stored = await AsyncStorage.getItem(ADDRESS_STORAGE_KEY);
            let currentAddresses: Address[] = stored ? JSON.parse(stored) : [];

            currentAddresses = currentAddresses.filter(a => a.id !== id);
            await AsyncStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(currentAddresses));
            notifyListeners();
        } catch (error) {
            console.error('Error deleting address:', error);
            throw error;
        }
    };

    const setSelectedAddress = async (address: Address) => {
        try {
            await AsyncStorage.setItem(SELECTED_ADDRESS_KEY, address.id);
            setSelectedAddressState(address);
        } catch (error) {
            console.error('Error setting selected address:', error);
        }
    };

    return {
        addresses,
        selectedAddress,
        loading,
        addAddress,
        updateAddress,
        deleteAddress,
        setSelectedAddress,
        refreshAddresses: loadAddresses,
    };
}
