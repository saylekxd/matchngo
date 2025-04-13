import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View, Text } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { checkDatabaseSetup } from '@/lib/supabase';
import Button from '@/components/Button';

export default function Root() {
  const { session, isLoading } = useAuth();
  const [databaseChecked, setDatabaseChecked] = useState(false);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [checkingDb, setCheckingDb] = useState(true);

  useEffect(() => {
    // Check if the database is set up properly
    const checkDb = async () => {
      setCheckingDb(true);
      try {
        const isReady = await checkDatabaseSetup();
        setDatabaseReady(isReady);
      } catch (error) {
        console.error('Database check error:', error);
        setDatabaseReady(false);
      } finally {
        setDatabaseChecked(true);
        setCheckingDb(false);
      }
    };

    checkDb();
  }, []);

  // Retry database setup check
  const handleRetryCheck = () => {
    setDatabaseChecked(false);
    setCheckingDb(true);
    checkDatabaseSetup()
      .then(isReady => {
        setDatabaseReady(isReady);
      })
      .catch(error => {
        console.error('Database check error:', error);
        setDatabaseReady(false);
      })
      .finally(() => {
        setDatabaseChecked(true);
        setCheckingDb(false);
      });
  };

  if (isLoading || !databaseChecked || checkingDb) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4361ee" />
        <Text style={styles.loadingText}>
          {!databaseChecked ? 'Checking database setup...' : 'Loading...'}
        </Text>
      </View>
    );
  }

  // If database is not set up, show an error message
  if (!databaseReady) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Database Setup Required</Text>
        <Text style={styles.errorText}>
          The database tables for this application have not been set up properly. 
          The SQL migrations need to be run to create the necessary tables.
        </Text>
        <Button
          title="Retry Check"
          onPress={handleRetryCheck}
          style={styles.retryButton}
        />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(tabs)" />;
  } else {
    return <Redirect href="/onboarding" />;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 30,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#dc3545',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#495057',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    width: '100%',
    maxWidth: 300,
  },
});