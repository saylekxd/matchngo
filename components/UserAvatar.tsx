import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface UserAvatarProps {
  uri?: string | null;
  name: string;
  size?: number;
  showBadge?: boolean;
  badgeColor?: string;
}

export default function UserAvatar({ 
  uri, 
  name, 
  size = 40, 
  showBadge = false,
  badgeColor = '#4361ee'
}: UserAvatarProps) {
  // Extract initials from name
  const getInitials = (name: string) => {
    if (!name) return '';
    const parts = name.split(' ');
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const initials = getInitials(name);
  
  return (
    <View style={{ position: 'relative', width: size, height: size }}>
      {uri ? (
        <Image 
          source={{ uri }} 
          style={[
            styles.avatar, 
            { width: size, height: size, borderRadius: size / 2 }
          ]} 
        />
      ) : (
        <View 
          style={[
            styles.avatarFallback, 
            { 
              width: size, 
              height: size, 
              borderRadius: size / 2,
              backgroundColor: stringToColor(name)
            }
          ]}
        >
          <Text 
            style={[
              styles.initialsText, 
              { fontSize: size * 0.4 }
            ]}
          >
            {initials}
          </Text>
        </View>
      )}
      
      {showBadge && (
        <View 
          style={[
            styles.badge, 
            { 
              backgroundColor: badgeColor,
              width: size * 0.3,
              height: size * 0.3,
              borderRadius: size * 0.15,
              right: 0,
              bottom: 0
            }
          ]} 
        />
      )}
    </View>
  );
}

// Function to generate a deterministic color from a string
const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 75%)`;
};

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#e9ecef',
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
});