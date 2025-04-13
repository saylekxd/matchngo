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
import { MapPin, Calendar, DollarSign, ArrowLeft, MessageSquare, BookmarkPlus, BookmarkCheck } from 'lucide-react-native';
import Input from '@/components/Input';
import { Database } from '@/lib/database.types';

type Opportunity = Database['public']['Tables']['opportunities']['Row'] & {
  ngo: Database['public']['Tables']['ngo_profiles']['Row'] & {
    profile: Database['public']['Tables']['profiles']['Row']
  }
};

type Application = Database['public']['Tables']['applications']['Row'];

export default function OpportunityDetailScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [application, setApplication] = useState<Application | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  const [applicationMessage, setApplicationMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const isNGO = profile?.base?.role === 'ngo';
  const isExpert = profile?.base?.role === 'expert';
  const isOwner = isNGO && opportunity?.ngo_id === profile.ngo?.id;
  
  useEffect(() => {
    if (id) {
      loadOpportunityData();
    }
  }, [id]);
  
  const loadOpportunityData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch opportunity with NGO details
      const { data: opportunityData, error: opportunityError } = await supabase
        .from('opportunities')
        .select(`
          *,
          ngo:ngo_profiles(
            *,
            profile:profiles(*)
          )
        `)
        .eq('id', id as string)
        .single();
      
      if (opportunityError) throw opportunityError;
      setOpportunity(opportunityData as Opportunity);
      
      // If user is an expert, check if they've already applied
      if (isExpert && profile.expert?.id) {
        const { data: applicationData, error: applicationError } = await supabase
          .from('applications')
          .select('*')
          .eq('opportunity_id', id as string)
          .eq('expert_id', profile.expert.id)
          .maybeSingle();
        
        if (!applicationError && applicationData) {
          setApplication(applicationData);
        }
        
        // Check if opportunity is saved
        const { data: savedData, error: savedError } = await supabase
          .from('saved_opportunities')
          .select('*')
          .eq('opportunity_id', id as string)
          .eq('expert_id', profile.expert.id)
          .maybeSingle();
        
        if (!savedError && savedData) {
          setIsSaved(true);
        }
      }
    } catch (error) {
      console.error('Error loading opportunity:', error);
      Alert.alert('Error', 'Failed to load opportunity data');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleApply = () => {
    setShowApplicationForm(true);
  };
  
  const handleCancelApplication = () => {
    setShowApplicationForm(false);
    setApplicationMessage('');
  };
  
  const handleSubmitApplication = async () => {
    if (!applicationMessage.trim()) {
      Alert.alert('Error', 'Please include a message with your application');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('applications')
        .insert({
          opportunity_id: id as string,
          expert_id: profile?.expert?.id,
          message: applicationMessage,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) throw error;
      
      setApplication(data);
      setShowApplicationForm(false);
      setApplicationMessage('');
      
      Alert.alert(
        'Application Submitted',
        'Your application has been successfully submitted. You can check its status in your profile.'
      );
    } catch (error: any) {
      console.error('Error submitting application:', error);
      Alert.alert('Error', error.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleWithdrawApplication = async () => {
    Alert.alert(
      'Withdraw Application',
      'Are you sure you want to withdraw your application?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsSubmitting(true);
              
              const { error } = await supabase
                .from('applications')
                .update({ status: 'withdrawn' })
                .eq('id', application?.id);
              
              if (error) throw error;
              
              setApplication({
                ...application!,
                status: 'withdrawn',
              });
              
              Alert.alert(
                'Application Withdrawn',
                'Your application has been withdrawn successfully.'
              );
            } catch (error: any) {
              console.error('Error withdrawing application:', error);
              Alert.alert('Error', error.message || 'Failed to withdraw application');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };
  
  const handleSaveOpportunity = async () => {
    try {
      setIsSaving(true);
      
      if (isSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_opportunities')
          .delete()
          .eq('opportunity_id', id as string)
          .eq('expert_id', profile?.expert?.id);
        
        if (error) throw error;
        setIsSaved(false);
      } else {
        // Save
        const { error } = await supabase
          .from('saved_opportunities')
          .insert({
            opportunity_id: id as string,
            expert_id: profile?.expert?.id,
          });
        
        if (error) throw error;
        setIsSaved(true);
      }
    } catch (error: any) {
      console.error('Error saving opportunity:', error);
      Alert.alert('Error', error.message || 'Failed to save opportunity');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleMessageNGO = () => {
    if (opportunity?.ngo?.profile?.id) {
      router.push(`/chat/${opportunity.ngo.profile.id}`);
    }
  };
  
  const handleViewApplications = () => {
    router.push(`/opportunity/${id}/applications`);
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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
  
  if (!opportunity) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Opportunity not found</Text>
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
  
  const compensation = opportunity.compensation as any;
  
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
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{opportunity.title}</Text>
            <View style={[
              styles.statusBadge,
              opportunity.status === 'open' && styles.statusOpen,
              opportunity.status === 'in_progress' && styles.statusInProgress,
              opportunity.status === 'closed' && styles.statusClosed,
              opportunity.status === 'draft' && styles.statusDraft,
            ]}>
              <Text style={styles.statusText}>
                {opportunity.status === 'in_progress' ? 'In Progress' : 
                 opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
              </Text>
            </View>
          </View>
          
          <Card style={styles.ngoCard}>
            <TouchableOpacity 
              style={styles.ngoContainer}
              onPress={() => router.push(`/ngo/${opportunity.ngo_id}`)}
            >
              <UserAvatar
                uri={opportunity.ngo.profile.avatar_url}
                name={opportunity.ngo.organization_name}
                size={40}
              />
              <View style={styles.ngoInfo}>
                <Text style={styles.ngoName}>{opportunity.ngo.organization_name}</Text>
                <Text style={styles.ngoLocation}>{opportunity.ngo.city}, {opportunity.ngo.country}</Text>
              </View>
            </TouchableOpacity>
          </Card>
        </View>
        
        <Card style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.infoItem}>
            <MapPin size={20} color="#6c757d" />
            <Text style={styles.infoText}>{opportunity.location_name}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Calendar size={20} color="#6c757d" />
            <Text style={styles.infoText}>
              {formatDate(opportunity.start_date)} - {formatDate(opportunity.end_date)}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <DollarSign size={20} color="#6c757d" />
            <Text style={styles.infoText}>
              {compensation.type === 'paid' 
                ? `${compensation.currency || '$'}${compensation.amount} ${compensation.unit || ''}`
                : 'Volunteer'}
            </Text>
          </View>
        </Card>
        
        <Card style={styles.descriptionCard}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{opportunity.description}</Text>
        </Card>
        
        <Card style={styles.skillsCard}>
          <Text style={styles.sectionTitle}>Required Expertise</Text>
          <View style={styles.tagsContainer}>
            {opportunity.required_expertise.map((expertise, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{expertise}</Text>
              </View>
            ))}
          </View>
        </Card>
        
        {/* Show application status if already applied */}
        {application && (
          <Card style={styles.applicationStatusCard}>
            <Text style={styles.sectionTitle}>Your Application</Text>
            <View style={styles.applicationStatusContainer}>
              <Text style={styles.applicationStatusLabel}>Status:</Text>
              <View style={[
                styles.applicationStatusBadge,
                application.status === 'pending' && styles.statusPending,
                application.status === 'accepted' && styles.statusAccepted,
                application.status === 'rejected' && styles.statusRejected,
                application.status === 'withdrawn' && styles.statusWithdrawn,
              ]}>
                <Text style={styles.applicationStatusText}>
                  {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                </Text>
              </View>
            </View>
            
            {application.status === 'pending' && (
              <Button
                title="Withdraw Application"
                onPress={handleWithdrawApplication}
                type="secondary"
                loading={isSubmitting}
                style={styles.withdrawButton}
              />
            )}
          </Card>
        )}
        
        {/* Application form */}
        {showApplicationForm && (
          <Card style={styles.applicationFormCard}>
            <Text style={styles.sectionTitle}>Apply for this Opportunity</Text>
            <Input
              label="Application Message"
              value={applicationMessage}
              onChangeText={setApplicationMessage}
              placeholder="Explain why you're interested and how your skills match the requirements..."
              multiline
              numberOfLines={4}
            />
            <View style={styles.formButtons}>
              <Button
                title="Cancel"
                onPress={handleCancelApplication}
                type="secondary"
                style={styles.cancelButton}
              />
              <Button
                title="Submit"
                onPress={handleSubmitApplication}
                loading={isSubmitting}
                style={styles.submitButton}
              />
            </View>
          </Card>
        )}
        
        {/* Action buttons */}
        <View style={styles.actionsContainer}>
          {isExpert && opportunity.status === 'open' && !application && (
            <Button
              title="Apply"
              onPress={handleApply}
              style={styles.actionButton}
            />
          )}
          
          {isExpert && (
            <Button
              title={isSaved ? "Saved" : "Save"}
              onPress={handleSaveOpportunity}
              type="secondary"
              loading={isSaving}
              style={styles.actionButton}
              textStyle={styles.saveButtonText}
            />
          )}
          
          {!isOwner && (
            <Button
              title="Message"
              onPress={handleMessageNGO}
              type="secondary"
              style={styles.actionButton}
              textStyle={styles.messageButtonText}
            />
          )}
          
          {isOwner && (
            <Button
              title="View Applications"
              onPress={handleViewApplications}
              style={styles.actionButton}
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
  header: {
    marginBottom: 16,
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  statusOpen: {
    backgroundColor: '#e6f7e6',
  },
  statusInProgress: {
    backgroundColor: '#fff3cd',
  },
  statusClosed: {
    backgroundColor: '#f8d7da',
  },
  statusDraft: {
    backgroundColor: '#e9ecef',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ngoCard: {
    marginBottom: 16,
  },
  ngoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ngoInfo: {
    marginLeft: 12,
  },
  ngoName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
  },
  ngoLocation: {
    fontSize: 14,
    color: '#6c757d',
  },
  detailsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#495057',
  },
  descriptionCard: {
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
  },
  skillsCard: {
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: '#495057',
  },
  applicationStatusCard: {
    marginBottom: 16,
  },
  applicationStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  applicationStatusLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
    color: '#212529',
  },
  applicationStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
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
  applicationStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  withdrawButton: {
    marginTop: 8,
  },
  applicationFormCard: {
    marginBottom: 16,
  },
  formButtons: {
    flexDirection: 'row',
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  submitButton: {
    flex: 2,
    marginLeft: 8,
  },
  actionsContainer: {
    marginBottom: 40,
  },
  actionButton: {
    marginBottom: 12,
  },
  saveButtonText: {
    marginRight: 8,
  },
  messageButtonText: {
    marginRight: 8,
  },
  button: {
    marginTop: 16,
  },
});