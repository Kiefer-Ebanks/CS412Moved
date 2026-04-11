// File: posts/[id].tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/10/2026
// Description: Load and show one post by URL id via GET /api/posts/<id>/

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { Fragment, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE = 'https://cs-webapps.bu.edu/kebanks/mini_insta';
const API_ORIGIN = new URL(API_BASE).origin;
const KEY_TOKEN = 'mini_insta_token';

// Same token header pattern as profile/feed so this GET works when the API checks auth
function buildAuthHeaders(token: string | null, extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json', ...extra };
  if (token) {
    h.Authorization = `Token ${token}`;
  }
  return h;
}

function toAbsoluteImageUrl(url: string | null | undefined): string | null {
  if (url == null) {
    return null;
  }
  const u = String(url).trim();
  if (!u) {
    return null;
  }
  if (u.startsWith('//')) {
    return `https:${u}`;
  }
  if (u.startsWith('/')) {
    return `${API_ORIGIN}${u}`;
  }
  return u;
}

type PostDetail = {
  id: number;
  profile: number;
  caption: string;
  timestamp: string;
  images: { id: number; post: number; image: string }[];
};

export default function PostDetailScreen() {
  const [token, setToken] = useState<string | null>(null);

  // Post detail only needs the token string for Authorization on fetchPost
  const loadToken = useCallback(async () => {
    const t = await AsyncStorage.getItem(KEY_TOKEN);
    setToken(t);
  }, []);

  useEffect(() => {
    void loadToken();
  }, [loadToken]);

  useFocusEffect(
    useCallback(() => {
      void loadToken();
    }, [loadToken]),
  );

  // The route to this file is posts/[id].tsx. This function reads the 7 from /posts/7 so we can call the API
  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;
  const insets = useSafeAreaInsets();
  // Extra offset below notch/status bar to avoid the status bar from covering the content
  const topContentPad = Math.max(insets.top, Platform.OS === 'web' ? 12 : 0) + 8;

  const [post, setPost] = useState<PostDetail | null>(null); // state for the post data from the API
  const [loading, setLoading] = useState(true); // state for whether the post is loading
  const [error, setError] = useState<string | null>(null); // state for the error message if the post fails to load

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError('Missing post id');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const url = `${API_BASE}/api/posts/${id}/`; // creates the URL to send the GET request to .../api/posts/<id>/

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: buildAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`Post failed (${response.status})`);
      }

      const data = (await response.json()) as PostDetail; // converts the response to a PostDetail object
      setPost(data); // sets the post data to the state
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message); // sets the error message to the state
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  // Leave post screen and land on the profile tab (works even if stack history is messy)
  const leavePost = useCallback(() => {
    router.navigate('/profile');
  }, []);

  // Row layout lives on an inner View so Pressable has a single child
  const backButtonRow = (
    <Pressable
      onPress={leavePost}
      accessibilityRole="button"
      accessibilityLabel="Back to profile"><View style={styles.backRow}>{[
        <IconSymbol key="chev" name="chevron.left" size={22} color="#0a7ea4" />,
        <ThemedText key="backLbl" type="defaultSemiBold" style={styles.backLabel}>
          Back to Profile
        </ThemedText>,
      ]}</View></Pressable>
  );

  const screenPadWithTop = [styles.screenPadding, { paddingTop: 24 + topContentPad }];

  if (loading) {
    return (
      <View style={screenPadWithTop}>{[
        <Fragment key="back">{backButtonRow}</Fragment>,
        <ActivityIndicator key="spinner" size="large" />,
        <ThemedText key="loading">Loading post…</ThemedText>,
      ]}</View>
    );
  }

  if (error) {
    return (
      <View style={screenPadWithTop}>{[
        <Fragment key="back">{backButtonRow}</Fragment>,
        <ThemedText key="err">{error}</ThemedText>,
      ]}</View>
    );
  }

  if (!post) {
    return (
      <View style={screenPadWithTop}>{[
        <Fragment key="back">{backButtonRow}</Fragment>,
        <ThemedText key="empty">No post found.</ThemedText>,
      ]}</View>
    );
  }

  // Build one <Image> per photo or null if the URL is missing and .map returns an array of the images
  const imageNodes = post.images.map((img) => {
    const uri = toAbsoluteImageUrl(img.image);
    if (!uri) {
      return null;
    }
    return (
      <Image
        key={img.id}
        source={{ uri }}
        style={{ width: '100%', height: 280 }}
        contentFit="cover"
        accessibilityLabel="Post photo"
      />
    );
  });

  const scrollInnerStyle = [styles.scrollContent, { paddingTop: 16 + topContentPad }];

  return (
    <ScrollView contentContainerStyle={styles.scrollOuter}><View style={scrollInnerStyle}>{[
      <Fragment key="back">{backButtonRow}</Fragment>,
      <ThemedText key="cap" type="subtitle">{post.caption || 'No caption'}</ThemedText>,
      <ThemedText key="ts">{post.timestamp}</ThemedText>,
      ...imageNodes,  // the ... spreads each image in as its own array item
    ]}</View></ScrollView>
  );
}

const styles = StyleSheet.create({
  // screenPadding: outer spacing for full-screen states (loading / error) that are not inside ScrollView.
  screenPadding: {
    padding: 24,
    gap: 12,
  },
  // scrollOuter: lets the inner View own padding/gap so ScrollView has one non-text child 
  scrollOuter: {
    flexGrow: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  // backRow: lays out the icon and label in a row and gives a comfortable tap target.
  backRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 12,
  },
  // backLabel: slight spacing from the chevron so the hit area reads as one control.
  backLabel: {
    marginLeft: 2,
  },
});
