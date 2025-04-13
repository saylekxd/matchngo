import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  Platform 
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { Calendar, Clock } from 'lucide-react-native';

interface DatePickerProps {
  label?: string;
  value: string;
  onChangeDate: (date: string) => void;
  placeholder?: string;
  error?: string;
  containerStyle?: ViewStyle;
  minDate?: Date;
  showTime?: boolean;
}

export default function DatePicker({
  label,
  value,
  onChangeDate,
  placeholder = 'Select a date',
  error,
  containerStyle,
  minDate,
  showTime = false,
}: DatePickerProps) {
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  
  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date: Date) => {
    // Format with time if showTime is true
    const formattedDate = showTime 
      ? date.toISOString() // Full ISO string with time
      : date.toISOString().split('T')[0]; // Just YYYY-MM-DD
    
    onChangeDate(formattedDate);
    hideDatePicker();
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    
    try {
      const date = new Date(dateString);
      const dateOptions: Intl.DateTimeFormatOptions = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
      };
      
      if (showTime) {
        dateOptions.hour = '2-digit';
        dateOptions.minute = '2-digit';
      }
      
      return date.toLocaleDateString('en-US', dateOptions);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity 
        style={[
          styles.inputContainer,
          error ? styles.inputError : null,
        ]}
        onPress={showDatePicker}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.dateText,
          !value && styles.placeholderText
        ]}>
          {value ? formatDisplayDate(value) : placeholder}
        </Text>
        <View style={styles.iconContainer}>
          {showTime && <Clock size={20} color="#6c757d" style={styles.icon} />}
          <Calendar size={20} color="#6c757d" />
        </View>
      </TouchableOpacity>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode={showTime ? "datetime" : "date"}
        onConfirm={handleConfirm}
        onCancel={hideDatePicker}
        minimumDate={minDate}
        date={value ? new Date(value) : new Date()}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 6,
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    backgroundColor: '#ffffff',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
  },
  placeholderText: {
    color: '#adb5bd',
  },
  inputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#dc3545',
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 8,
  },
}); 