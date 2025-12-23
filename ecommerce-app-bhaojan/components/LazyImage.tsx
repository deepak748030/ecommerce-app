import React, { useState, useCallback } from 'react';
import { View, Image, ImageStyle, StyleProp, ActivityIndicator, Animated } from 'react-native';
import { useTheme } from '@/hooks/useTheme';

interface LazyImageProps {
    source: { uri: string };
    style?: StyleProp<ImageStyle>;
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'center';
    placeholderColor?: string;
}

export function LazyImage({ source, style, resizeMode = 'cover', placeholderColor }: LazyImageProps) {
    const { colors } = useTheme();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const fadeAnim = useState(new Animated.Value(0))[0];

    const handleLoadEnd = useCallback(() => {
        setLoading(false);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
        }).start();
    }, [fadeAnim]);

    const handleError = useCallback(() => {
        setLoading(false);
        setError(true);
    }, []);

    const bgColor = placeholderColor || colors.muted;

    return (
        <View style={[{ backgroundColor: bgColor, overflow: 'hidden' }, style]}>
            {loading && (
                <View
                    style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: bgColor,
                    }}
                >
                    <ActivityIndicator size="small" color={colors.mutedForeground} />
                </View>
            )}
            {!error && (
                <Animated.Image
                    source={source}
                    style={[style, { opacity: fadeAnim }]}
                    resizeMode={resizeMode}
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
                        backgroundColor: bgColor,
                    }}
                />
            )}
        </View>
    );
}
