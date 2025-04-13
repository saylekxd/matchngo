import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import 'react-native-url-polyfill/auto';
import { Database } from './database.types';
import { Platform } from 'react-native';

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://zabkdqubotsrmnxglaap.supabase.co';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphYmtkcXVib3Rzcm1ueGdsYWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1MzU2NTksImV4cCI6MjA2MDExMTY1OX0.dtRno37izxaCGxDxg5IOOPA-x3jqwhAi9FNz1JmDFCA';

// Create a custom storage adapter based on platform
const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web platforms
    return {
      getItem: (key: string) => {
        const value = localStorage.getItem(key);
        return Promise.resolve(value);
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  } else {
    // Use SecureStore for native platforms (iOS/Android)
    return {
      getItem: (key: string) => {
        return SecureStore.getItemAsync(key);
      },
      setItem: (key: string, value: string) => {
        return SecureStore.setItemAsync(key, value);
      },
      removeItem: (key: string) => {
        return SecureStore.deleteItemAsync(key);
      },
    };
  }
};

// Create Supabase client with additional options for web environment
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-app',
      'apikey': supabaseKey,
    },
    fetch: (...args) => {
      // Use the native fetch with better error handling
      return fetch(...args).catch(err => {
        console.error('Fetch error in Supabase client:', err);
        throw err;
      });
    },
  },
});

// Create service role client to bypass RLS policies for admin operations
export const adminSupabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      'X-Client-Info': 'expo-app',
      'apikey': supabaseKey,
      'x-supabase-auth-override': 'service_role' // This bypasses RLS
    },
  },
});

// Function to check database connection and tables with improved error handling
export const checkDatabaseSetup = async (): Promise<{isSetup: boolean; errorMessage?: string}> => {
  try {
    // Try to query the profiles table to check if it exists
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (profilesError) {
      console.error('Profiles table check error:', profilesError);
      return { 
        isSetup: false, 
        errorMessage: 'Could not access the profiles table. Please run migrations.'
      };
    }

    // Check other essential tables
    const { error: ngoError } = await supabase
      .from('ngo_profiles')
      .select('id')
      .limit(1);

    if (ngoError) {
      console.error('NGO profiles table check error:', ngoError);
      return { 
        isSetup: false, 
        errorMessage: 'Could not access the ngo_profiles table. Please run migrations.'
      };
    }

    const { error: expertError } = await supabase
      .from('expert_profiles')
      .select('id')
      .limit(1);

    if (expertError) {
      console.error('Expert profiles table check error:', expertError);
      return { 
        isSetup: false, 
        errorMessage: 'Could not access the expert_profiles table. Please run migrations.'
      };
    }
    
    // All checks passed, database is set up
    return { isSetup: true };
  } catch (error) {
    console.error('Error checking database setup:', error);
    return { 
      isSetup: false, 
      errorMessage: 'Failed to connect to the database or check tables. Please ensure Supabase is properly configured.'
    };
  }
};