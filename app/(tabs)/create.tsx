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
import { CalendarPlus, X } from 'lucide-react-native';
import { router } from 'expo-router';

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
  const [expertiseInput, setExpertiseInput] = useState('');
  const [requiredExpertise, setRequiredExpertise] = useState<string[]>([]);
  
  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!locationName.trim()) {
      newErrors.locationName = 'Location is required';
    }
    
    // Validate dates
    if (!startDate.trim()) {
      newErrors.startDate = 'Start date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      newErrors.startDate = 'Invalid date format (YYYY-MM-DD)';
    }
    
    if (!endDate.trim()) {
      newErrors.endDate = 'End date is required';
    } else if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      newErrors.endDate = 'Invalid date format (YYYY-MM-DD)';
    }
    
    // Validate that end date is after start date
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }
    
    // Validate compensation
    if (compensationType === 'paid' && !compensationAmount.trim()) {
      newErrors.compensationAmount = 'Amount is required for paid opportunities';
    }
    
    if (requiredExpertise.length === 0) {
      newErrors.requiredExpertise = 'At least one expertise area is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleAddExpertise = () => {
    if (expertiseInput.trim()) {
      setRequiredExpertise([...requiredExpertise, expertiseInput.trim()]);
      setExpertiseInput('');
    }
  };
  
  const handleRemoveExpertise = (index: number) => {
    const newExpertise = [...requiredExpertise];
    newExpertise.splice(index, 1);
    setRequiredExpertise(newExpertise);
  };
  
  const handleCreateOpportunity = async () => {
    if (!validateForm()) return;
    
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
  
  if (profile?.base?.role !== 'ngo') {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.notAuthorizedText}>
            Only NGO accounts can create opportunities.
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.safeArea}>
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
            <Input
              label="Start Date (YYYY-MM-DD)"
              value={startDate}
              onChangeText={setStartDate}
              placeholder="YYYY-MM-DD"
              containerStyle={styles.dateInput}
              error={errors.startDate}
            />
            
            <Input
              label="End Date (YYYY-MM-DD)"
              value={endDate}
              onChangeText={setEndDate}
              placeholder="YYYY-MM-DD"
              containerStyle={styles.dateInput}
              error={errors.endDate}
            />
          </View>
          
          <Text style={styles.label}>Compensation</Text>
          <View style={styles.compensationTypeContainer}>
            <TouchableOpacity
              style={[
                styles.compensationTypeButton,
                compensationType === 'paid' && styles.compensationTypeButtonActive,
              ]}
              onPress={() => setCompensationType('paid')}
            >
              <Text
                style={[
                  styles.compensationTypeText,
                  compensationType === 'paid' && styles.compensationTypeTextActive,
                ]}
              >
                Paid
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.compensationTypeButton,
                compensationType === 'volunteer' && styles.compensationTypeButtonActive,
              ]}
              onPress={() => setCompensationType('volunteer')}
            >
              <Text
                style={[
                  styles.compensationTypeText,
                  compensationType === 'volunteer' && styles.compensationTypeTextActive,
                ]}
              >
                Volunteer
              </Text>
            </TouchableOpacity>
          </View>
          
          {compensationType === 'paid' && (
            <View style={styles.compensationContainer}>
              <Input
                label="Amount"
                value={compensationAmount}
                onChangeText={setCompensationAmount}
                placeholder="Enter amount"
                keyboardType="numeric"
                containerStyle={styles.compensationInput}
                error={errors.compensationAmount}
              />
              
              <Input
                label="Currency"
                value={compensationCurrency}
                onChangeText={setCompensationCurrency}
                placeholder="USD"
                containerStyle={styles.currencyInput}
              />
            </View>
          )}
          
          <View style={styles.expertiseContainer}>
            <Text style={styles.label}>Required Expertise</Text>
            
            <View style={styles.expertiseInputContainer}>
              <Input
                value={expertiseInput}
                onChangeText={setExpertiseInput}
                placeholder="Add required expertise (e.g., Web Development)"
                containerStyle={styles.expertiseInput}
              />
              <Button
                title="Add"
                onPress={handleAddExpertise}
                type="secondary"
                style={styles.addButton}
              />
            </View>
            
            {requiredExpertise.length > 0 ? (
              <View style={styles.expertiseTagsContainer}>
                {requiredExpertise.map((expertise, index) => (
                  <View key={index} style={styles.expertiseTag}>
                    <Text style={styles.expertiseTagText}>{expertise}</Text>
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
            
            {errors.requiredExpertise && (
              <Text style={styles.errorText}>{errors.requiredExpertise}</Text>
            )}
          </View>
          
          <View style={styles.buttonsContainer}>
            <Button
              title="Create Opportunity"
              onPress={handleCreateOpportunity}
              loading={isLoading}
              style={styles.submitButton}
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
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateInput: {
    width: '48%',
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  compensationTypeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  compensationTypeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
  },
  compensationTypeButtonActive: {
    backgroundColor: '#4361ee',
    borderColor: '#4361ee',
  },
  compensationTypeText: {
    fontWeight: '600',
    color: '#495057',
  },
  compensationTypeTextActive: {
    color: '#ffffff',
  },
  compensationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  compensationInput: {
    width: '70%',
  },
  currencyInput: {
    width: '28%',
  },
  expertiseContainer: {
    marginTop: 16,
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
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 8,
  },
  buttonsContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  submitButton: {
    marginBottom: 16,
  },
});