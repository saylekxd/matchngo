import React from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle
} from 'react-native';
import Input from './Input';

interface CompensationSelectorProps {
  compensationType: 'paid' | 'volunteer';
  onTypeChange: (type: 'paid' | 'volunteer') => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  amountError?: string;
  containerStyle?: ViewStyle;
}

export default function CompensationSelector({
  compensationType,
  onTypeChange,
  amount,
  onAmountChange,
  currency,
  onCurrencyChange,
  amountError,
  containerStyle,
}: CompensationSelectorProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>Compensation</Text>
      
      <View style={styles.typeContainer}>
        <TouchableOpacity
          style={[
            styles.typeButton,
            compensationType === 'paid' && styles.typeButtonActive,
          ]}
          onPress={() => onTypeChange('paid')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.typeText,
              compensationType === 'paid' && styles.typeTextActive,
            ]}
          >
            Paid
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.typeButton,
            compensationType === 'volunteer' && styles.typeButtonActive,
          ]}
          onPress={() => onTypeChange('volunteer')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.typeText,
              compensationType === 'volunteer' && styles.typeTextActive,
            ]}
          >
            Volunteer
          </Text>
        </TouchableOpacity>
      </View>
      
      {compensationType === 'paid' && (
        <View style={styles.detailsContainer}>
          <Input
            label="Amount"
            value={amount}
            onChangeText={onAmountChange}
            placeholder="Enter amount"
            keyboardType="numeric"
            containerStyle={styles.amountInput}
            error={amountError}
          />
          
          <Input
            label="Currency"
            value={currency}
            onChangeText={onCurrencyChange}
            placeholder="USD"
            containerStyle={styles.currencyInput}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  typeContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  typeButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: '#4361ee',
    borderColor: '#4361ee',
  },
  typeText: {
    fontWeight: '600',
    color: '#495057',
  },
  typeTextActive: {
    color: '#ffffff',
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  amountInput: {
    width: '70%',
  },
  currencyInput: {
    width: '28%',
  },
}); 