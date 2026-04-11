// Post detail — GET /api/posts/<id>/
// Lives at app root stack (not inside tabs) so push/pop + header back work from Feed/Profile.

import { colors, styles } from '@/assets/mini_insta_styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

const API_BASE = 'https://cs-webapps.bu.edu/kebanks/mini_insta';
const API_ORIGIN = new URL(API_BASE).origin;
const KEY_TOKEN = 'mini_insta_token';

function buildAuthHeaders(token: string | null, extra?: Record<string, string>): Record<string, string> {
  const h: Record<string, string> = { Accept: 'application/json', ...extra };
  if (token) {
    h.Authorization = `Token ${token}`;
  }
  return h;
}

function toAbsoluteImageUrl(url: string | null | undefined): string | null {
  if (url == null) return null;
  const u = String(url).trim();
  if (!u) return null;
  if (u.startsWith('//')) return `https:${u}`;
  if (u.startsWith('/')) return `${API_ORIGIN}${u}`;
  return u;
}

function formatJoinDate(rawDate: string): string {
  const parsedDate = new Date(rawDate);
  if (Number.isNaN(parsedDate.getTime())) return rawDate;
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(
    parsedDate,
  );
}

type PostDetail = {
  id: number;
  profile: number;
  caption: string;
  timestamp: string;
  author_display_name?: string;
  author_username?: string;
  images: { id: number; post: number; image: string }[];
};

function authorTitle(post: PostDetail | null): string {
  if (!post) return 'Post';
  return post.author_display_name || post.author_username || `Profile #${post.profile}`;
}

export default function PostDetailScreen() {
  const navigation = useNavigation();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

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

  const [post, setPost] = useState<PostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError('Missing post id');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/posts/${id}/`, {
        method: 'GET',
        headers: buildAuthHeaders(token),
      });

      if (!response.ok) {
        throw new Error(`Post failed (${response.status})`);
      }

      const data = (await response.json()) as PostDetail;
      setPost(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message);
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)');
  }, [router]);

  useLayoutEffect(() => {
    const t = authorTitle(post);
    navigation.setOptions({
      title: t,
      headerTitle: t,
      headerLeft: () => (
        <Pressable
          onPress={goBack}
          hitSlop={{ top: 12, bottom: 12, left: 8, right: 12 }}
          style={{ flexDirection: 'row', alignItems: 'center', paddingLeft: 2 }}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={28} color={colors.tint} />
          <Text style={styles.postDetailBackLabel}>Back</Text>
        </Pressable>
      ),
    });
  }, [navigation, post, goBack]);

  if (loading) {
    return (
      <View style={styles.screenPadding}>
        <ActivityIndicator size="large" />
        <Text style={styles.hint}>Loading post…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.screenPadding}>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={styles.screenPadding}>
        <Text style={styles.hint}>No post found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.postDetailScrollOuter}>
      <View style={styles.postDetailInner}>
        <Text style={styles.postDetailCaption}>{post.caption || 'No caption'}</Text>
        <Text style={styles.postDetailDate}>{formatJoinDate(post.timestamp)}</Text>
        {post.images.map((img) => {
          const uri = toAbsoluteImageUrl(img.image);
          if (!uri) return null;
          return (
            <Image
              key={img.id}
              source={{ uri }}
              style={styles.postDetailImage}
              contentFit="cover"
              accessibilityLabel="Post photo"
            />
          );
        })}
      </View>
    </ScrollView>
  );
}
