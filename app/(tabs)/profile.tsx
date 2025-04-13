import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import Card from '@/components/Card';
import Input from '@/components/Input';
import Button from '@/components/Button';
import { LogOut, CreditCard as Edit, Save, X, PlusCircle } from 'lucide-react-native';
import { router } from 'expo-router';

export default function ProfileScreen() {
  const { profile, signOut, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // Edit form states
  const [fullName, setFullName] = useState(profile?.base?.full_name || '');
  const [bio, setBio] = useState(profile?.base?.bio || '');
  
  // NGO specific fields
  const [organizationName, setOrganizationName] = useState(profile?.ngo?.organization_name || '');
  const [website, setWebsite] = useState(profile?.ngo?.website || '');
  const [missionStatement, setMissionStatement] = useState(profile?.ngo?.mission_statement || '');
  
  // Expert specific fields
  const [expertiseInput, setExpertiseInput] = useState('');
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>(
    profile?.expert?.expertise_areas || []
  );
  
  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      console.error('Error signing out:', error);
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleStartEditing = () => {
    setIsEditing(true);
  };
  
  const handleCancelEditing = () => {
    // Reset form values
    setFullName(profile?.base?.full_name || '');
    setBio(profile?.base?.bio || '');
    setOrganizationName(profile?.ngo?.organization_name || '');
    setWebsite(profile?.ngo?.website || '');
    setMissionStatement(profile?.ngo?.mission_statement || '');
    setExpertiseAreas(profile?.expert?.expertise_areas || []);
    
    setIsEditing(false);
  };
  
  const handleAddExpertise = () => {
    if (expertiseInput.trim()) {
      setExpertiseAreas([...expertiseAreas, expertiseInput.trim()]);
      setExpertiseInput('');
    }
  };
  
  const handleRemoveExpertise = (index: number) => {
    const newExpertise = [...expertiseAreas];
    newExpertise.splice(index, 1);
    setExpertiseAreas(newExpertise);
  };

  const navigateToCreateOpportunity = () => {
    router.push('/create');
  };
  
  const handleSaveProfile = async () => {
    try {
      setIsLoading(true);
      
      // Update base profile
      if (profile?.base?.id) {
        const { error: baseError } = await supabase
          .from('profiles')
          .update({
            full_name: fullName,
            bio,
          })
          .eq('id', profile.base.id);
        
        if (baseError) throw baseError;
      }
      
      // Update role-specific profile
      if (profile?.base?.role === 'ngo' && profile.ngo?.id) {
        const { error: ngoError } = await supabase
          .from('ngo_profiles')
          .update({
            organization_name: organizationName,
            website,
            mission_statement: missionStatement,
          })
          .eq('id', profile.ngo.id);
        
        if (ngoError) throw ngoError;
      } else if (profile?.base?.role === 'expert' && profile.expert?.id) {
        const { error: expertError } = await supabase
          .from('expert_profiles')
          .update({
            expertise_areas: expertiseAreas,
          })
          .eq('id', profile.expert.id);
        
        if (expertError) throw expertError;
      }
      
      // Refresh profile data
      await refreshProfile();
      
      Alert.alert('Success', 'Profile updated successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderProfileView = () => (
    <View style={styles.profileContainer}>
      <View style={styles.header}>
        <UserAvatar
          uri={profile?.base?.avatar_url}
          name={profile?.base?.full_name || ''}
          size={80}
        />
        <View style={styles.headerText}>
          <Text style={styles.name}>{profile?.base?.full_name}</Text>
          <Text style={styles.role}>
            {profile?.base?.role === 'ngo' ? 'NGO' : 'Expert'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.editButton}
          onPress={handleStartEditing}
        >
          <Edit size={20} color="#4361ee" />
        </TouchableOpacity>
      </View>
      
      {profile?.base?.bio && (
        <Text style={styles.bio}>{profile.base.bio}</Text>
      )}
      
      {profile?.base?.role === 'ngo' && profile.ngo && (
        <>
          <Card style={styles.infoCard}>
            <Text style={styles.cardTitle}>Organization Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Organization:</Text>
              <Text style={styles.infoValue}>{profile.ngo.organization_name}</Text>
            </View>
            
            {profile.ngo.website && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Website:</Text>
                <Text style={styles.infoValue}>{profile.ngo.website}</Text>
              </View>
            )}
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location:</Text>
              <Text style={styles.infoValue}>{profile.ngo.city}, {profile.ngo.country}</Text>
            </View>
            
            {profile.ngo.mission_statement && (
              <View style={styles.infoSection}>
                <Text style={styles.infoLabel}>Mission Statement:</Text>
                <Text style={styles.infoValue}>{profile.ngo.mission_statement}</Text>
              </View>
            )}
          </Card>

          <Button
            title="Create New Opportunity"
            onPress={navigateToCreateOpportunity}
            style={styles.createButton}
          />
        </>
      )}
      
      {profile?.base?.role === 'expert' && profile.expert && (
        <Card style={styles.infoCard}>
          <Text style={styles.cardTitle}>Expertise Information</Text>
          
          <View style={styles.infoSection}>
            <Text style={styles.infoLabel}>Areas of Expertise:</Text>
            <View style={styles.tagsContainer}>
              {profile.expert.expertise_areas.map((expertise, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{expertise}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>
      )}
      
      <Button
        title="Sign Out"
        onPress={handleSignOut}
        type="secondary"
        loading={isLoading}
        style={styles.signOutButton}
      />
    </View>
  );
  
  const renderEditForm = () => (
    <View style={styles.editContainer}>
      <Text style={styles.editTitle}>Edit Profile</Text>
      
      <Input
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Enter your full name"
      />
      
      <Input
        label="Bio"
        value={bio}
        onChangeText={setBio}
        placeholder="Tell us about yourself"
        multiline
        numberOfLines={3}
      />
      
      {profile?.base?.role === 'ngo' && (
        <>
          <Input
            label="Organization Name"
            value={organizationName}
            onChangeText={setOrganizationName}
            placeholder="Enter your organization's name"
          />
          
          <Input
            label="Website"
            value={website}
            onChangeText={setWebsite}
            placeholder="Enter your website URL"
          />
          
          <Input
            label="Mission Statement"
            value={missionStatement}
            onChangeText={setMissionStatement}
            placeholder="Describe your organization's mission"
            multiline
            numberOfLines={3}
          />
        </>
      )}
      
      {profile?.base?.role === 'expert' && (
        <View style={styles.expertiseContainer}>
          <Text style={styles.label}>Areas of Expertise</Text>
          
          <View style={styles.expertiseInputContainer}>
            <Input
              value={expertiseInput}
              onChangeText={setExpertiseInput}
              placeholder="Add your expertise (e.g., Web Development)"
              containerStyle={styles.expertiseInput}
            />
            <Button
              title="Add"
              onPress={handleAddExpertise}
              type="secondary"
              style={styles.addButton}
            />
          </View>
          
          {expertiseAreas.length > 0 ? (
            <View style={styles.expertiseTagsContainer}>
              {expertiseAreas.map((area, index) => (
                <View key={index} style={styles.expertiseTag}>
                  <Text style={styles.expertiseTagText}>{area}</Text>
                  <TouchableOpacity
                    style={styles.removeTagButton}
                    onPress={() => handleRemoveExpertise(index)}
                  >
                    <X size={14} color="#495057" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      )}
      
      <View style={styles.editButtons}>
        <Button
          title="Cancel"
          onPress={handleCancelEditing}
          type="secondary"
          style={styles.cancelButton}
        />
        <Button
          title="Save"
          onPress={handleSaveProfile}
          loading={isLoading}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {isEditing ? renderEditForm() : renderProfileView()}
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
  },
  contentContainer: {
    padding: 16,
  },
  profileContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    marginLeft: 16,
    flex: 1,
  },
  name: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 4,
  },
  role: {
    fontSize: 16,
    color: '#6c757d',
    textTransform: 'capitalize',
  },
  editButton: {
    padding: 8,
  },
  bio: {
    fontSize: 16,
    color: '#495057',
    marginBottom: 24,
    lineHeight: 22,
  },
  infoCard: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    color: '#212529',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoSection: {
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: '600',
    color: '#495057',
    marginRight: 8,
    marginBottom: 4,
  },
  infoValue: {
    color: '#212529',
    flex: 1,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
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
  createButton: {
    marginBottom: 24,
  },
  signOutButton: {
    marginTop: 24,
  },
  editContainer: {
    flex: 1,
  },
  editTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 24,
    color: '#212529',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  expertiseContainer: {
    marginBottom: 16,
  },
  expertiseInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  expertiseInput: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  addButton: {
    height: 50,
  },
  expertiseTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  expertiseTag: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  expertiseTagText: {
    fontSize: 14,
    color: '#495057',
    marginRight: 6,
  },
  removeTagButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButtons: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
  saveButton: {
    flex: 2,
    marginLeft: 8,
  },
});