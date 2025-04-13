import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl, SafeAreaView, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import UserAvatar from '@/components/UserAvatar';
import OpportunityCard from '@/components/OpportunityCard';
import { router } from 'expo-router';
import { Database } from '@/lib/database.types';
import MapDisplay from '@/components/maps/MapDisplay';
import { MapPin, List } from 'lucide-react-native';

type Opportunity = Database['public']['Tables']['opportunities']['Row'];
type Application = Database['public']['Tables']['applications']['Row'];

export default function HomeScreen() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  
  // Data states based on user role
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<(Application & { opportunity: Opportunity })[]>([]);

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load all opportunities for the map view
      const { data: allOpportunities, error: opportunitiesError } = await supabase
        .from('opportunities')
        .select(`
          *,
          ngo:ngo_profiles(
            organization_name
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (opportunitiesError) throw opportunitiesError;
      setOpportunities(allOpportunities || []);

      // Load role-specific data
      if (profile?.base?.role === 'ngo') {
        // Filter opportunities for NGO view
        const ngoOpportunities = allOpportunities?.filter(opp => opp.ngo_id === profile.ngo?.id) || [];
        setOpportunities(ngoOpportunities);
      } else if (profile?.base?.role === 'expert') {
        // Load expert's applications
        const { data: applicationData, error: applicationError } = await supabase
          .from('applications')
          .select(`
            *,
            opportunity:opportunities(*)
          `)
          .eq('expert_id', profile.expert?.id || '')
          .order('created_at', { ascending: false });
        
        if (applicationError) throw applicationError;
        setApplications(applicationData as any || []);
      }
    } catch (error) {
      console.error('Error loading home data:', error);
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

  const handleViewApplication = (application: Application & { opportunity: Opportunity }) => {
    router.push(`/application/${application.id}`);
  };

  // Toggle between list and map view
  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'map' : 'list');
  };

  // Prepare markers for the map
  const getMapMarkers = () => {
    return opportunities
      .filter(opp => {
        const location = opp.location as { latitude: number, longitude: number } | null;
        return location && location.latitude && location.longitude;
      })
      .map(opp => {
        const location = opp.location as { latitude: number, longitude: number };
        return {
          id: opp.id,
          coordinate: {
            latitude: location.latitude,
            longitude: location.longitude
          },
          title: opp.title,
          description: opp.location_name,
          ngoName: (opp as any).ngo?.organization_name,
          startDate: opp.start_date,
          endDate: opp.end_date
        };
      });
  };

  // Render map with opportunity markers
  const renderMap = () => {
    const markers = getMapMarkers();
    
    return (
      <View style={styles.mapContainer}>
        <MapDisplay 
          markers={markers}
          style={styles.map}
          onMarkerPress={(marker) => {
            const opportunity = opportunities.find(opp => opp.id === marker.id);
            if (opportunity) {
              handleViewOpportunity(opportunity);
            }
          }}
        />
        {markers.length === 0 && (
          <View style={styles.noMarkersOverlay}>
            <Text style={styles.noMarkersText}>No opportunities found in this area</Text>
          </View>
        )}
      </View>
    );
  };

  // Render functions for different user roles
  const renderNGOHome = () => (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {profile?.ngo?.organization_name}</Text>
      
      <View style={styles.viewToggleContainer}>
        <Text style={styles.sectionTitle}>Your Opportunities</Text>
        <TouchableOpacity style={styles.viewToggleButton} onPress={toggleViewMode}>
          {viewMode === 'list' ? (
            <MapPin size={24} color="#0066cc" />
          ) : (
            <List size={24} color="#0066cc" />
          )}
        </TouchableOpacity>
      </View>
      
      {viewMode === 'map' ? (
        renderMap()
      ) : (
        <FlatList
          data={opportunities}
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
          ListEmptyComponent={
            <Card>
              <Text style={styles.emptyStateText}>
                {isLoading ? 'Loading opportunities...' : "You haven't created any opportunities yet."}
              </Text>
              <Text style={styles.emptyStateSubText}>
                {isLoading 
                  ? 'Please wait while we fetch your opportunities'
                  : 'Create an opportunity to find experts who can help your organization.'}
              </Text>
              {!isLoading && (
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={onRefresh}
                >
                  <Text style={styles.refreshButtonText}>Pull to refresh</Text>
                </TouchableOpacity>
              )}
            </Card>
          }
          contentContainerStyle={opportunities.length === 0 ? styles.emptyListContainer : undefined}
        />
      )}
    </View>
  );

  const renderExpertHome = () => (
    <View style={styles.container}>
      <Text style={styles.welcomeText}>Welcome, {profile?.base?.full_name}</Text>
      
      <View style={styles.viewToggleContainer}>
        <Text style={styles.sectionTitle}>
          {viewMode === 'list' ? 'Your Applications' : 'Available Opportunities'}
        </Text>
        <TouchableOpacity style={styles.viewToggleButton} onPress={toggleViewMode}>
          {viewMode === 'list' ? (
            <MapPin size={24} color="#0066cc" />
          ) : (
            <List size={24} color="#0066cc" />
          )}
        </TouchableOpacity>
      </View>
      
      {viewMode === 'map' ? (
        renderMap()
      ) : (
        <FlatList
          data={applications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card onPress={() => handleViewApplication(item)}>
              <View style={styles.applicationCard}>
                <Text style={styles.applicationTitle}>{item.opportunity.title}</Text>
                <View style={styles.applicationStatusContainer}>
                  <View style={[
                    styles.statusBadge,
                    item.status === 'pending' && styles.statusPending,
                    item.status === 'accepted' && styles.statusAccepted,
                    item.status === 'rejected' && styles.statusRejected,
                    item.status === 'withdrawn' && styles.statusWithdrawn,
                  ]}>
                    <Text style={styles.statusText}>
                      {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          )}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <Card>
              <Text style={styles.emptyStateText}>
                {isLoading ? 'Loading applications...' : "You haven't applied to any opportunities yet."}
              </Text>
              <Text style={styles.emptyStateSubText}>
                {isLoading 
                  ? 'Please wait while we fetch your applications'
                  : 'Browse opportunities that match your expertise and apply to them.'}
              </Text>
              {!isLoading && (
                <TouchableOpacity 
                  style={styles.refreshButton} 
                  onPress={onRefresh}
                >
                  <Text style={styles.refreshButtonText}>Pull to refresh</Text>
                </TouchableOpacity>
              )}
            </Card>
          }
          contentContainerStyle={applications.length === 0 ? styles.emptyListContainer : undefined}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {profile?.base?.role === 'ngo' ? renderNGOHome() : renderExpertHome()}
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
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#212529',
  },
  viewToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  viewToggleButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
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
  applicationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  applicationTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  applicationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#fff3cd',
  },
  statusAccepted: {
    backgroundColor: '#e6f7e6',
  },
  statusRejected: {
    backgroundColor: '#f8d7da',
  },
  statusWithdrawn: {
    backgroundColor: '#e9ecef',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  mapContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    height: 500,
  },
  map: {
    flex: 1,
  },
  noMarkersOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  noMarkersText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#495057',
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  refreshButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#0066cc',
    fontWeight: '600',
    fontSize: 14,
  },
});