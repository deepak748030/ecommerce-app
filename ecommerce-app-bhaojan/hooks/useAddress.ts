import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addressesApi, Address as ApiAddress, getToken } from '@/lib/api';

const SELECTED_ADDRESS_KEY = 'selected_address_id';

export interface Address {
    id: string;
    _id?: string;
    type: string;
    name: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

// Convert API address to local format
const toLocalAddress = (apiAddress: ApiAddress): Address => ({
    id: apiAddress._id,
    _id: apiAddress._id,
    type: apiAddress.type,
    name: apiAddress.name,
    phone: apiAddress.phone,
    address: apiAddress.address,
    city: apiAddress.city,
    state: apiAddress.state || '',
    pincode: apiAddress.pincode,
    isDefault: apiAddress.isDefault,
});

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
            const token = await getToken();
            if (!token) {
                setAddresses([]);
                setSelectedAddressState(null);
                setLoading(false);
                return;
            }

            const result = await addressesApi.getAll();

            if (result.success && result.response?.data) {
                const localAddresses = result.response.data.map(toLocalAddress);
                setAddresses(localAddresses);

                // Get selected address ID from storage
                const selectedId = await AsyncStorage.getItem(SELECTED_ADDRESS_KEY);

                if (localAddresses.length > 0) {
                    let selected: Address | undefined;

                    if (selectedId) {
                        selected = localAddresses.find(a => a.id === selectedId);
                    }

                    if (!selected) {
                        selected = localAddresses.find(a => a.isDefault) || localAddresses[0];
                    }

                    setSelectedAddressState(selected || null);
                } else {
                    setSelectedAddressState(null);
                }
            } else {
                setAddresses([]);
                setSelectedAddressState(null);
            }
        } catch (error) {
            console.error('Error loading addresses:', error);
            setAddresses([]);
            setSelectedAddressState(null);
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

    const addAddress = async (address: Omit<Address, 'id' | '_id'>) => {
        try {
            const result = await addressesApi.create({
                type: address.type,
                name: address.name,
                phone: address.phone,
                address: address.address,
                city: address.city,
                state: address.state,
                pincode: address.pincode,
                isDefault: address.isDefault,
            });

            if (result.success && result.response) {
                notifyListeners();
                return toLocalAddress(result.response);
            }

            throw new Error(result.message || 'Failed to add address');
        } catch (error) {
            console.error('Error adding address:', error);
            throw error;
        }
    };

    const updateAddress = async (id: string, updates: Partial<Address>) => {
        try {
            const result = await addressesApi.update(id, {
                type: updates.type as any,
                name: updates.name,
                phone: updates.phone,
                address: updates.address,
                city: updates.city,
                state: updates.state,
                pincode: updates.pincode,
                isDefault: updates.isDefault,
            });

            if (result.success) {
                notifyListeners();
            } else {
                throw new Error(result.message || 'Failed to update address');
            }
        } catch (error) {
            console.error('Error updating address:', error);
            throw error;
        }
    };

    const deleteAddress = async (id: string) => {
        try {
            const result = await addressesApi.delete(id);

            if (result.success) {
                notifyListeners();
            } else {
                throw new Error(result.message || 'Failed to delete address');
            }
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

    const setDefaultAddress = async (id: string) => {
        try {
            const result = await addressesApi.setDefault(id);

            if (result.success) {
                notifyListeners();
            } else {
                throw new Error(result.message || 'Failed to set default address');
            }
        } catch (error) {
            console.error('Error setting default address:', error);
            throw error;
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
        setDefaultAddress,
        refreshAddresses: loadAddresses,
    };
}
