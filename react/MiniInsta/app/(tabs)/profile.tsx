// Profile tab — logged-in user from AsyncStorage; profile + posts + new post.

import { colors, styles } from '@/assets/mini_insta_styles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE = 'https://cs-webapps.bu.edu/kebanks/mini_insta';
const API_ORIGIN = new URL(API_BASE).origin;
// AsyncStorage keys written at login so this tab can attach the token and profile id to requests
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

// Builds fetch headers since Django REST expects Authorization when the view is protected
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

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollContentStyle = [styles.pageScrollContent, { paddingTop: insets.top + 12 }];

  const [token, setToken] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<number | null>(null);
  const [ready, setReady] = useState(false);

  const [profile, setProfile] = useState<ProfileFromApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [posts, setPosts] = useState<PostFromApi[]>([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [postsError, setPostsError] = useState<string | null>(null);

  const [postModal, setPostModal] = useState(false);
  const [caption, setCaption] = useState('');
  const [pickedUris, setPickedUris] = useState<string[]>([]);
  const [postBusy, setPostBusy] = useState(false);

  // Reads token + profile id from disk so fetchProfile/fetchPosts know which user we are
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

  // Run again when the tab gains focus so a fresh login from the login screen is picked up here
  useFocusEffect(
    useCallback(() => {
      void loadAuthFromStorage();
    }, [loadAuthFromStorage]),
  );

  const fetchProfile = useCallback(async () => {
    if (profileId == null) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE}/api/profiles/${profileId}/`, {
        headers: buildAuthHeaders(token),
      });
      if (!response.ok) throw new Error(`Profile request failed (${response.status})`);
      setProfile((await response.json()) as ProfileFromApi);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [profileId, token]);

  const fetchPosts = useCallback(async () => {
    if (profileId == null) {
      setPosts([]);
      setPostsLoading(false);
      return;
    }
    setPostsLoading(true);
    setPostsError(null);
    try {
      const response = await fetch(`${API_BASE}/api/profiles/${profileId}/posts/`, {
        headers: buildAuthHeaders(token),
      });
      if (!response.ok) throw new Error(`Posts request failed (${response.status})`);
      setPosts(postsFromResponse(await response.json()));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setPostsError(message);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  }, [profileId, token]);

  useEffect(() => {
    if (!ready) return;
    void fetchProfile();
    void fetchPosts();
  }, [ready, fetchProfile, fetchPosts]);

  async function logout() {
    // Wipes saved credentials so the UI drops back to the signed-out state
    await AsyncStorage.multiRemove([KEY_TOKEN, KEY_PROFILE_ID, KEY_PROFILE_JSON]);
    setToken(null);
    setProfileId(null);
    setProfile(null);
    setPosts([]);
  }

  function openPostModal() {
    if (!token || profileId == null) {
      router.push('/login');
      return;
    }
    setCaption('');
    setPickedUris([]);
    setPostModal(true);
  }

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Photos', 'Allow library access to attach an image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPickedUris((prev) => [...prev, result.assets[0].uri]);
    }
  }

  function removePickedAt(index: number) {
    setPickedUris((prev) => prev.filter((_, i) => i !== index));
  }

  // Appends one image to the multipart body (web uses a Blob, native uses uri + type)
  async function appendOneFile(formData: FormData, pickedUri: string) {
    const name = pickedUri.split('/').pop() || 'photo.jpg';
    const ext = name.includes('.') ? name.split('.').pop()?.toLowerCase() : 'jpg';
    const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
    if (Platform.OS === 'web') {
      const blob = await (await fetch(pickedUri)).blob();
      formData.append('files', blob, name);
    } else {
      formData.append('files', { uri: pickedUri, name, type: mime } as never);
    }
  }

  async function submitPost() {
    if (!token || profileId == null) return;
    const c = caption.trim();
    if (!c) {
      Alert.alert('Caption', 'Enter a caption.');
      return;
    }
    setPostBusy(true);
    try {
      const formData = new FormData();
      formData.append('caption', c);
      for (const uri of pickedUris) {
        await appendOneFile(formData, uri);
      }
      const response = await fetch(`${API_BASE}/api/profiles/${profileId}/posts/`, {
        method: 'POST',
        headers: buildAuthHeaders(token),
        body: formData,
      });
      if (!response.ok) {
        // Try to surface Django’s error body in the alert instead of only the status code
        const raw = await response.text();
        let msg = `Create post failed (${response.status})`;
        if (raw) {
          try {
            msg = JSON.stringify(JSON.parse(raw) as Record<string, unknown>, null, 2);
          } catch {
            msg = raw.slice(0, 500);
          }
        }
        throw new Error(msg);
      }
      setPostModal(false);
      await fetchPosts();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Could not create post');
    } finally {
      setPostBusy(false);
    }
  }

  const avatarUri = profile ? toAbsoluteImageUrl(profile.profile_image_url) : null;

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
          <Text style={styles.screenTitle}>Profile</Text>
          <Text style={styles.sectionHint}>Sign in to view your profile and create posts.</Text>
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
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.screenTitle}>Profile</Text>
          <Pressable style={styles.retry} onPress={() => void logout()}>
            <Text style={styles.buttonLabel}>Sign out</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text style={styles.hint}>Loading profile…</Text>
          </View>
        ) : error ? (
          <View style={styles.centered}>
            <Text style={styles.textSubtitle}>Could not load profile</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <Pressable style={styles.retry} onPress={() => void fetchProfile()}>
              <Text style={styles.buttonLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : profile ? (
          <>
            <View style={styles.profileHeaderRow}>
              {avatarUri ? (
                <Image
                  source={{ uri: avatarUri }}
                  style={styles.profileAvatar}
                  accessibilityLabel="Profile picture"
                />
              ) : (
                <View style={[styles.profileAvatar, { backgroundColor: '#d1d1d6' }]} />
              )}
              <View style={styles.profileNamesCol}>
                <Text style={styles.profileDisplayName}>{profile.display_name}</Text>
                <Text style={styles.profileUsername}>@{profile.username}</Text>
              </View>
            </View>
            <Text style={styles.bio}>{profile.bio_text || 'No bio yet.'}</Text>
            <Text style={styles.meta}>Joined {formatJoinDate(profile.join_date)}</Text>

            <Pressable style={[styles.retry, styles.profileMakePostCta]} onPress={openPostModal}>
              <Text style={styles.buttonLabel}>Make a New Post</Text>
            </Pressable>
          </>
        ) : null}

        {postsLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
            <Text style={styles.hint}>Loading posts…</Text>
          </View>
        ) : postsError ? (
          <View style={styles.centered}>
            <Text style={styles.textSubtitle}>Could not load posts</Text>
            <Text style={styles.errorBody}>{postsError}</Text>
            <Pressable style={styles.retry} onPress={() => void fetchPosts()}>
              <Text style={styles.buttonLabel}>Retry</Text>
            </Pressable>
          </View>
        ) : posts.length > 0 ? (
          <View>
            {posts.map((post) => {
              const thumbnailUri = toAbsoluteImageUrl(post.images?.[0]?.image ?? null);
              return (
                <Pressable
                  key={post.id}
                  onPress={() => router.push(`/post/${post.id}`)}
                  style={styles.postCard}>
                  {thumbnailUri ? (
                    <>
                      <Image
                        source={{ uri: thumbnailUri }}
                        style={styles.postImage}
                        contentFit="cover"
                        accessibilityLabel="Post photo"
                      />
                      <Text style={styles.textSubtitle}>{post.caption}</Text>
                    </>
                  ) : (
                    <Text style={styles.textSubtitle}>{post.caption}</Text>
                  )}
                  <Text style={styles.textMeta}>{formatJoinDate(post.timestamp)}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : !postsLoading && !postsError ? (
          <Text style={styles.hint}>No posts yet.</Text>
        ) : null}
      </ScrollView>

      <Modal
        visible={postModal}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => !postBusy && setPostModal(false)}>
        <View style={{ flex: 1, backgroundColor: colors.card }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingTop: insets.top + 12,
              paddingBottom: 12,
              borderBottomWidth: StyleSheet.hairlineWidth,
              borderBottomColor: colors.border,
            }}>
            <Pressable onPress={() => !postBusy && setPostModal(false)} disabled={postBusy}>
              <Text style={styles.buttonLabel}>Cancel</Text>
            </Pressable>
            <Text style={styles.textSubtitle}>New post</Text>
            <Pressable onPress={() => void submitPost()} disabled={postBusy}>
              {postBusy ? (
                <ActivityIndicator />
              ) : (
                <Text style={styles.buttonLabel}>Post</Text>
              )}
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.pageScrollContent} keyboardShouldPersistTaps="handled">
            <TextInput
              style={styles.modalInput}
              placeholder="Caption"
              placeholderTextColor={colors.textMuted}
              multiline
              value={caption}
              onChangeText={setCaption}
            />
            <Pressable style={styles.retry} onPress={() => void pickPhoto()} disabled={postBusy}>
              <Text style={styles.buttonLabel}>
                Add photo{pickedUris.length ? ` (${pickedUris.length})` : ''}
              </Text>
            </Pressable>
            {pickedUris.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbStrip}>
                {pickedUris.map((uri, index) => (
                  <View key={`${uri}-${index}`} style={styles.thumbWrap}>
                    <Image
                      source={{ uri }}
                      style={styles.thumb}
                      contentFit="cover"
                      accessibilityLabel="Selected photo"
                    />
                    <Pressable
                      style={styles.thumbRemove}
                      onPress={() => removePickedAt(index)}
                      disabled={postBusy}
                      accessibilityLabel="Remove photo">
                      <Text style={styles.thumbRemoveLabel}>✕</Text>
                    </Pressable>
                  </View>
                ))}
              </ScrollView>
            ) : null}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
