import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  ViewStyle,
  TextStyle
} from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';

interface InputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  multiline?: boolean;
  numberOfLines?: number;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  keyboardType?: 'default' | 'number-pad' | 'decimal-pad' | 'numeric' | 'email-address' | 'phone-pad';
  autoFocus?: boolean;
  editable?: boolean;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  autoCapitalize = 'none',
  error,
  multiline = false,
  numberOfLines = 1,
  containerStyle,
  inputStyle,
  keyboardType = 'default',
  autoFocus = false,
  editable = true,
}: InputProps) {
  const [hidePassword, setHidePassword] = React.useState(secureTextEntry);
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputContainer,
        error ? styles.inputError : null,
        !editable ? styles.inputDisabled : null,
        multiline ? styles.inputMultiline : null,
      ]}>
        <TextInput
          style={[
            styles.input,
            multiline ? styles.textMultiline : null,
            inputStyle
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={hidePassword}
          autoCapitalize={autoCapitalize}
          multiline={multiline}
          numberOfLines={multiline ? numberOfLines : 1}
          keyboardType={keyboardType}
          autoFocus={autoFocus}
          editable={editable}
          placeholderTextColor="#adb5bd"
        />
        {secureTextEntry && (
          <TouchableOpacity 
            style={styles.eyeIcon}
            onPress={() => setHidePassword(!hidePassword)}
          >
            {hidePassword ? <EyeOff size={20} color="#6c757d" /> : <Eye size={20} color="#6c757d" />}
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
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
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 10,
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#212529',
  },
  textMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  inputMultiline: {
    minHeight: 80,
  },
  inputError: {
    borderColor: '#dc3545',
  },
  inputDisabled: {
    backgroundColor: '#e9ecef',
  },
  errorText: {
    marginTop: 4,
    fontSize: 12,
    color: '#dc3545',
  },
  eyeIcon: {
    paddingRight: 16,
  },
});