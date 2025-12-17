import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';
import { Heart, Star, ShoppingBag } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { Event } from '@/lib/mockData';
import { getImageUrl } from '@/lib/api';
import { router } from 'expo-router';

interface EventCardProps {
  event: Event;
  isFavorite?: boolean;
  onToggleFavorite?: () => void;
}

export default function EventCard({ event, isFavorite = false, onToggleFavorite }: EventCardProps) {
  const handlePress = () => {
    router.push(`/event/${event.id}`);
  };

  const imageUri = getImageUrl(event.image);

  return (
    <Pressable
      style={styles.card}
      onPress={handlePress}
      android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
    >
      <View style={styles.imageContainer}>
        <Image source={{ uri: imageUri }} style={styles.image} />

        {event.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{event.badge}</Text>
          </View>
        )}

        {event.mrp && event.mrp > event.price && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>
              {Math.round(((event.mrp - event.price) / event.mrp) * 100)}% OFF
            </Text>
          </View>
        )}

        <Pressable
          style={styles.favoriteButton}
          onPress={onToggleFavorite}
          android_ripple={{ color: colors.primary, borderless: true }}
        >
          <Heart
            size={16}
            color={isFavorite ? '#ff4757' : '#fff'}
            fill={isFavorite ? '#ff4757' : 'transparent'}
          />
        </Pressable>
      </View>

      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        <View style={styles.ratingContainer}>
          <Star size={12} color="#ffc107" fill="#ffc107" />
          <Text style={styles.rating}>{event.rating}</Text>
          <Text style={styles.reviews}>({event.reviews})</Text>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.priceWrapper}>
            {event.mrp && event.mrp > event.price && (
              <Text style={styles.mrpPrice}>₹{event.mrp.toLocaleString()}</Text>
            )}
            <Text style={styles.price}>₹{event.price.toLocaleString()}</Text>
          </View>
          <Pressable style={styles.bagButton}>
            <ShoppingBag size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    overflow: 'hidden',
    height: 240,
  },
  imageContainer: {
    position: 'relative',
  },
  image: {
    width: '100%',
    height: 130,
    resizeMode: 'cover',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ffc107',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    color: '#1a1a2e',
    fontSize: 10,
    fontWeight: 'bold',
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 40,
    backgroundColor: '#00c853',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#fff',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 6,
    borderRadius: 20,
  },
  content: {
    padding: 12,
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    lineHeight: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  reviews: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mrpPrice: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00e676',
  },
  bagButton: {
    backgroundColor: '#6c5ce7',
    padding: 8,
    borderRadius: 10,
  },
});
