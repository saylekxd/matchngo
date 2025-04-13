import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MapPin, Calendar, DollarSign } from 'lucide-react-native';
import { Database } from '@/lib/database.types';

type Opportunity = Database['public']['Tables']['opportunities']['Row'];

interface OpportunityCardProps {
  opportunity: Opportunity;
  onPress: (opportunity: Opportunity) => void;
}

export default function OpportunityCard({ opportunity, onPress }: OpportunityCardProps) {
  const compensation = opportunity.compensation as any;
  
  // Format date range
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  const startDate = formatDate(opportunity.start_date);
  const endDate = formatDate(opportunity.end_date);
  
  return (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => onPress(opportunity)}
      activeOpacity={0.8}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{opportunity.title}</Text>
        <View style={[
          styles.statusBadge,
          opportunity.status === 'open' && styles.statusOpen,
          opportunity.status === 'in_progress' && styles.statusInProgress,
          opportunity.status === 'closed' && styles.statusClosed,
          opportunity.status === 'draft' && styles.statusDraft,
        ]}>
          <Text style={styles.statusText}>
            {opportunity.status === 'in_progress' ? 'In Progress' : 
             opportunity.status.charAt(0).toUpperCase() + opportunity.status.slice(1)}
          </Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <MapPin size={18} color="#6c757d" />
          <Text style={styles.infoText}>{opportunity.location_name}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <Calendar size={18} color="#6c757d" />
          <Text style={styles.infoText}>{startDate} - {endDate}</Text>
        </View>
        
        <View style={styles.infoItem}>
          <DollarSign size={18} color="#6c757d" />
          <Text style={styles.infoText}>
            {compensation.type === 'paid' 
              ? `${compensation.currency || '$'}${compensation.amount} ${compensation.unit || ''}`
              : 'Volunteer'}
          </Text>
        </View>
      </View>
      
      <View style={styles.tagsContainer}>
        {opportunity.required_expertise.slice(0, 3).map((expertise, index) => (
          <View key={index} style={styles.tag}>
            <Text style={styles.tagText}>{expertise}</Text>
          </View>
        ))}
        {opportunity.required_expertise.length > 3 && (
          <View style={styles.tag}>
            <Text style={styles.tagText}>+{opportunity.required_expertise.length - 3}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOpen: {
    backgroundColor: '#e6f7e6',
  },
  statusInProgress: {
    backgroundColor: '#fff3cd',
  },
  statusClosed: {
    backgroundColor: '#f8d7da',
  },
  statusDraft: {
    backgroundColor: '#e9ecef',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#e9ecef',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#495057',
  },
});