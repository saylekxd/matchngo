import React, { useState } from 'react';
import { StyleSheet, View, Text, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import Input from '@/components/Input';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loginError, setLoginError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    
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
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    setLoginError(null);
    if (!validate()) return;
    
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Check for specific error types
      if (error.message?.includes('invalid_credentials')) {
        setLoginError('Invalid email or password. Please try again.');
      } else if (error.message?.includes('tables not set up')) {
        setLoginError('System setup issue. Please contact support.');
      } else {
        setLoginError(error.message || 'Login failed. Please check your credentials and try again.');
      }
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Welcome Back</Text>
            <Text style={styles.subtitle}>Sign in to your account</Text>
          </View>
          
          {/* Display login error messages */}
          {loginError && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorBannerText}>{loginError}</Text>
            </View>
          )}
          
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setLoginError(null);
              }}
              placeholder="Enter your email"
              autoCapitalize="none"
              keyboardType="email-address"
              error={errors.email}
            />
            
            <Input
              label="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setLoginError(null);
              }}
              placeholder="Enter your password"
              secureTextEntry
              error={errors.password}
            />
            
            <TouchableOpacity 
              style={styles.forgotPassword}
              onPress={() => Alert.alert('Reset Password', 'This feature will be available soon.')}
            >
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>
            
            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              style={styles.button}
            />
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.replace('/auth/signup')}>
              <Text style={styles.footerLink}>Sign Up</Text>
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
    marginTop: 40,
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    color: '#212529',
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
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
  form: {
    marginBottom: 24,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: '#4361ee',
    fontSize: 14,
  },
  button: {
    marginTop: 16,
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