import React, { useState, useRef } from 'react';
import { StyleSheet, Text, View, Dimensions, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { router } from 'expo-router';
import { TrendingUp, Users, Award } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH - 32;

interface HomeBannerProps {
  userRole: 'ngo' | 'expert';
}

export default function HomeBanner({ userRole }: HomeBannerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const pan = useRef(new Animated.Value(0)).current;

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: () => true,
    onPanResponderMove: (_, gesture) => {
      const newValue = Math.max(Math.min(gesture.dx, 0), -BANNER_WIDTH);
      pan.setValue(newValue);
    },
    onPanResponderRelease: (_, gesture) => {
      const shouldSnap = gesture.vx < -0.5 || 
        (gesture.vx >= -0.5 && gesture.dx <= -BANNER_WIDTH / 2);
      
      Animated.spring(pan, {
        toValue: shouldSnap ? -BANNER_WIDTH : 0,
        useNativeDriver: true,
        tension: 40,
        friction: 7
      }).start();
      
      setActiveIndex(shouldSnap ? 1 : 0);
    },
  });

  const ngoContent = [
    {
      title: "Create Opportunity",
      description: "Connect with experts who can help your organization grow.",
      icon: <Users size={24} color="#4361ee" />,
      action: () => router.push("/create"),
      buttonText: "Post Now",
      color: "#4361ee",
    },
    {
      title: "View Opportunities",
      description: "Track your opportunities and expert engagement.",
      icon: <TrendingUp size={24} color="#2ec4b6" />,
      action: () => router.push("/"),
      buttonText: "View All",
      color: "#2ec4b6",
    },
  ];

  const expertContent = [
    {
      title: "Find Opportunities",
      description: "Discover NGOs that need your expertise.",
      icon: <Award size={24} color="#4361ee" />,
      action: () => router.push("/explore"),
      buttonText: "Browse Now",
      color: "#4361ee",
    },
    {
      title: "View Applications",
      description: "Monitor your applications and impact.",
      icon: <TrendingUp size={24} color="#2ec4b6" />,
      action: () => router.push("/"),
      buttonText: "View All",
      color: "#2ec4b6",
    },
  ];

  const content = userRole === 'ngo' ? ngoContent : expertContent;

  return (
    <View style={styles.container}>
      <View style={styles.bannerContainer}>
        <Animated.View 
          style={[
            styles.bannersWrapper,
            { transform: [{ translateX: pan }] }
          ]}
          {...panResponder.panHandlers}
        >
          {content.map((item, index) => (
            <View key={index} style={[styles.banner, { backgroundColor: `${item.color}15` }]}>
              <View style={styles.iconContainer}>
                {item.icon}
              </View>
              <View style={styles.contentContainer}>
                <Text style={styles.bannerTitle}>{item.title}</Text>
                <Text style={styles.bannerText}>{item.description}</Text>
                <TouchableOpacity
                  style={[styles.bannerButton, { backgroundColor: item.color }]}
                  onPress={item.action}
                >
                  <Text style={styles.bannerButtonText}>{item.buttonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </Animated.View>
        
        <View style={styles.pagination}>
          {content.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                activeIndex === index && styles.paginationDotActive,
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  bannerContainer: {
    height: 160,
  },
  bannersWrapper: {
    flexDirection: 'row',
    width: BANNER_WIDTH * 2,
  },
  banner: {
    width: BANNER_WIDTH,
    height: 140,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  contentContainer: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  bannerText: {
    fontSize: 14,
    color: '#4a4a4a',
    marginBottom: 12,
  },
  bannerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  bannerButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 4,
  },
  paginationDotActive: {
    backgroundColor: '#4361ee',
  },
}); 