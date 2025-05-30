import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuth } from '@/context/AuthContext';

export default function SignupScreen() {
  const { signUp, isLoading } = useAuth();
  
  // Form state with multi-step flow
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'ngo' | 'expert' | null>(null);
  
  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  
  // NGO specific fields
  const [organizationName, setOrganizationName] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  
  // Expert specific fields
  const [expertiseInput, setExpertiseInput] = useState('');
  const [expertiseAreas, setExpertiseAreas] = useState<string[]>([]);
  
  // Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signupError, setSignupError] = useState<string | null>(null);
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!userType) {
      newErrors.userType = 'Please select a user type';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!fullName) {
      newErrors.fullName = 'Full name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep3 = () => {
    const newErrors: Record<string, string> = {};
    
    if (userType === 'ngo') {
      if (!organizationName) {
        newErrors.organizationName = 'Organization name is required';
      }
      
      if (!country) {
        newErrors.country = 'Country is required';
      }
      
      if (!city) {
        newErrors.city = 'City is required';
      }
    } else if (userType === 'expert') {
      if (expertiseAreas.length === 0) {
        newErrors.expertiseAreas = 'At least one expertise area is required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    setSignupError(null);
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };
  
  const handleBack = () => {
    setSignupError(null);
    if (step > 1) {
      setStep(step - 1);
    }
  };
  
  const handleAddExpertise = () => {
    if (expertiseInput.trim()) {
      setExpertiseAreas([...expertiseAreas, expertiseInput.trim()]);
      setExpertiseInput('');
    }
  };
  
  const handleRemoveExpertise = (index: number) => {
    const newAreas = [...expertiseAreas];
    newAreas.splice(index, 1);
    setExpertiseAreas(newAreas);
  };
  
  const handleSignup = async () => {
    setSignupError(null);
    if (!validateStep3()) return;
    
    try {
      // Prepare the user info based on the user type
      const userInfo = {
        role: userType,
        fullName,
      };
      
      if (userType === 'ngo') {
        Object.assign(userInfo, {
          organizationName,
          country,
          city,
        });
      } else if (userType === 'expert') {
        Object.assign(userInfo, {
          expertiseAreas,
        });
      }
      
      await signUp(email, password, userInfo);
      
      // Show success message and navigate to login
      Alert.alert(
        'Account Created',
        'Your account has been created successfully. Please log in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/auth/login'),
          },
        ]
      );
    } catch (error: any) {
      console.error('Signup error:', error);
      
      // Check for specific error messages
      if (error.message?.includes('rate limit')) {
        setSignupError('Too many signup attempts. Please wait a minute before trying again.');
      } else if (error.message?.includes('tables not set up')) {
        setSignupError('System setup issue. Please contact support.');
      } else if (error.message?.includes('duplicate key')) {
        setSignupError('An account with this email already exists.');
      } else {
        setSignupError(error.message || 'An error occurred during signup. Please try again.');
      }
    }
  };
  
  // Render functions for each step
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Who are you?</Text>
      <Text style={styles.stepDescription}>Choose your account type</Text>
      
      <View style={styles.optionsContainer}>
        <TouchableOpacity
          style={[
            styles.optionCard,
            userType === 'ngo' && styles.optionCardSelected,
          ]}
          onPress={() => setUserType('ngo')}
        >
          <Text style={styles.optionTitle}>NGO</Text>
          <Text style={styles.optionDescription}>
            I represent an organization looking for expert help
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.optionCard,
            userType === 'expert' && styles.optionCardSelected,
          ]}
          onPress={() => setUserType('expert')}
        >
          <Text style={styles.optionTitle}>Expert</Text>
          <Text style={styles.optionDescription}>
            I'm a specialist looking to help organizations
          </Text>
        </TouchableOpacity>
      </View>
      
      {errors.userType && <Text style={styles.errorText}>{errors.userType}</Text>}
      
      <Button
        title="Continue"
        onPress={handleNextStep}
        style={styles.button}
      />
    </View>
  );
  
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Create your account</Text>
      <Text style={styles.stepDescription}>Fill in your basic information</Text>
      
      <Input
        label="Full Name"
        value={fullName}
        onChangeText={setFullName}
        placeholder="Enter your full name"
        error={errors.fullName}
      />
      
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      
      <Input
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="Create a password"
        secureTextEntry
        error={errors.password}
      />
      
      <Input
        label="Confirm Password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        placeholder="Confirm your password"
        secureTextEntry
        error={errors.confirmPassword}
      />
      
      <View style={styles.buttonGroup}>
        <Button
          title="Back"
          onPress={handleBack}
          type="secondary"
          style={styles.backButton}
        />
        <Button
          title="Continue"
          onPress={handleNextStep}
          style={styles.continueButton}
        />
      </View>
    </View>
  );
  
  const renderNGOFields = () => (
    <>
      <Input
        label="Organization Name"
        value={organizationName}
        onChangeText={setOrganizationName}
        placeholder="Enter your organization's name"
        error={errors.organizationName}
      />
      
      <Input
        label="Country"
        value={country}
        onChangeText={setCountry}
        placeholder="Enter your country"
        error={errors.country}
      />
      
      <Input
        label="City"
        value={city}
        onChangeText={setCity}
        placeholder="Enter your city"
        error={errors.city}
      />
    </>
  );
  
  const renderExpertFields = () => (
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
                <Text style={styles.removeTagButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
      
      {errors.expertiseAreas && (
        <Text style={styles.errorText}>{errors.expertiseAreas}</Text>
      )}
    </View>
  );
  
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Complete your profile</Text>
      <Text style={styles.stepDescription}>
        {userType === 'ngo'
          ? 'Tell us about your organization'
          : 'Tell us about your expertise'}
      </Text>
      
      {userType === 'ngo' ? renderNGOFields() : renderExpertFields()}
      
      <View style={styles.buttonGroup}>
        <Button
          title="Back"
          onPress={handleBack}
          type="secondary"
          style={styles.backButton}
        />
        <Button
          title="Sign Up"
          onPress={handleSignup}
          loading={isLoading}
          style={styles.continueButton}
        />
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.stepIndicatorContainer}>
              {[1, 2, 3].map((stepNumber) => (
                <View
                  key={stepNumber}
                  style={[
                    styles.stepIndicator,
                    step === stepNumber && styles.stepIndicatorActive,
                    step > stepNumber && styles.stepIndicatorCompleted,
                  ]}
                >
                  <Text
                    style={[
                      styles.stepIndicatorText,
                      (step === stepNumber || step > stepNumber) &&
                        styles.stepIndicatorTextActive,
                    ]}
                  >
                    {stepNumber}
                  </Text>
                </View>
              ))}
            </View>
          </View>
          
          {/* Display signup error messages */}
          {signupError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorBannerText}>{signupError}</Text>
            </View>
          )}
          
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')}>
              <Text style={styles.footerLink}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 30,
    alignItems: 'center',
  },
  stepIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  stepIndicator: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#ced4da',
  },
  stepIndicatorActive: {
    backgroundColor: '#4361ee',
    borderColor: '#4361ee',
  },
  stepIndicatorCompleted: {
    backgroundColor: '#4361ee',
    borderColor: '#4361ee',
  },
  stepIndicatorText: {
    fontWeight: '600',
    color: '#6c757d',
  },
  stepIndicatorTextActive: {
    color: '#ffffff',
  },
  stepContainer: {
    width: '100%',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    color: '#212529',
  },
  stepDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ced4da',
    backgroundColor: '#ffffff',
  },
  optionCardSelected: {
    borderColor: '#4361ee',
    backgroundColor: '#eef1ff',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#212529',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  button: {
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderColor: '#f5c2c7',
    borderWidth: 1,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorBannerText: {
    color: '#842029',
    fontWeight: '500',
    textAlign: 'center',
  },
  buttonGroup: {
    flexDirection: 'row',
    marginTop: 24,
  },
  backButton: {
    flex: 1,
    marginRight: 8,
  },
  continueButton: {
    flex: 2,
    marginLeft: 8,
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  expertiseContainer: {
    marginBottom: 16,
  },
  expertiseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ced4da',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeTagButtonText: {
    color: '#495057',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingVertical: 20,
  },
  footerText: {
    color: '#6c757d',
    marginRight: 4,
  },
  footerLink: {
    color: '#4361ee',
    fontWeight: '600',
  },
});