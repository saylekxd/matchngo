import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { Chrome as Home, Search, SquarePlus as PlusSquare, MessageSquare, User } from 'lucide-react-native';

export default function TabLayout() {
  const { profile } = useAuth();
  const userRole = profile?.base?.role;
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4361ee',
        tabBarInactiveTintColor: '#6c757d',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabBarLabel,
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="explore"
        options={{
          title: userRole === 'expert' ? 'Opportunities' : 'Experts',
          tabBarIcon: ({ color, size }) => (
            <Search size={size} color={color} />
          ),
        }}
      />
      
      {userRole === 'ngo' && (
        <Tabs.Screen
          name="create"
          options={{
            title: 'Create',
            tabBarIcon: ({ color, size }) => (
              <PlusSquare size={size} color={color} />
            ),
          }}
        />
      )}
      
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, size }) => (
            <MessageSquare size={size} color={color} />
          ),
        }}
      />
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    paddingBottom: 10,
    paddingTop: 10,
  },
  tabBarLabel: {
    fontSize: 12,
  },
});