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

// The base URL for the API
const API_BASE = 'https://cs-webapps.bu.edu/kebanks/mini_insta';

// The Profile's pk in Django
const PROFILE_ID = 1; // hardcoded for testing

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



export default function ProfileScreen() {
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

      const data = (await response.json()) as PostFromApi[];
      setPosts(data);
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

          {/* Renders a profile picture only when one exists in the API response. */}
          {profile.profile_image_url ? (
            <Image
              source={{ uri: profile.profile_image_url }}
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
          {posts.map((post) => (
            <View key={post.id}>
              <ThemedText type="subtitle">{post.caption}</ThemedText> {/* creating the caption as a subtitle*/}
              <ThemedText>{post.timestamp}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}

    </ParallaxScrollView>
  );
}
