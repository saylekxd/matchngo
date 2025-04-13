import React, { useEffect, useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  FlatList, 
  RefreshControl, 
  SafeAreaView,
  TouchableOpacity,
  Alert
} from 'react-native';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import Card from '@/components/Card';
import UserAvatar from '@/components/UserAvatar';
import { router } from 'expo-router';
import { Database } from '@/lib/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

interface ConversationPreview {
  profileId: string;
  profile: Profile;
  lastMessage: Message;
  unreadCount: number;
}

export default function MessagesScreen() {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);

  useEffect(() => {
    if (profile?.base?.id) {
      loadConversations();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('messages_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${profile.base.id}`,
          },
          (payload) => {
            loadConversations();
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [profile]);

  const loadConversations = async () => {
    if (!profile?.base?.id) return;
    
    setIsLoading(true);
    try {
      // Get all unique conversation partners
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('receiver_id')
        .eq('sender_id', profile.base.id)
        .order('created_at', { ascending: false });
      
      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', profile.base.id)
        .order('created_at', { ascending: false });
      
      if (sentError || receivedError) throw sentError || receivedError;
      
      // Get unique profile IDs
      const uniqueProfileIds = new Set<string>();
      sentMessages?.forEach(msg => uniqueProfileIds.add(msg.receiver_id));
      receivedMessages?.forEach(msg => uniqueProfileIds.add(msg.sender_id));
      
      const conversationPreviews: ConversationPreview[] = [];
      
      // For each conversation partner, get the last message and profile info
      for (const partnerId of uniqueProfileIds) {
        // Get the last message
        const { data: lastMessages, error: lastMsgError } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${partnerId},receiver_id.eq.${partnerId}`)
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (lastMsgError) throw lastMsgError;
        
        if (lastMessages && lastMessages.length > 0) {
          // Get partner profile
          const { data: partnerProfile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', partnerId)
            .single();
          
          if (profileError) throw profileError;
          
          // Count unread messages
          const { count, error: countError } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_id', partnerId)
            .eq('receiver_id', profile.base.id)
            .eq('read', false);
          
          if (countError) throw countError;
          
          conversationPreviews.push({
            profileId: partnerId,
            profile: partnerProfile,
            lastMessage: lastMessages[0],
            unreadCount: count || 0,
          });
        }
      }
      
      // Sort by last message time, newest first
      conversationPreviews.sort((a, b) => 
        new Date(b.lastMessage.created_at).getTime() - new Date(a.lastMessage.created_at).getTime()
      );
      
      setConversations(conversationPreviews);
    } catch (error) {
      console.error('Error loading conversations:', error);
      Alert.alert('Error', 'Failed to load conversations. Please try again.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  const handleOpenConversation = (conversation: ConversationPreview) => {
    router.push(`/chat/${conversation.profileId}`);
  };
  
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    
    // If today, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If this week, show day
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (date > weekAgo) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.pageTitle}>Messages</Text>
        
        {conversations.length === 0 ? (
          <Card>
            <Text style={styles.emptyStateText}>No conversations yet.</Text>
            <Text style={styles.emptyStateSubText}>
              Start messaging experts or NGOs to collaborate on opportunities.
            </Text>
          </Card>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.profileId}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.conversationItem}
                onPress={() => handleOpenConversation(item)}
                activeOpacity={0.7}
              >
                <View style={styles.avatarContainer}>
                  <UserAvatar 
                    uri={item.profile.avatar_url} 
                    name={item.profile.full_name} 
                    size={50}
                    showBadge={item.unreadCount > 0}
                  />
                </View>
                
                <View style={styles.conversationContent}>
                  <View style={styles.conversationHeader}>
                    <Text style={styles.nameText}>
                      {item.profile.full_name}
                    </Text>
                    <Text style={styles.timeText}>
                      {formatTimestamp(item.lastMessage.created_at)}
                    </Text>
                  </View>
                  
                  <View style={styles.messagePreviewContainer}>
                    <Text 
                      style={[
                        styles.messagePreview,
                        item.unreadCount > 0 && styles.unreadMessage
                      ]}
                      numberOfLines={1}
                    >
                      {item.lastMessage.sender_id === profile?.base?.id 
                        ? `You: ${item.lastMessage.content}`
                        : item.lastMessage.content
                      }
                    </Text>
                    
                    {item.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>
                          {item.unreadCount}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    color: '#212529',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
    color: '#495057',
  },
  emptyStateSubText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6c757d',
  },
  conversationItem: {
    flexDirection: 'row',
    padding: 12,
  },
  avatarContainer: {
    marginRight: 12,
  },
  conversationContent: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
  },
  timeText: {
    fontSize: 12,
    color: '#6c757d',
  },
  messagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  messagePreview: {
    fontSize: 14,
    color: '#6c757d',
    flex: 1,
  },
  unreadMessage: {
    fontWeight: '600',
    color: '#212529',
  },
  unreadBadge: {
    backgroundColor: '#4361ee',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    paddingHorizontal: 4,
  },
  unreadBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: '#e9ecef',
  },
});