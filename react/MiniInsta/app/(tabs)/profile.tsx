// File: profile.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/10/2026
// Description: Load and show one profile from the MiniInsta Django REST API (GET api/profiles/<pk>/)

import { styles } from '@/assets/mini_insta_styles';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useRouter } from 'expo-router'; // used to navigate to the post detail screen

// The base URL for the API
const API_BASE = 'https://cs-webapps.bu.edu/kebanks/mini_insta';

// Origin for resolving media image paths from the API
const API_ORIGIN = new URL(API_BASE).origin;

// The Profile's pk in Django
const PROFILE_ID = 1; // hardcoded for testing

/** Turn media image URLs into a full https URI for Image. */
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

/** Shape of one profile from the ProfileSerializer */
type ProfileFromApi = {
  id: number;
  username: string;
  display_name: string;
  // both profile_image_url and bio_text can be left null by a user when creating their profile 
  // so we need to allow them to be null here when we get profile data from the api
  profile_image_url: string | null;
  bio_text: string | null; 
  join_date: string;
};

// Formats API date strings into a human-friendly date
function formatJoinDate(rawDate: string): string {
  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) {
    return rawDate;
  }

  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(parsedDate);
}

/** Shape of one post from the PostSerializer */
type PostFromApi = {
  id: number;
  profile: number;
  caption: string;
  timestamp: string;
  images: Array<{ // array of photo objects
    id: number;
    post: number;
    image: string;
  }>;
};

/** Django REST Framework page-number pagination wraps lists in { results: [...] } */
type PaginatedPostsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: PostFromApi[];
};

function postsFromResponse(payload: unknown): PostFromApi[] {
  if (Array.isArray(payload)) { // if the payload is an array, return it as a PostFromApi array
    return payload as PostFromApi[];
  }
  if ( // if the payload is not null, an object, has a results key, and the results key is an array, return the results as a PostFromApi array
    payload !== null &&  // if the payload is not null,
    typeof payload === 'object' && // checks if the payload is an object
    'results' in payload && // checks if the payload has a results key
    Array.isArray((payload as PaginatedPostsResponse).results) // checks if the results key is an array
  ) {
    return (payload as PaginatedPostsResponse).results; // then it returns the results as a PostFromApi array
  }
  return [];
}



export default function ProfileScreen() {
  const router = useRouter();

  const [profile, setProfile] = useState<ProfileFromApi | null>(null); // The profile data from the API
  const [loading, setLoading] = useState(true); // Whether the profile is loading
  const [error, setError] = useState<string | null>(null); // The error message if the profile fails to load

  const [posts, setPosts] = useState<PostFromApi[]>([]); // state for the posts data from the API
  const [postsLoading, setPostsLoading] = useState(true); // state for whether the posts are loading
  const [postsError, setPostsError] = useState<string | null>(null); // error state if the posts don't load

  // fetchProfile sends a GET request to the API to fetch the profile
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    // creates the URL to send the GET request to .../api/profiles/<pk>/
    const url = `${API_BASE}/api/profiles/${PROFILE_ID}/`;


    try {
      // sends the GET request to the API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Profile request failed (${response.status})`);
      }

      // stores the response data into a ProfileFromApi object
      const data = (await response.json()) as ProfileFromApi;

      // Stores the profile object in React state
      setProfile(data);

    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message);
      setProfile(null);
      console.log('[Profile] Error:', message);
    } finally {
      setLoading(false);
    }
  }, []);

  // fetchPosts sends a GET request to the API endpoint /api/profiles/<pk>/posts/ to fetch the posts for the profile
  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);

    const url = `${API_BASE}/api/profiles/${PROFILE_ID}/posts/`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Posts request failed (${response.status})`);
      }

      const postsResponse = (await response.json()) as PaginatedPostsResponse;
      setPosts(postsFromResponse(postsResponse));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setPostsError(message);
      setPosts([]); // empty array if the posts don't load
      console.log('[Posts] Error:', message);
    } finally {
      setPostsLoading(false);
    }
  }, []);

  useEffect(() => { // fetches the profile and posts when the page loads
    void fetchProfile();
    void fetchPosts();
  }, [fetchProfile, fetchPosts]);

  const avatarUri = profile ? toAbsoluteImageUrl(profile.profile_image_url) : null; // converts the profile image url to a full https uri for the Image component

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title" style={styles.profileTitle}>
          Profile
        </ThemedText>
      </ThemedView>

      {loading ? (
        <View style={styles.centered}>
          {/* Shows a loading spinner and message while we fetch profile data. */}
          <ActivityIndicator size="large" />
          <ThemedText style={styles.hint}>Loading profile…</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText type="subtitle">Could not load profile</ThemedText>
          <ThemedText style={styles.errorBody}>{error}</ThemedText>
          
          {/* Allows the user to retry if the API request fails. */}
          <Pressable style={styles.retry} onPress={() => void fetchProfile()}>
            <ThemedText type="defaultSemiBold">Retry</ThemedText>
          </Pressable>
        </View>
      ) : profile ? (
        <>
          {avatarUri ? ( // if the avatar uri is not null, show the image
            <Image
              source={{ uri: avatarUri }}
              style={styles.avatar}
              accessibilityLabel="Profile picture"
            />
          ) : null}
          <ThemedText type="subtitle">{profile.display_name}</ThemedText>
          <ThemedText>@{profile.username}</ThemedText>
          <ThemedText style={styles.bio}>{profile.bio_text || 'No bio yet.'}</ThemedText>
          <ThemedText style={styles.meta}>Joined {formatJoinDate(profile.join_date)}</ThemedText>
        </>
      ) : null}


      {/* Shows the posts for the profile */}
      {/* similar loading and error handling and syle to the profile when showing posts*/}
      {postsLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <ThemedText style={styles.hint}>Loading posts…</ThemedText>
        </View>
      ) : postsError ? (
        <View style={styles.centered}>
        <ThemedText type="subtitle">Could not load posts</ThemedText>
        <ThemedText style={styles.errorBody}>{postsError}</ThemedText>
        <Pressable style={styles.retry} onPress={() => void fetchPosts()}>
          <ThemedText type="defaultSemiBold">Retry</ThemedText>
        </Pressable>
      </View>
      ) : posts.length > 0 ? (
        <View>
          {posts.map((post) => {
            const firstPhotoUrl = post.images?.[0]?.image;
            const thumbUri = toAbsoluteImageUrl(firstPhotoUrl ?? null);
            return (
              <Pressable
                key={post.id}
                onPress={() => router.replace(`/posts/${post.id}`)}
                style={styles.postCard}>
                <ThemedText type="subtitle">{post.caption}</ThemedText>
                {thumbUri ? (
                  <Image
                    source={{ uri: thumbUri }}
                    style={styles.postImage}
                    contentFit="cover"
                    accessibilityLabel="Post photo"
                  />
                ) : null}
                <ThemedText>{formatJoinDate(post.timestamp)}</ThemedText>
              </Pressable>
            );
          })}
        </View>
      ) : null}

    </ParallaxScrollView>
  );
}
