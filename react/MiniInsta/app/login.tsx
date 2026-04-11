// Login — POST /api/login/ then persist token + profile ids in AsyncStorage (same keys as other screens).

import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, styles as mi } from '@/assets/mini_insta_styles';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE = 'https://cs-webapps.bu.edu/kebanks/mini_insta';
const KEY_TOKEN = 'mini_insta_token';
const KEY_PROFILE_ID = 'mini_insta_profile_id';
const KEY_PROFILE_JSON = 'mini_insta_profile';

type ProfileFromApi = {
  id: number;
  username: string;
  display_name: string;
  profile_image_url: string | null;
  bio_text: string | null;
  join_date: string;
};

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit() {
    const u = username.trim();
    if (!u || !password) {
      Alert.alert('Sign in', 'Enter username and password.');
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`${API_BASE}/api/login/`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: u, password }),
      });
      const data = (await response.json()) as {
        token?: string;
        profile_id?: number;
        profile?: ProfileFromApi;
        error?: string;
      };
      if (!response.ok || !data.token || data.profile_id == null || !data.profile) {
        throw new Error(data.error ?? `Login failed (${response.status})`);
      }
      await AsyncStorage.multiSet([
        [KEY_TOKEN, data.token],
        [KEY_PROFILE_ID, String(data.profile_id)],
        [KEY_PROFILE_JSON, JSON.stringify(data.profile)],
      ]);
      router.replace('/(tabs)/profile');
    } catch (e) {
      Alert.alert('Sign in failed', e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={mi.loginKeyboard}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[mi.loginBody, { paddingTop: insets.top + 24 }]}>
        <Text style={mi.loginTitleLarge}>MiniInsta</Text>
        <Text style={mi.loginSubText}>Use your Django account (must have a Profile).</Text>

        <TextInput
          style={mi.loginInputField}
          placeholder="Username"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
          editable={!busy}
        />
        <TextInput
          style={mi.loginInputField}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!busy}
        />

        <Pressable style={mi.loginPrimaryButton} onPress={() => void onSubmit()} disabled={busy}>
          {busy ? (
            <ActivityIndicator />
          ) : (
            <Text style={mi.loginPrimaryButtonText}>Sign in</Text>
          )}
        </Pressable>

        <Pressable onPress={() => router.back()} disabled={busy}>
          <Text style={mi.loginLinkText}>Cancel</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
