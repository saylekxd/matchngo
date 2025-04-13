import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import Button from '@/components/Button';
import UserAvatar from '@/components/UserAvatar';
import { ArrowLeft, MessageSquare } from 'lucide-react-native';
import { Database } from '@/lib/database.types';

type Application = Database['public']['Tables']['applications']['Row'] & {
  opportunity: Database['public']['Tables']['opportunities']['Row'] & {
    ngo: Database['public']['Tables']['ngo_profiles']['Row'] & {
      profile: Database['public']['Tables']['profiles']['Row']
    }
  },
  expert: Database['public']['Tables']['expert_profiles']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row']
  }
};

export default function ApplicationDetailScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  useEffect(() => {
    if (id) {
      loadApplicationData();
    }
  }, [id]);
  
  const loadApplicationData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch application with related data
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          opportunity:opportunities(
            *,
            ngo:ngo_profiles(
              *,
              profile:profiles(*)
            )
          ),
          expert:expert_profiles(
            *,
            profile:profiles(*)
          )
        `)
        .eq('id', id as string)
        .single();
      
      if (error) throw error;
      
      setApplication(data as Application);
      
      // Check permissions
      const isAuthorized = 
        (profile?.base?.role === 'expert' && profile.expert?.id === data.expert_id) ||
        (profile?.base?.role === 'ngo' && profile.ngo?.id === data.opportunity.ngo_id);
      
      if (!isAuthorized) {
        Alert.alert('Error', 'You do not have permission to view this application');
        router.back();
      }
    } catch (error) {
      console.error('Error loading application:', error);
      Alert.alert('Error', 'Failed to load application data');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdateStatus = async (newStatus: 'accepted' | 'rejected' | 'withdrawn') => {
    if (!application) return;
    
    const statusAction = newStatus === 'withdrawn' ? 'withdraw' : newStatus === 'accepted' ? 'accept' : 'reject';
    const confirmMessage = `Are you sure you want to ${statusAction} this application?`;
    
    Alert.alert(
      `${statusAction.charAt(0).toUpperCase() + statusAction.slice(1)} Application`,
      confirmMessage,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          style: newStatus === 'rejected' || newStatus === 'withdrawn' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              setIsUpdating(true);
              
              const { error } = await supabase
                .from('applications')
                .update({ status: newStatus })
                .eq('id', application.id);
              
              if (error) throw error;
              
              // If accepting, also update opportunity status
              if (newStatus === 'accepted') {
                const { error: opportunityError } = await supabase
                  .from('opportunities')
                  .update({ status: 'in_progress' })
                  .eq('id', application.opportunity.id);
                
                if (opportunityError) throw opportunityError;
              }
              
              // Refresh application data
              loadApplicationData();
              
              Alert.alert(
                'Status Updated',
                `Application has been ${newStatus}.`
              );
            } catch (error: any) {
              console.error('Error updating application status:', error);
              Alert.alert('Error', error.message || 'Failed to update application status');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };
  
  const handleMessageUser = () => {
    if (!application) return;
    
    const messageUserId = profile?.base?.role === 'expert' 
      ? application.opportunity.ngo.profile.id 
      : application.expert.profile.id;
    
    router.push(`/chat/${messageUserId}`);
  };
  
  const handleViewOpportunity = () => {
    if (!application) return;
    router.push(`/opportunity/${application.opportunity.id}`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  if (!application) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Application not found</Text>
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
  
  const isNGO = profile?.base?.role === 'ngo';
  const isExpert = profile?.base?.role === 'expert';
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: 'Application Details',
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
        <Card style={styles.headerCard}>
          <TouchableOpacity
            style={styles.opportunityRow}
            onPress={handleViewOpportunity}
          >
            <Text style={styles.opportunityLabel}>Opportunity:</Text>
            <Text style={styles.opportunityTitle}>{application.opportunity.title}</Text>
          </TouchableOpacity>
          
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>Status:</Text>
            <View style={[
              styles.statusBadge,
              application.status === 'pending' && styles.statusPending,
              application.status === 'accepted' && styles.statusAccepted,
              application.status === 'rejected' && styles.statusRejected,
              application.status === 'withdrawn' && styles.statusWithdrawn,
            ]}>
              <Text style={styles.statusText}>
                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <Text style={styles.dateText}>
            Applied on {formatDate(application.created_at)}
          </Text>
        </Card>
        
        <Card style={styles.userCard}>
          <Text style={styles.cardTitle}>
            {isNGO ? 'Applicant Information' : 'Organization Information'}
          </Text>
          
          <View style={styles.userContainer}>
            <UserAvatar
              uri={isNGO 
                ? application.expert.profile.avatar_url 
                : application.opportunity.ngo.profile.avatar_url}
              name={isNGO
                ? application.expert.profile.full_name
                : application.opportunity.ngo.organization_name}
              size={60}
            />
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {isNGO 
                  ? application.expert.profile.full_name
                  : application.opportunity.ngo.organization_name}
              </Text>
              {isNGO && (
                <View style={styles.tagsContainer}>
                  {application.expert.expertise_areas.map((expertise, index) => (
                    <View key={index} style={styles.tag}>
                      <Text style={styles.tagText}>{expertise}</Text>
                    </View>
                  ))}
                </View>
              )}
              {!isNGO && (
                <Text style={styles.userLocation}>
                  {application.opportunity.ngo.city}, {application.opportunity.ngo.country}
                </Text>
              )}
            </View>
          </View>
        </Card>
        
        <Card style={styles.messageCard}>
          <Text style={styles.cardTitle}>Application Message</Text>
          <Text style={styles.message}>
            {application.message || "No message provided."}
          </Text>
        </Card>
        
        <View style={styles.actionsContainer}>
          <Button
            title="Message"
            onPress={handleMessageUser}
            type="secondary"
            style={styles.actionButton}
          />
          
          {isNGO && application.status === 'pending' && (
            <View style={styles.ngoActions}>
              <Button
                title="Reject"
                onPress={() => handleUpdateStatus('rejected')}
                type="secondary"
                loading={isUpdating}
                style={[styles.actionButton, styles.rejectButton]}
                textStyle={styles.rejectButtonText}
              />
              <Button
                title="Accept"
                onPress={() => handleUpdateStatus('accepted')}
                loading={isUpdating}
                style={styles.actionButton}
              />
            </View>
          )}
          
          {isExpert && application.status === 'pending' && (
            <Button
              title="Withdraw Application"
              onPress={() => handleUpdateStatus('withdrawn')}
              type="secondary"
              loading={isUpdating}
              style={[styles.actionButton, styles.withdrawButton]}
            />
          )}
        </View>
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
  headerCard: {
    marginBottom: 16,
  },
  opportunityRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  opportunityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginRight: 8,
  },
  opportunityTitle: {
    fontSize: 16,
    color: '#4361ee',
    flex: 1,
    textDecorationLine: 'underline',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
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
    fontSize: 14,
    fontWeight: '600',
  },
  dateText: {
    fontSize: 14,
    color: '#6c757d',
  },
  userCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#212529',
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  userLocation: {
    fontSize: 14,
    color: '#6c757d',
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
    fontSize: 12,
    color: '#495057',
  },
  messageCard: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  actionButton: {
    marginBottom: 12,
  },
  ngoActions: {
    flexDirection: 'row',
  },
  rejectButton: {
    flex: 1,
    marginRight: 8,
    borderColor: '#dc3545',
  },
  rejectButtonText: {
    color: '#dc3545',
  },
  withdrawButton: {
    borderColor: '#dc3545',
  },
});