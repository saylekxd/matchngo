import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle
} from 'react-native';
import Input from './Input';
import Button from './Button';
import { X } from 'lucide-react-native';

interface ExpertiseTagsProps {
  tags: string[];
  onTagsChange: (tags: string[]) => void;
  error?: string;
  containerStyle?: ViewStyle;
}

export default function ExpertiseTags({
  tags,
  onTagsChange,
  error,
  containerStyle,
}: ExpertiseTagsProps) {
  const [inputValue, setInputValue] = useState('');

  const handleAddTag = () => {
    if (inputValue.trim()) {
      onTagsChange([...tags, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemoveTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    onTagsChange(newTags);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Text style={styles.label}>Required Expertise</Text>
      
      <View style={styles.inputContainer}>
        <Input
          value={inputValue}
          onChangeText={setInputValue}
          placeholder="Add required expertise (e.g., Web Development)"
          containerStyle={styles.input}
        />
        <Button
          title="Add"
          onPress={handleAddTag}
          type="secondary"
          style={styles.addButton}
        />
      </View>
      
      {tags.length > 0 ? (
        <View style={styles.tagsContainer}>
          {tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => handleRemoveTag(index)}
              >
                <X size={14} color="#495057" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}
      
      {error && (
        <Text style={styles.errorText}>{error}</Text>
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    marginRight: 8,
    marginBottom: 0,
  },
  addButton: {
    height: 50,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  tag: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: 14,
    color: '#495057',
    marginRight: 6,
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 8,
  },
}); 