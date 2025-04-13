import React, { useEffect, useState, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import UserAvatar from '@/components/UserAvatar';
import { ArrowLeft, Send } from 'lucide-react-native';
import { Database } from '@/lib/database.types';

type Message = Database['public']['Tables']['messages']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { profile } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [receiverProfile, setReceiverProfile] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const isMounted = useRef(true);
  
  // Track component mount state
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  useEffect(() => {
    if (id && profile?.base?.id) {
      loadChatData();
      
      // Set up real-time subscription for new messages
      const subscription = supabase
        .channel('chat_channel')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `sender_id=eq.${id}`,
          },
          (payload) => {
            // Add the new message to state only if component is still mounted
            if (isMounted.current) {
              const newMsg = payload.new as Message;
              setMessages(prevMessages => [newMsg, ...prevMessages]);
              
              // Mark the message as read
              if (newMsg.receiver_id === profile.base?.id) {
                supabase
                  .from('messages')
                  .update({ read: true })
                  .eq('id', newMsg.id)
                  .then();
              }
            }
          }
        )
        .subscribe();
      
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [id, profile]);
  
  const loadChatData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch receiver's profile
      const { data: receiverData, error: receiverError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id as string)
        .single();
      
      if (receiverError) throw receiverError;
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setReceiverProfile(receiverData);
      }
      
      // Fetch messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${profile?.base?.id},receiver_id.eq.${id}),and(sender_id.eq.${id},receiver_id.eq.${profile?.base?.id})`)
        .order('created_at', { ascending: false });
      
      if (messagesError) throw messagesError;
      
      // Only update state if component is still mounted
      if (isMounted.current) {
        setMessages(messagesData);
      }
      
      // Mark unread messages as read
      if (messagesData.length > 0) {
        supabase
          .from('messages')
          .update({ read: true })
          .eq('receiver_id', profile?.base?.id)
          .eq('sender_id', id)
          .eq('read', false)
          .then();
      }
    } catch (error) {
      console.error('Error loading chat data:', error);
    } finally {
      // Only update state if component is still mounted
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !profile?.base?.id || !id) return;
    
    try {
      setIsSending(true);
      
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.base.id,
          receiver_id: id as string,
          content: newMessage.trim(),
        });
      
      if (error) throw error;
      
      // Clear input and reload messages only if component is still mounted
      if (isMounted.current) {
        setNewMessage('');
        loadChatData();
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      if (isMounted.current) {
        setIsSending(false);
      }
    }
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
      return `${date.toLocaleDateString([], { weekday: 'short' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Otherwise show date
    return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.sender_id === profile?.base?.id;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessageBubble : styles.theirMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.theirMessageText
          ]}>
            {item.content}
          </Text>
        </View>
        <Text style={styles.messageTime}>
          {formatTimestamp(item.created_at)}
        </Text>
      </View>
    );
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: () => (
            <View style={styles.headerContainer}>
              {receiverProfile && (
                <>
                  <UserAvatar
                    uri={receiverProfile.avatar_url}
                    name={receiverProfile.full_name}
                    size={36}
                  />
                  <Text style={styles.headerTitle}>
                    {receiverProfile.full_name}
                  </Text>
                </>
              )}
            </View>
          ),
          headerShadowVisible: false,
          headerStyle: { backgroundColor: '#f8f9fa' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#212529" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4361ee" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            inverted={true}
            contentContainerStyle={styles.messagesList}
          />
        )}
        
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type a message..."
            multiline
            maxHeight={100}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!newMessage.trim() || isSending) && styles.sendButtonDisabled
            ]}
            onPress={handleSendMessage}
            disabled={!newMessage.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Send size={20} color="#ffffff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 12,
    color: '#212529',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messagesList: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 16,
    maxWidth: '80%',
  },
  myMessageContainer: {
    alignSelf: 'flex-end',
  },
  theirMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
  },
  myMessageBubble: {
    backgroundColor: '#4361ee',
    borderBottomRightRadius: 4,
  },
  theirMessageBubble: {
    backgroundColor: '#e9ecef',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
  },
  myMessageText: {
    color: '#ffffff',
  },
  theirMessageText: {
    color: '#212529',
  },
  messageTime: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    padding: 12,
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4361ee',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-end',
  },
  sendButtonDisabled: {
    backgroundColor: '#adb5bd',
  },
});