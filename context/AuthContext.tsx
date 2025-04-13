import React, { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react';
import { supabase, adminSupabase, checkDatabaseSetup } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { Alert } from 'react-native';

type Profile = Database['public']['Tables']['profiles']['Row'];
type NGOProfile = Database['public']['Tables']['ngo_profiles']['Row'];
type ExpertProfile = Database['public']['Tables']['expert_profiles']['Row'];

type UserProfile = {
  base: Profile | null;
  ngo?: NGOProfile | null;
  expert?: ExpertProfile | null;
};

interface AuthContextProps {
  session: Session | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, userInfo: any) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  // Set up effect to track component mounted state
  useEffect(() => {
    return () => {
      // Set to false when component unmounts
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    // Initialize session and profile
    setIsLoading(true);
    
    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isMounted.current) {
        setSession(session);
        if (session) {
          fetchUserProfile(session.user.id);
        } else {
          setIsLoading(false);
        }
      }
    });

    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted.current) {
        setSession(session);
        if (session) {
          fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
          setIsLoading(false);
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Fetch the base profile
      const { data: baseProfile, error: baseError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (baseError) {
        console.error('Error fetching profile:', baseError);
        if (isMounted.current) {
          setProfile(null);
          setIsLoading(false);
        }
        return;
      }

      const userProfile: UserProfile = { base: baseProfile };

      // Based on the role, fetch additional profile data
      if (baseProfile.role === 'ngo') {
        const { data: ngoProfile, error: ngoError } = await supabase
          .from('ngo_profiles')
          .select('*')
          .eq('profile_id', baseProfile.id)
          .single();

        if (!ngoError) {
          userProfile.ngo = ngoProfile;
        }
      } else if (baseProfile.role === 'expert') {
        const { data: expertProfile, error: expertError } = await supabase
          .from('expert_profiles')
          .select('*')
          .eq('profile_id', baseProfile.id)
          .single();

        if (!expertError) {
          userProfile.expert = expertProfile;
        }
      }

      if (isMounted.current) {
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      if (isMounted.current) {
        setProfile(null);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const signUp = async (email: string, password: string, userInfo: any) => {
    try {
      setIsLoading(true);
      
      // Check if database is properly set up before attempting signup
      const dbStatus = await checkDatabaseSetup();
      if (!dbStatus.isSetup) {
        throw new Error(dbStatus.errorMessage || 'Database tables not set up. Please run the migrations first.');
      }
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No user returned from sign up');

      // 2. Create base profile - using adminSupabase to bypass RLS
      const { data: profileData, error: profileError } = await adminSupabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          role: userInfo.role,
          full_name: userInfo.fullName,
        })
        .select()
        .single();

      if (profileError) throw profileError;

      // 3. Create role-specific profile - using adminSupabase to bypass RLS
      if (userInfo.role === 'ngo') {
        const { error: ngoError } = await adminSupabase
          .from('ngo_profiles')
          .insert({
            profile_id: profileData.id,
            organization_name: userInfo.organizationName,
            country: userInfo.country,
            city: userInfo.city,
          });

        if (ngoError) throw ngoError;
      } else if (userInfo.role === 'expert') {
        const { error: expertError } = await adminSupabase
          .from('expert_profiles')
          .insert({
            profile_id: profileData.id,
            expertise_areas: userInfo.expertiseAreas,
          });

        if (expertError) throw expertError;
      }

      // Success - session will be set by the auth state change listener
    } catch (error: any) {
      console.error('Error signing up:', error);
      
      // Handle specific error cases
      if (error.message?.includes('Database tables not set up') || 
          error.message?.includes('Could not access') || 
          error.message?.includes('Failed to connect')) {
        Alert.alert(
          'Database Not Set Up',
          'The database tables are not set up correctly. Please run the migrations first.'
        );
      } else if (error.message?.includes('rate limit')) {
        Alert.alert(
          'Rate Limit Exceeded',
          'Too many signup attempts. Please wait a minute before trying again.'
        );
      } else {
        Alert.alert(
          'Signup Error',
          `An error occurred during signup: ${error.message}`
        );
      }
      
      throw error;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      // Session will be set by the auth state change listener
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      // Session will be cleared by the auth state change listener
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const refreshProfile = async () => {
    if (session?.user.id) {
      setIsLoading(true);
      await fetchUserProfile(session.user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}