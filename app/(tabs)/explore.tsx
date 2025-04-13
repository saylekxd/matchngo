import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  FlatList,
  RefreshControl,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import OpportunityCard from '@/components/OpportunityCard';
import Card from '@/components/Card';
import UserAvatar from '@/components/UserAvatar';
import { router } from 'expo-router';
import { Search, Filter } from 'lucide-react-native';
import { Database } from '@/lib/database.types';

type Opportunity = Database['public']['Tables']['opportunities']['Row'];
type ExpertProfile = Database['public']['Tables']['expert_profiles']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row']
};

export default function ExploreScreen() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data states based on user role
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [experts, setExperts] = useState<ExpertProfile[]>([]);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (profile?.base?.role === 'expert') {
        // Load opportunities for experts
        const { data, error } = await supabase
          .from('opportunities')
          .select('*')
          .eq('status', 'open')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setOpportunities(data || []);
      } else if (profile?.base?.role === 'ngo') {
        // Load experts for NGOs
        const { data, error } = await supabase
          .from('expert_profiles')
          .select(`
            *,
            profile:profiles(*)
          `);
        
        if (error) throw error;
        setExperts(data as ExpertProfile[] || []);
      }
    } catch (error) {
      console.error('Error loading explore data:', error);
      Alert.alert('Error', 'Failed to load data. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleViewOpportunity = (opportunity: Opportunity) => {
    router.push(`/opportunity/${opportunity.id}`);
  };

  const handleViewExpert = (expert: ExpertProfile) => {
    router.push(`/expert/${expert.id}`);
  };
  
  const filteredOpportunities = opportunities.filter(opportunity => 
    opportunity.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    opportunity.description.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const filteredExperts = experts.filter(expert => 
    expert.profile.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (expert.expertise_areas && expert.expertise_areas.some(area => 
      area.toLowerCase().includes(searchQuery.toLowerCase())
    ))
  );

  // Render functions for different user roles
  const renderExpertExplore = () => (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search opportunities"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#4361ee" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Available Opportunities</Text>
      
      {filteredOpportunities.length === 0 ? (
        <Card>
          <Text style={styles.emptyStateText}>No opportunities found.</Text>
          <Text style={styles.emptyStateSubText}>
            Try adjusting your search or check back later for new opportunities.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={filteredOpportunities}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <OpportunityCard 
              opportunity={item} 
              onPress={handleViewOpportunity} 
            />
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );

  const renderNGOExplore = () => (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color="#6c757d" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search experts"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color="#4361ee" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.sectionTitle}>Available Experts</Text>
      
      {filteredExperts.length === 0 ? (
        <Card>
          <Text style={styles.emptyStateText}>No experts found.</Text>
          <Text style={styles.emptyStateSubText}>
            Try adjusting your search or check back later for new experts.
          </Text>
        </Card>
      ) : (
        <FlatList
          data={filteredExperts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card onPress={() => handleViewExpert(item)}>
              <View style={styles.expertCard}>
                <UserAvatar 
                  uri={item.profile.avatar_url} 
                  name={item.profile.full_name} 
                  size={50}
                />
                <View style={styles.expertInfo}>
                  <Text style={styles.expertName}>{item.profile.full_name}</Text>
                  <Text style={styles.expertBio} numberOfLines={2}>
                    {item.profile.bio || "No bio available"}
                  </Text>
                  <View style={styles.tagsContainer}>
                    {item.expertise_areas.slice(0, 3).map((expertise, index) => (
                      <View key={index} style={styles.tag}>
                        <Text style={styles.tagText}>{expertise}</Text>
                      </View>
                    ))}
                    {item.expertise_areas.length > 3 && (
                      <View style={styles.tag}>
                        <Text style={styles.tagText}>+{item.expertise_areas.length - 3}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Card>
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {profile?.base?.role === 'expert' ? renderExpertExplore() : renderNGOExplore()}
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
  searchContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
    paddingHorizontal: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    marginLeft: 8,
  },
  filterButton: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ced4da',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#212529',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#495057',
  },
  emptyStateSubText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6c757d',
  },
  expertCard: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expertInfo: {
    flex: 1,
    marginLeft: 16,
  },
  expertName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#212529',
  },
  expertBio: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#495057',
  },
});