import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Input from '@/components/Input';
import Button from '@/components/Button';
import DatePicker from '@/components/DatePicker';
import CompensationSelector from '@/components/CompensationSelector';
import ExpertiseTags from '@/components/ExpertiseTags';
import { CalendarPlus, X, ArrowLeft } from 'lucide-react-native';
import { router, Stack } from 'expo-router';

// Form validation
const validateForm = (formData: {
  title: string;
  description: string;
  locationName: string;
  startDate: string;
  endDate: string;
  compensationType: 'paid' | 'volunteer';
  compensationAmount: string;
  requiredExpertise: string[];
}) => {
  const { 
    title, 
    description, 
    locationName, 
    startDate, 
    endDate, 
    compensationType, 
    compensationAmount, 
    requiredExpertise 
  } = formData;
  
  const errors: Record<string, string> = {};
  
  if (!title.trim()) {
    errors.title = 'Title is required';
  }
  
  if (!description.trim()) {
    errors.description = 'Description is required';
  }
  
  if (!locationName.trim()) {
    errors.locationName = 'Location is required';
  }
  
  if (!startDate.trim()) {
    errors.startDate = 'Start date is required';
  }
  
  if (!endDate.trim()) {
    errors.endDate = 'End date is required';
  }
  
  // Validate that end date is after start date
  if (startDate && endDate) {
    const startDateTime = new Date(startDate);
    const endDateTime = new Date(endDate);
    if (startDateTime > endDateTime) {
      errors.endDate = 'End date/time must be after start date/time';
    }
  }
  
  // Validate compensation
  if (compensationType === 'paid' && !compensationAmount.trim()) {
    errors.compensationAmount = 'Amount is required for paid opportunities';
  }
  
  if (requiredExpertise.length === 0) {
    errors.requiredExpertise = 'At least one expertise area is required';
  }
  
  return errors;
};

export default function CreateOpportunityScreen() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [locationName, setLocationName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [compensationType, setCompensationType] = useState<'paid' | 'volunteer'>('paid');
  const [compensationAmount, setCompensationAmount] = useState('');
  const [compensationCurrency, setCompensationCurrency] = useState('USD');
  const [requiredExpertise, setRequiredExpertise] = useState<string[]>([]);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const handleCreateOpportunity = async () => {
    // Validate form
    const formErrors = validateForm({
      title,
      description,
      locationName,
      startDate,
      endDate,
      compensationType,
      compensationAmount,
      requiredExpertise
    });
    
    setErrors(formErrors);
    
    if (Object.keys(formErrors).length > 0) {
      return;
    }
    
    try {
      setIsLoading(true);
      
      if (!profile?.ngo?.id) {
        throw new Error('NGO profile not found');
      }
      
      // Prepare compensation data
      const compensation = compensationType === 'paid' 
        ? { 
            type: 'paid', 
            amount: parseFloat(compensationAmount), 
            currency: compensationCurrency,
            unit: 'total' 
          }
        : { type: 'volunteer' };
      
      // Create opportunity
      const { data, error } = await supabase
        .from('opportunities')
        .insert({
          ngo_id: profile.ngo.id,
          title,
          description,
          required_expertise: requiredExpertise,
          location: { latitude: 0, longitude: 0 }, // Default location for now
          location_name: locationName,
          start_date: startDate,
          end_date: endDate,
          compensation,
          status: 'open', // Default to open
        })
        .select()
        .single();
      
      if (error) throw error;
      
      Alert.alert(
        'Success',
        'Opportunity created successfully',
        [
          {
            text: 'OK',
            onPress: () => router.push(`/opportunity/${data.id}`),
          },
        ]
      );
    } catch (error: any) {
      console.error('Error creating opportunity:', error);
      Alert.alert('Error', error.message || 'Failed to create opportunity');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Show unauthorized view for non-NGO users
  if (profile?.base?.role !== 'ngo') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.notAuthorizedText}>
            Only NGO accounts can create opportunities.
          </Text>
          <Button
            title="Go Back"
            onPress={() => router.back()}
            type="secondary"
            style={styles.goBackButton}
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
          title: "Create Opportunity",
          headerBackTitle: "Back",
        }}
      />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.pageTitle}>Create New Opportunity</Text>
          
          <Input
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a title for your opportunity"
            error={errors.title}
          />
          
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the opportunity, required skills, and expectations"
            multiline
            numberOfLines={4}
            error={errors.description}
          />
          
          <Input
            label="Location"
            value={locationName}
            onChangeText={setLocationName}
            placeholder="Enter the location (e.g., City, Country)"
            error={errors.locationName}
          />
          
          <View style={styles.dateContainer}>
            <DatePicker
              label="Start Date & Time"
              value={startDate}
              onChangeDate={setStartDate}
              placeholder="Select start date"
              containerStyle={styles.dateInput}
              error={errors.startDate}
              showTime
            />
            
            <DatePicker
              label="End Date & Time"
              value={endDate}
              onChangeDate={setEndDate}
              placeholder="Select end date"
              containerStyle={styles.dateInput}
              minDate={startDate ? new Date(startDate) : undefined}
              error={errors.endDate}
              showTime
            />
          </View>
          
          <CompensationSelector
            compensationType={compensationType}
            onTypeChange={setCompensationType}
            amount={compensationAmount}
            onAmountChange={setCompensationAmount}
            currency={compensationCurrency}
            onCurrencyChange={setCompensationCurrency}
            amountError={errors.compensationAmount}
          />
          
          <ExpertiseTags
            tags={requiredExpertise}
            onTagsChange={setRequiredExpertise}
            error={errors.requiredExpertise}
          />
          
          <View style={styles.buttonsContainer}>
            <Button
              title="Create Opportunity"
              onPress={handleCreateOpportunity}
              loading={isLoading}
              style={styles.submitButton}
            />
            
            <Button
              title="Cancel"
              onPress={() => router.back()}
              type="secondary"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#212529',
  },
  notAuthorizedText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 24,
    color: '#6c757d',
  },
  goBackButton: {
    margin: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    width: '48%',
  },
  buttonsContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  submitButton: {
    marginBottom: 16,
  },
}); 