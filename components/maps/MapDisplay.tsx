import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import MapView, { Marker, Callout } from 'react-native-maps';
import { MapPin, Clock, Building2, ArrowRight } from 'lucide-react-native';

interface Location {
  latitude: number;
  longitude: number;
}

interface Marker {
  id: string;
  coordinate: Location;
  title?: string;
  description?: string;
  ngoName?: string;
  startDate?: string;
  endDate?: string;
}

interface MapDisplayProps {
  markers?: Marker[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  style?: object;
  onMarkerPress?: (marker: Marker) => void;
}

export default function MapDisplay({ 
  markers = [], 
  initialRegion,
  style,
  onMarkerPress
}: MapDisplayProps) {
  const defaultRegion = {
    latitude: 50.2649,
    longitude: 19.0238,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  return (
    <View style={[styles.container, style]}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion || defaultRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
      >
        {markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
          >
            <View style={styles.markerContainer}>
              <MapPin size={24} color="#0066cc" />
            </View>
            <Callout
              tooltip
              onPress={() => onMarkerPress && onMarkerPress(marker)}
            >
              <View style={styles.calloutContainer}>
                <View style={styles.calloutHeader}>
                  <Text style={styles.calloutTitle} numberOfLines={2}>
                    {marker.title}
                  </Text>
                </View>
                
                {marker.ngoName && (
                  <View style={styles.calloutRow}>
                    <Building2 size={16} color="#495057" />
                    <Text style={styles.calloutText} numberOfLines={1}>
                      {marker.ngoName}
                    </Text>
                  </View>
                )}
                
                {marker.description && (
                  <View style={styles.calloutRow}>
                    <MapPin size={16} color="#495057" />
                    <Text style={styles.calloutText} numberOfLines={2}>
                      {marker.description}
                    </Text>
                  </View>
                )}
                
                {(marker.startDate || marker.endDate) && (
                  <View style={styles.calloutRow}>
                    <Clock size={16} color="#495057" />
                    <Text style={styles.calloutText}>
                      {formatDate(marker.startDate)} - {formatDate(marker.endDate)}
                    </Text>
                  </View>
                )}

                <TouchableOpacity 
                  style={styles.calloutButton}
                  onPress={() => onMarkerPress && onMarkerPress(marker)}
                >
                  <Text style={styles.calloutButtonText}>View Details</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </TouchableOpacity>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    flex: 1,
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    padding: 4,
    backgroundColor: 'white',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#0066cc',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  calloutContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: 280,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  calloutHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    paddingBottom: 8,
  },
  calloutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  calloutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  calloutText: {
    fontSize: 14,
    color: '#495057',
    flex: 1,
  },
  calloutButton: {
    backgroundColor: '#0066cc',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 8,
  },
  calloutButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
}); 