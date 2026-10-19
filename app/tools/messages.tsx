import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { Button, Screen } from '@/components/ui';
import { fetchMessages, sendMessage } from '@/lib/data';
import { useAppStore } from '@/store/useAppStore';

export default function MessagesTool() {
  const userId = useAppStore((state) => state.userId);
  const mode = useAppStore((state) => state.mode);
  const client = useQueryClient();
  const messages = useQuery({ queryKey: ['messages', userId], enabled: Boolean(userId), queryFn: () => fetchMessages(userId!) });
  const [text, setText] = useState('');
  const [local, setLocal] = useState<string[]>([]);

  async function submit() {
    const body = text.trim();
    if (!body || !userId) return;
    setText('');
    if (mode === 'demo') {
      setLocal((current) => [...current, body]);
      return;
    }
    await sendMessage(userId, body);
    await client.invalidateQueries({ queryKey: ['messages', userId] });
  }

  return (
    <Screen>
      <Stack.Screen options={{ title: 'Mesajlar' }} />
      {(messages.data ?? []).map((message) => (
        <View key={message.id} className={`mb-2 rounded-2xl px-4 py-3 ${message.sender === 'user' ? 'bg-brand-700' : 'bg-white dark:bg-slate-900'}`}>
          <Text className={message.sender === 'user' ? 'text-white' : 'text-ink dark:text-white'}>{message.body}</Text>
        </View>
      ))}
      {local.map((body) => (
        <View key={body} className="mb-2 rounded-2xl bg-brand-700 px-4 py-3">
          <Text className="text-white">{body}</Text>
        </View>
      ))}
      <TextInput value={text} onChangeText={setText} placeholder="Sorunu yaz" placeholderTextColor="#94A3B8" className="mt-3 rounded-2xl border border-line bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-900 dark:text-white" />
      <View className="mt-3">
        <Button label="Gönder" onPress={submit} />
      </View>
    </Screen>
  );
}
