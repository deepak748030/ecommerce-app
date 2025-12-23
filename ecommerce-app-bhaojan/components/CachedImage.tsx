import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Animated, ActivityIndicator, StyleProp, ImageStyle } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface CachedImageProps {
    uri: string;
    style?: StyleProp<ImageStyle>;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
    showLoader?: boolean;
}

// Simple in-memory cache to track loaded images
const imageCache = new Set<string>();

export function CachedImage({ uri, style, resizeMode = 'cover', showLoader = true }: CachedImageProps) {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(!imageCache.has(uri));
    const [error, setError] = useState(false);
    const fadeAnim = useRef(new Animated.Value(imageCache.has(uri) ? 1 : 0)).current;

    const handleLoadEnd = useCallback(() => {
        imageCache.add(uri);
        setLoading(false);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim, uri]);

    const handleError = useCallback(() => {
        setLoading(false);
        setError(true);
    }, []);

    // Reset state when URI changes
    useEffect(() => {
        if (imageCache.has(uri)) {
            setLoading(false);
            fadeAnim.setValue(1);
        } else {
            setLoading(true);
            fadeAnim.setValue(0);
        }
        setError(false);
    }, [uri, fadeAnim]);

    return (
        <View style={[{ backgroundColor: colors.muted, overflow: 'hidden' }, style]}>
            {loading && showLoader && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.muted,
                    }}
                >
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                </View>
            )}
            {!error && (
                <Animated.Image
                    source={{
                        uri,
                        cache: 'force-cache', // Enable native caching
                    }}
                    style={[style, { opacity: fadeAnim, resizeMode }]}
                    onLoadEnd={handleLoadEnd}
                    onError={handleError}
                />
            )}
            {error && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: colors.muted,
                    }}
                />
            )}
        </View>
    );
}

// Preload images into cache
export async function preloadImages(uris: string[]): Promise<void> {
    const promises = uris.map(uri => {
        return new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
                imageCache.add(uri);
                resolve();
            };
            img.onerror = () => resolve();
            img.src = uri;
        });
    });
    await Promise.all(promises);
}

// Clear the image cache
export function clearImageCache(): void {
    imageCache.clear();
}
