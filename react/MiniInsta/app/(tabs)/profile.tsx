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
const PROFILE_ID = 1;

/** Shape of one profile from the ProfileSerializer */
type ProfileFromApi = {
  id: number;
  username: string;
  display_name: string;
  profile_image_url: string;
  bio_text: string;
  join_date: string;
};

export default function ProfileScreen() {
  const [profile, setProfile] = useState<ProfileFromApi | null>(null); // The profile data from the API
  const [loading, setLoading] = useState(true); // Whether the profile is loading
  const [error, setError] = useState<string | null>(null); // The error message if the profile fails to load

  // Sends a GET request to the API to fetch the profile
  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);

    // creates the URL to send the GET request to .../api/profiles/<pk>/
    const url = `${API_BASE}/api/profiles/${PROFILE_ID}/`;

    console.log('[Profile] GET request URL:', url);

    try {
      // sends the GET request to the API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      console.log('[Profile] Response HTTP status:', response.status);

      const responseText = await response.text();
      console.log('[Profile] Response body (preview):', responseText.slice(0, 400));

      if (!response.ok) {
        throw new Error(`Profile request failed (${response.status})`);
      }

      const data = JSON.parse(responseText) as ProfileFromApi; // parses the response text into a ProfileFromApi object
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

  useEffect(() => { // fetches the profile when the page loads
    void fetchProfile();
  }, [fetchProfile]);

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
          <ActivityIndicator size="large" /> // shows a loading indicator and a message while the profile is loading
          <ThemedText style={styles.hint}>Loading profile…</ThemedText>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <ThemedText type="subtitle">Could not load profile</ThemedText>
          <ThemedText style={styles.errorBody}>{error}</ThemedText>
          <Pressable style={styles.retry} onPress={() => void fetchProfile()}> // allows the user to retry the request
            <ThemedText type="defaultSemiBold">Retry</ThemedText>
          </Pressable>
        </View>
      ) : profile ? (
        <>
          {profile.profile_image_url ? (
            <Image
              source={{ uri: profile.profile_image_url }} // displays the profile picture
              style={styles.avatar}
              accessibilityLabel="Profile picture"
            />
          ) : null}
          <ThemedText type="subtitle">{profile.display_name}</ThemedText>
          <ThemedText>@{profile.username}</ThemedText>
          <ThemedText style={styles.bio}>{profile.bio_text || 'No bio yet.'}</ThemedText>
          <ThemedText style={styles.meta}>Joined {profile.join_date}</ThemedText>
        </>
      ) : null}
    </ParallaxScrollView>
  );
}
