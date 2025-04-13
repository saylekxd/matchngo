import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { router } from 'expo-router';
import Button from '@/components/Button';
import { ArrowRight } from 'lucide-react-native';

export default function OnboardingScreen() {
  const [currentPage, setCurrentPage] = useState(0);
  const totalPages = 3;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      router.replace('/auth/signup');
    }
  };

  const handleSkip = () => {
    router.replace('/auth/login');
  };
  
  const renderPage = () => {
    switch (currentPage) {
      case 0:
        return (
          <>
            <Text style={styles.title}>Connect with Purpose</Text>
            <Text style={styles.description}>
              Join a network that brings together NGOs and specialists to create meaningful impact around the world.
            </Text>
          </>
        );
      case 1:
        return (
          <>
            <Text style={styles.title}>NGOs Find Expertise</Text>
            <Text style={styles.description}>
              Post opportunities, find qualified experts, and collaborate on projects that further your mission.
            </Text>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.title}>Experts Share Skills</Text>
            <Text style={styles.description}>
              Apply your specialized knowledge where it's needed most and build a portfolio of impactful work.
            </Text>
          </>
        );
      default:
        return null;
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
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
          >
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
          
          <View style={styles.pageContent}>
            {renderPage()}
          </View>
          
          <View style={styles.footer}>
            <View style={styles.pagination}>
              {Array.from({ length: totalPages }).map((_, index) => (
                <View 
                  key={index} 
                  style={[
                    styles.paginationDot,
                    index === currentPage && styles.paginationDotActive
                  ]} 
                />
              ))}
            </View>
            
            <Button
              title="Continue"
              onPress={handleNext}
              style={styles.button}
              textStyle={styles.buttonText}
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
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 10,
  },
  skipText: {
    fontSize: 16,
    color: '#6c757d',
  },
  pageContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: '#212529',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#6c757d',
    marginBottom: 40,
    lineHeight: 24,
  },
  footer: {
    marginTop: 20,
    paddingBottom: 20,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  paginationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#e9ecef',
    marginHorizontal: 5,
  },
  paginationDotActive: {
    backgroundColor: '#4361ee',
    width: 20,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    marginRight: 10,
  },
});