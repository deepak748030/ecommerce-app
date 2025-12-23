import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorites';

// Global state to sync across components
let globalFavorites: string[] = [];
let listeners: Set<(favorites: string[]) => void> = new Set();

const notifyListeners = () => {
    listeners.forEach(listener => listener([...globalFavorites]));
};

export function useWishlist() {
    const [favorites, setFavorites] = useState<string[]>(globalFavorites);
    const [isLoaded, setIsLoaded] = useState(globalFavorites.length > 0);

    useEffect(() => {
        // Subscribe to changes
        const listener = (newFavorites: string[]) => {
            setFavorites(newFavorites);
        };
        listeners.add(listener);

        // Load from storage on first mount
        const loadFavorites = async () => {
            try {
                const stored = await AsyncStorage.getItem(FAVORITES_KEY);
                if (stored) {
                    globalFavorites = JSON.parse(stored);
                    setFavorites(globalFavorites);
                }
            } catch (error) {
                console.error('Error loading favorites:', error);
            } finally {
                setIsLoaded(true);
            }
        };

        if (!isLoaded) {
            loadFavorites();
        }

        return () => {
            listeners.delete(listener);
        };
    }, [isLoaded]);

    const toggleFavorite = useCallback(async (id: string) => {
        try {
            const isCurrentlyFavorite = globalFavorites.includes(id);

            if (isCurrentlyFavorite) {
                globalFavorites = globalFavorites.filter(fid => fid !== id);
            } else {
                globalFavorites = [...globalFavorites, id];
            }

            // Update local state immediately
            setFavorites([...globalFavorites]);

            // Notify all other listeners
            notifyListeners();

            // Persist to storage
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(globalFavorites));
        } catch (error) {
            console.error('Error toggling favorite:', error);
        }
    }, []);

    const isFavorite = useCallback((id: string) => {
        return favorites.includes(id);
    }, [favorites]);

    const removeFavorite = useCallback(async (id: string) => {
        try {
            globalFavorites = globalFavorites.filter(fid => fid !== id);
            setFavorites([...globalFavorites]);
            notifyListeners();
            await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(globalFavorites));
        } catch (error) {
            console.error('Error removing favorite:', error);
        }
    }, []);

    return {
        favorites,
        isLoaded,
        toggleFavorite,
        isFavorite,
        removeFavorite,
        count: favorites.length,
    };
}
