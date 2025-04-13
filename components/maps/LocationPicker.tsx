import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  Modal, 
  SafeAreaView,
  Dimensions,
  Alert
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import { MapPin, X } from 'lucide-react-native';
import Button from '../Button';

interface LocationPickerProps {
  visible: boolean;
  initialCoords?: { latitude: number; longitude: number } | null;
  onClose: () => void;
  onSave: (coords: { latitude: number; longitude: number }) => void;
}

export default function LocationPicker({ 
  visible, 
  initialCoords, 
  onClose, 
  onSave 
}: LocationPickerProps) {
  const [selectedCoords, setSelectedCoords] = useState<{ latitude: number; longitude: number } | null>(
    initialCoords || null
  );

  const handleMapPress = (event: any) => {
    setSelectedCoords(event.nativeEvent.coordinate);
  };

  const handleSaveLocation = () => {
    if (!selectedCoords) {
      Alert.alert('Error', 'Please select a location on the map');
      return;
    }
    onSave(selectedCoords);
    onClose();
  };

  const getUserLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use this feature');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      setSelectedCoords({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Select Location</Text>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
          >
            <X size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: selectedCoords?.latitude || 50.2649,
              longitude: selectedCoords?.longitude || 19.0238,
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
            onPress={handleMapPress}
          >
            {selectedCoords && (
              <Marker
                coordinate={selectedCoords}
                title="Selected Location"
              />
            )}
          </MapView>
          
          <View style={styles.mapInstructions}>
            <Text style={styles.mapInstructionsText}>
              Tap on the map to set the exact location
            </Text>
          </View>
        </View>
        
        <View style={styles.modalFooter}>
          <TouchableOpacity 
            style={styles.myLocationButton}
            onPress={getUserLocation}
          >
            <MapPin size={20} color="#0066cc" />
            <Text style={styles.myLocationText}>Use My Location</Text>
          </TouchableOpacity>
          
          <Button
            title="Save Location"
            onPress={handleSaveLocation}
            style={styles.saveButton}
          />
          <Button
            title="Cancel"
            onPress={onClose}
            type="secondary"
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  closeButton: {
    padding: 4,
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.8,
  },
  mapInstructions: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 12,
    borderRadius: 10,
  },
  mapInstructionsText: {
    textAlign: 'center',
    color: '#212529',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  saveButton: {
    marginBottom: 12,
  },
  myLocationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#e9ecef',
    borderRadius: 10,
    marginBottom: 8,
  },
  myLocationText: {
    marginLeft: 8,
    color: '#0066cc',
    fontWeight: '600',
  }
}); 