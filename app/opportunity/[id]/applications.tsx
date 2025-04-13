import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import UserAvatar from '@/components/UserAvatar';
import Button from '@/components/Button';
import { ArrowLeft, Check, X } from 'lucide-react-native';
import { Database } from '@/lib/database.types';

type Application = Database['public']['Tables']['applications']['Row'] & {
  expert: Database['public']['Tables']['expert_profiles']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row']
  }
};

type Opportunity = Database['public']['Tables']['opportunities']['Row'];

export default function ApplicationsScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applications, setApplications] = useState<Application[]>([]);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  
  useEffect(() => {
    if (id) {
      loadApplications();
    }
  }, [id]);
  
  const loadApplications = async () => {
    try {
      setIsLoading(true);
      
      // First, check if the opportunity belongs to the NGO
      const { data: opportunityData, error: opportunityError } = await supabase
        .from('opportunities')
        .select('*')
        .eq('id', id as string)
        .single();
      
      if (opportunityError) throw opportunityError;
      
      if (opportunityData.ngo_id !== profile?.ngo?.id) {
        Alert.alert('Error', 'You do not have permission to view these applications');
        router.back();
        return;
      }
      
      setOpportunity(opportunityData);
      
      // Fetch applications with expert profile details
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          expert:expert_profiles(
            *,
            profile:profiles(*)
          )
        `)
        .eq('opportunity_id', id as string)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      setApplications(data as Application[]);
    } catch (error) {
      console.error('Error loading applications:', error);
      Alert.alert('Error', 'Failed to load applications');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    loadApplications();
  };
  
  const handleViewExpert = (application: Application) => {
    router.push(`/expert/${application.expert.id}`);
  };
  
  const handleViewApplication = (application: Application) => {
    router.push(`/application/${application.id}`);
  };
  
  const handleUpdateStatus = async (application: Application, newStatus: 'accepted' | 'rejected') => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('applications')
        .update({ status: newStatus })
        .eq('id', application.id);
      
      if (error) throw error;
      
      // If accepting, also update opportunity status
      if (newStatus === 'accepted' && opportunity) {
        const { error: opportunityError } = await supabase
          .from('opportunities')
          .update({ status: 'in_progress' })
          .eq('id', opportunity.id);
        
        if (opportunityError) throw opportunityError;
      }
      
      // Refresh data
      loadApplications();
      
      Alert.alert(
        'Status Updated',
        `Application has been ${newStatus}`,
      );
    } catch (error: any) {
      console.error('Error updating application status:', error);
      Alert.alert('Error', error.message || 'Failed to update application status');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderApplicationItem = ({ item }: { item: Application }) => (
    <Card style={styles.applicationCard}>
      <TouchableOpacity 
        style={styles.applicantContainer}
        onPress={() => handleViewExpert(item)}
      >
        <UserAvatar 
          uri={item.expert.profile.avatar_url} 
          name={item.expert.profile.full_name} 
          size={50}
        />
        <View style={styles.applicantInfo}>
          <Text style={styles.applicantName}>{item.expert.profile.full_name}</Text>
          <View style={styles.tagsContainer}>
            {item.expert.expertise_areas.slice(0, 3).map((expertise, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{expertise}</Text>
              </View>
            ))}
            {item.expert.expertise_areas.length > 3 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{item.expert.expertise_areas.length - 3}</Text>
              </View>
            )}
          </View>
        </View>
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
      </TouchableOpacity>
      
      <View style={styles.messagePreview}>
        <Text style={styles.messageText} numberOfLines={2}>
          {item.message ? item.message : "No message provided."}
        </Text>
      </View>
      
      <View style={styles.applicationActions}>
        <Button
          title="View Details"
          onPress={() => handleViewApplication(item)}
          type="secondary"
          style={styles.actionButton}
        />
        
        {item.status === 'pending' && (
          <View style={styles.statusButtons}>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={() => handleUpdateStatus(item, 'rejected')}
            >
              <X size={20} color="#dc3545" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.acceptButton}
              onPress={() => handleUpdateStatus(item, 'accepted')}
            >
              <Check size={20} color="#28a745" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Card>
  );
  
  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4361ee" />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Applications',
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#212529" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <View style={styles.container}>
        {applications.length === 0 ? (
          <Card>
            <Text style={styles.emptyStateText}>No applications yet.</Text>
            <Text style={styles.emptyStateSubText}>
              Once experts apply to this opportunity, they will appear here.
            </Text>
          </Card>
        ) : (
          <FlatList
            data={applications}
            keyExtractor={(item) => item.id}
            renderItem={renderApplicationItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        )}
      </View>
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
  listContent: {
    paddingBottom: 20,
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
    marginBottom: 16,
  },
  applicantContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  applicantInfo: {
    flex: 1,
    marginLeft: 12,
  },
  applicantName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#495057',
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
  messagePreview: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e9ecef',
    marginBottom: 12,
  },
  messageText: {
    fontSize: 14,
    color: '#495057',
    fontStyle: 'italic',
  },
  applicationActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
  },
  statusButtons: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  rejectButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8d7da',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  acceptButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e6f7e6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});