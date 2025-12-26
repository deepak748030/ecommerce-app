import { lightColors, darkColors } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark';

const THEME_STORAGE_KEY = '@app_theme';

let currentTheme: ThemeMode = 'light';
let listeners: Array<(theme: ThemeMode) => void> = [];
let isInitialized = false;

// Initialize theme from storage
export const initializeTheme = async () => {
    if (isInitialized) return;
    try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme === 'light' || savedTheme === 'dark') {
            currentTheme = savedTheme;
            listeners.forEach(listener => listener(currentTheme));
        }
        isInitialized = true;
    } catch (error) {
        console.error('Error loading theme from storage:', error);
        isInitialized = true;
    }
};

export const getTheme = () => currentTheme;

export const getColors = () => {
    return currentTheme === 'light' ? lightColors : darkColors;
};

export const toggleTheme = async () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    listeners.forEach(listener => listener(currentTheme));
    try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, currentTheme);
    } catch (error) {
        console.error('Error saving theme to storage:', error);
    }
};

export const setTheme = async (theme: ThemeMode) => {
    currentTheme = theme;
    listeners.forEach(listener => listener(currentTheme));
    try {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch (error) {
        console.error('Error saving theme to storage:', error);
    }
};

export const subscribeToTheme = (listener: (theme: ThemeMode) => void) => {
    listeners.push(listener);
    return () => {
        listeners = listeners.filter(l => l !== listener);
    };
};
