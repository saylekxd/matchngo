import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MapPin } from 'lucide-react-native';
import LocationPicker from './LocationPicker';
import Input from '../Input';

interface LocationSelectorProps {
  locationName: string;
  onLocationNameChange: (name: string) => void;
  locationCoords: { latitude: number; longitude: number } | null;
  onLocationCoordsChange: (coords: { latitude: number; longitude: number }) => void;
  error?: string;
  containerStyle?: object;
  label?: string;
}

export default function LocationSelector({
  locationName,
  onLocationNameChange,
  locationCoords,
  onLocationCoordsChange,
  error,
  containerStyle,
  label = 'Location'
}: LocationSelectorProps) {
  const [mapModalVisible, setMapModalVisible] = useState(false);

  const handleSaveLocation = (coords: { latitude: number; longitude: number }) => {
    onLocationCoordsChange(coords);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <Input
        label={label}
        value={locationName}
        onChangeText={onLocationNameChange}
        placeholder="Enter the location (e.g., City, Country)"
        error={error}
        containerStyle={styles.locationInput}
      />
      
      <TouchableOpacity 
        style={styles.mapPickerButton}
        onPress={() => setMapModalVisible(true)}
      >
        <MapPin size={20} color="#0066cc" />
        <Text style={styles.mapPickerText}>
          {locationCoords ? 'Edit Map Location' : 'Pick on Map'}
        </Text>
      </TouchableOpacity>

      <LocationPicker
        visible={mapModalVisible}
        initialCoords={locationCoords}
        onClose={() => setMapModalVisible(false)}
        onSave={handleSaveLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  locationInput: {
    marginBottom: 8,
  },
  mapPickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    marginBottom: 8,
  },
  mapPickerText: {
    marginLeft: 8,
    color: '#0066cc',
    fontWeight: '600',
  },
}); 