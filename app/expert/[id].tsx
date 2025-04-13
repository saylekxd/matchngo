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
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import Card from '@/components/Card';
import Button from '@/components/Button';
import { ArrowLeft, MessageSquare, Star } from 'lucide-react-native';
import { Database } from '@/lib/database.types';

type ExpertProfile = Database['public']['Tables']['expert_profiles']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'],
  reviews: Array<Database['public']['Tables']['reviews']['Row']>
};

export default function ExpertProfileScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [expertProfile, setExpertProfile] = useState<ExpertProfile | null>(null);
  
  useEffect(() => {
    if (id) {
      loadExpertData();
    }
  }, [id]);
  
  const loadExpertData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch expert profile with reviews
      const { data, error } = await supabase
        .from('expert_profiles')
        .select(`
          *,
          profile:profiles(*),
          reviews:reviews(*)
        `)
        .eq('id', id as string)
        .single();
      
      if (error) throw error;
      setExpertProfile(data as ExpertProfile);
    } catch (error) {
      console.error('Error loading expert profile:', error);
      Alert.alert('Error', 'Failed to load expert profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMessage = () => {
    if (expertProfile?.profile?.id) {
      router.push(`/chat/${expertProfile.profile.id}`);
    }
  };
  
  const calculateAverageRating = () => {
    if (!expertProfile?.reviews?.length) return 0;
    
    const sum = expertProfile.reviews.reduce((acc, review) => acc + review.rating, 0);
    return (sum / expertProfile.reviews.length).toFixed(1);
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
  
  if (!expertProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.errorText}>Expert profile not found</Text>
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
            uri={expertProfile.profile.avatar_url}
            name={expertProfile.profile.full_name}
            size={80}
          />
          <Text style={styles.name}>{expertProfile.profile.full_name}</Text>
          
          {expertProfile.reviews && expertProfile.reviews.length > 0 && (
            <View style={styles.ratingContainer}>
              <Star size={16} color="#ffc107" fill="#ffc107" />
              <Text style={styles.ratingText}>
                {calculateAverageRating()} ({expertProfile.reviews.length} reviews)
              </Text>
            </View>
          )}
          
          {expertProfile.profile.bio && (
            <Text style={styles.bio}>{expertProfile.profile.bio}</Text>
          )}
          
          {profile?.base?.role === 'ngo' && (
            <Button
              title="Message"
              onPress={handleMessage}
              style={styles.messageButton}
            />
          )}
        </View>
        
        <Card style={styles.infoCard}>
          <Text style={styles.sectionTitle}>Areas of Expertise</Text>
          <View style={styles.tagsContainer}>
            {expertProfile.expertise_areas.map((expertise, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{expertise}</Text>
              </View>
            ))}
          </View>
        </Card>
        
        {expertProfile.reviews && expertProfile.reviews.length > 0 && (
          <Card style={styles.reviewsCard}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            {expertProfile.reviews.map((review, index) => (
              <View key={index} style={styles.reviewItem}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewRating}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        color="#ffc107"
                        fill={i < review.rating ? "#ffc107" : "none"}
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
                {index < expertProfile.reviews.length - 1 && (
                  <View style={styles.reviewDivider} />
                )}
              </View>
            ))}
          </Card>
        )}
        
        {expertProfile.education && (
          <Card style={styles.educationCard}>
            <Text style={styles.sectionTitle}>Education</Text>
            {Array.isArray((expertProfile.education as any)) && (expertProfile.education as any).map((edu: any, index: number) => (
              <View key={index} style={styles.educationItem}>
                <Text style={styles.educationDegree}>{edu.degree}</Text>
                <Text style={styles.educationSchool}>{edu.institution}</Text>
                <Text style={styles.educationYear}>{edu.year}</Text>
                {index < (expertProfile.education as any).length - 1 && (
                  <View style={styles.educationDivider} />
                )}
              </View>
            ))}
          </Card>
        )}
        
        {expertProfile.certifications && (
          <Card style={styles.certificationsCard}>
            <Text style={styles.sectionTitle}>Certifications</Text>
            {Array.isArray((expertProfile.certifications as any)) && (expertProfile.certifications as any).map((cert: any, index: number) => (
              <View key={index} style={styles.certificationItem}>
                <Text style={styles.certificationName}>{cert.name}</Text>
                <Text style={styles.certificationIssuer}>{cert.issuer}</Text>
                <Text style={styles.certificationYear}>{cert.year}</Text>
                {index < (expertProfile.certifications as any).length - 1 && (
                  <View style={styles.certificationDivider} />
                )}
              </View>
            ))}
          </Card>
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
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    fontSize: 14,
    color: '#495057',
    marginLeft: 4,
  },
  bio: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
    lineHeight: 22,
  },
  messageButton: {
    width: '100%',
  },
  infoCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#212529',
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
  reviewsCard: {
    marginBottom: 16,
  },
  reviewItem: {
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reviewRating: {
    flexDirection: 'row',
  },
  reviewDate: {
    fontSize: 12,
    color: '#6c757d',
  },
  reviewComment: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12,
  },
  educationCard: {
    marginBottom: 16,
  },
  educationItem: {
    marginBottom: 12,
  },
  educationDegree: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  educationSchool: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  educationYear: {
    fontSize: 14,
    color: '#6c757d',
  },
  educationDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12,
  },
  certificationsCard: {
    marginBottom: 40,
  },
  certificationItem: {
    marginBottom: 12,
  },
  certificationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  certificationIssuer: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 2,
  },
  certificationYear: {
    fontSize: 14,
    color: '#6c757d',
  },
  certificationDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 12,
  },
});