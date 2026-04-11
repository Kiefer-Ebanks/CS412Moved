// Feed tab — GET /api/profiles/<profile_id>/feed/

import { styles } from '@/assets/mini_insta_styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE = 'https://cs-webapps.bu.edu/kebanks/mini_insta';
const API_ORIGIN = new URL(API_BASE).origin;
// Same storage keys as login — feed is for whichever user last stored token + profile id
const KEY_TOKEN = 'mini_insta_token';
const KEY_PROFILE_ID = 'mini_insta_profile_id';

// Match profile tab: send the session token on feed GETs when the endpoint requires auth
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

type PostFromApi = {
  id: number;
  profile: number;
  caption: string;
  timestamp: string;
  author_display_name?: string;
  author_username?: string;
  images: { id: number; post: number; image: string }[];
};

type PaginatedPostsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PostFromApi[];
};

function postsFromResponse(payload: unknown): PostFromApi[] {
  if (Array.isArray(payload)) return payload as PostFromApi[];
  if (
    payload !== null &&
    typeof payload === 'object' &&
    'results' in payload &&
    Array.isArray((payload as PaginatedPostsResponse).results)
  ) {
    return (payload as PaginatedPostsResponse).results;
  }
  return [];
}

// One line of “who posted” using serializer fields when present, else the profile fk
function authorLine(post: PostFromApi): string {
  return (
    post.author_display_name ||
    post.author_username ||
    (post.profile != null ? `Profile #${post.profile}` : 'Unknown')
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollContentStyle = [styles.pageScrollContent, { paddingTop: insets.top + 12 }];

  const [token, setToken] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const [feedPosts, setFeedPosts] = useState<PostFromApi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load token + profile id so the feed URL uses the logged-in viewer’s pk
  const loadAuthFromStorage = useCallback(async () => {
    try {
      const [t, idStr] = await Promise.all([
        AsyncStorage.getItem(KEY_TOKEN),
        AsyncStorage.getItem(KEY_PROFILE_ID),
      ]);
      setToken(t);
      setProfileId(idStr ? Number(idStr) : null);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    void loadAuthFromStorage();
  }, [loadAuthFromStorage]);

  // Refresh auth when coming back to this tab (e.g. after login) without restarting the app
  useFocusEffect(
    useCallback(() => {
      void loadAuthFromStorage();
    }, [loadAuthFromStorage]),
  );

  // GET …/profiles/<id>/feed/ — no request until we know which profile’s following list to use
  const fetchFeed = useCallback(async () => {
    if (profileId == null) {
      setFeedPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/profiles/${profileId}/feed/`, {
        headers: buildAuthHeaders(token),
      });
      if (!response.ok) throw new Error(`Feed request failed (${response.status})`);
      const body = (await response.json()) as unknown;
      setFeedPosts(postsFromResponse(body));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message);
      setFeedPosts([]);
    } finally {
      setLoading(false);
    }
  }, [profileId, token]);

  useEffect(() => {
    if (!ready) return;
    void fetchFeed();
  }, [ready, fetchFeed]);

  if (!ready) {
    return (
      <View style={styles.pageRoot}>
        <View style={[styles.centered, { paddingTop: insets.top }]}>
          <ActivityIndicator size="large" />
          <Text style={styles.hint}>Loading…</Text>
        </View>
      </View>
    );
  }

  if (profileId == null || !token) {
    return (
      <View style={styles.pageRoot}>
        <ScrollView contentContainerStyle={scrollContentStyle}>
          <Text style={styles.screenTitle}>Feed</Text>
          <Text style={styles.sectionHint}>Sign in to see your feed.</Text>
          <Pressable style={styles.retry} onPress={() => router.push('/login')}>
            <Text style={styles.buttonLabel}>Sign in</Text>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.pageRoot}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={scrollContentStyle}>
        <Text style={styles.screenTitle}>Feed</Text>
        <Text style={styles.sectionHint}>Posts from people you follow.</Text>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text style={styles.hint}>Loading feed…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.textSubtitle}>Could not load feed</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Pressable style={styles.retry} onPress={() => void fetchFeed()}>
              <Text style={styles.buttonLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : feedPosts.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.hint}>No posts in your feed yet. Follow profiles or add posts.</Text>
          </View>
        ) : (
          <View>
            {feedPosts.map((post) => {
              const thumbnailUri = toAbsoluteImageUrl(post.images?.[0]?.image ?? null);
              return (
                <Pressable
                  key={post.id}
                  onPress={() => router.push(`/post/${post.id}`)}
                  style={styles.feedPostCard}>
                  <Text style={styles.feedAuthorTitle}>{authorLine(post)}</Text>
                  {thumbnailUri ? (
                    <Image
                      source={{ uri: thumbnailUri }}
                      style={styles.feedImage}
                      contentFit="cover"
                      accessibilityLabel="Post photo"
                    />
                  ) : null}
                  <Text style={styles.feedCaptionLine}>{post.caption}</Text>
                  <Text style={styles.feedDateUnderImage}>{formatJoinDate(post.timestamp)}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
