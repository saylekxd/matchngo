import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  ActivityIndicator,
  Alert,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import OpportunityCard from '@/components/OpportunityCard';
import { ArrowLeft, MessageSquare, Star, Globe, Building } from 'lucide-react-native';
import { Database } from '@/lib/database.types';

type NGOProfile = Database['public']['Tables']['ngo_profiles']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'],
  opportunities: Array<Database['public']['Tables']['opportunities']['Row']>
};

export default function NGOProfileScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [ngoProfile, setNGOProfile] = useState<NGOProfile | null>(null);
  
  useEffect(() => {
    if (id) {
      loadNGOData();
    }
  }, [id]);
  
  const loadNGOData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch NGO profile with opportunities
      const { data, error } = await supabase
        .from('ngo_profiles')
        .select(`
          *,
          profile:profiles(*),
          opportunities:opportunities(*)
        `)
        .eq('id', id as string)
        .single();
      
      if (error) throw error;
      setNGOProfile(data as NGOProfile);
    } catch (error) {
      console.error('Error loading NGO profile:', error);
      Alert.alert('Error', 'Failed to load NGO profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMessage = () => {
    if (ngoProfile?.profile?.id) {
      router.push(`/chat/${ngoProfile.profile.id}`);
    }
  };
  
  const handleViewOpportunity = (opportunity: Database['public']['Tables']['opportunities']['Row']) => {
    router.push(`/opportunity/${opportunity.id}`);
  };
  
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361ee" />
        </View>
      </SafeAreaView>
    );
  }
  
  if (!ngoProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>NGO profile not found</Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            type="secondary"
            style={styles.button}
          />
        </View>
      </SafeAreaView>
    );
  }
  
  // Filter open opportunities
  const openOpportunities = ngoProfile.opportunities.filter(
    opp => opp.status === 'open'
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#212529" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <UserAvatar
            uri={ngoProfile.profile.avatar_url}
            name={ngoProfile.organization_name}
            size={80}
          />
          <Text style={styles.name}>{ngoProfile.organization_name}</Text>
          
          <View style={styles.locationContainer}>
            <Text style={styles.location}>{ngoProfile.city}, {ngoProfile.country}</Text>
          </View>
          
          {ngoProfile.verified && (
            <View style={styles.verifiedBadge}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
          
          {profile?.base?.role === 'expert' && (
            <Button
              title="Message"
              onPress={handleMessage}
              style={styles.messageButton}
            />
          )}
        </View>
        
        {ngoProfile.mission_statement && (
          <Card style={styles.missionCard}>
            <Text style={styles.sectionTitle}>Mission</Text>
            <Text style={styles.missionText}>{ngoProfile.mission_statement}</Text>
          </Card>
        )}
        
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Organization Information</Text>
          
          {ngoProfile.founded_year && (
            <View style={styles.infoRow}>
              <Building size={18} color="#6c757d" />
              <Text style={styles.infoText}>Founded in {ngoProfile.founded_year}</Text>
            </View>
          )}
          
          {ngoProfile.website && (
            <View style={styles.infoRow}>
              <Globe size={18} color="#6c757d" />
              <Text style={styles.infoText}>{ngoProfile.website}</Text>
            </View>
          )}
        </Card>
        
        {openOpportunities.length > 0 && (
          <View style={styles.opportunitiesSection}>
            <Text style={styles.sectionTitle}>Open Opportunities</Text>
            {openOpportunities.map((opportunity) => (
              <OpportunityCard
                key={opportunity.id}
                opportunity={opportunity}
                onPress={handleViewOpportunity}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    marginVertical: 24,
    color: '#6c757d',
  },
  button: {
    marginTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 4,
    color: '#212529',
    textAlign: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  location: {
    fontSize: 16,
    color: '#6c757d',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#28a745',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 16,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    marginLeft: 4,
  },
  messageButton: {
    width: '100%',
  },
  missionCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  missionText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#495057',
  },
  opportunitiesSection: {
    marginBottom: 40,
  },
});

function Check(props: { size: number, color: string }) {
  return (
    <View style={{ width: props.size, height: props.size }}>
      <View style={{
        width: props.size,
        height: props.size,
        borderRadius: props.size / 2,
        backgroundColor: props.color,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        {/* Checkmark */}
      </View>
    </View>
  );
}