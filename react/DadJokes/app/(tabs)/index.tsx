// File: index.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/3/2026
// Description: The index screen for the DadJokes app

import { styles } from '../../assets/my_styles';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';

// Base URL for the dadjokes django app
const API_BASE = 'https://cs-webapps.bu.edu/kebanks/dadjokes';

//loads a random joke and a random picture from the API with pull-to-refresh
export default function IndexScreen() {
  const { width } = useWindowDimensions();
  // set a cap on the image width so it fits on small screens
  const imageWidth = Math.min(width - 48, 360);

  // States for retrieving the API data
  const [joke, setJoke] = useState<unknown>(null);
  const [picture, setPicture] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetches random joke and picture from the api
  const fetchData = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const jokeResponse = await fetch(`${API_BASE}/api/random`);
      if (!jokeResponse.ok) {
        throw new Error(`Joke request failed (${jokeResponse.status})`);
      }
      const jokeData = await jokeResponse.json();

      const pictureResponse = await fetch(`${API_BASE}/api/random_picture/`);
      if (!pictureResponse.ok) {
        throw new Error(`Picture request failed (${pictureResponse.status})`);
      }
      const pictureData = await pictureResponse.json();

      setJoke(jokeData);
      setPicture(pictureData);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message);
    } finally {
      // Clear both loading and refresh spinners whether the request worked or not
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch once when this screen first loads
  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  // Runs when the user pulls down; reuses fetch with refresh mode
  const onRefresh = useCallback(() => {
    void fetchData(true);
  }, [fetchData]);

  // Get text and contributor from the joke object if they exist
  const jokeText =
    joke && typeof joke === 'object' && joke !== null && 'text' in joke
      ? String((joke as Record<string, unknown>).text ?? '')
      : '';
  const contributor =
    joke && typeof joke === 'object' && joke !== null && 'contributor' in joke
      ? String((joke as Record<string, unknown>).contributor ?? '')
      : '';
  // Get the picture URL from the picture object if it exists
  const imageUrl =
    picture && typeof picture === 'object' && picture !== null && 'image_url' in picture
      ? String((picture as Record<string, unknown>).image_url ?? '')
      : '';

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* First load uses a big centered spinner */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.hint}>Loading joke and picture…</Text>
        </View>
      ) : error ? (
        /* If the request fails show the error and let the user retry */
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load data</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.hint}>Pull down to retry.</Text>
        </View>
      ) : (
        /* If the request succeeds show the joke card and the image */
        <>
          <Text style={styles.sectionLabel}>Joke</Text>
          {jokeText ? (
            <View style={styles.card}>
              <Text style={styles.jokeText}>{jokeText}</Text>
              <Text style={styles.contributor}>— {contributor}</Text>
            </View>
          ) : null}

          <Text style={styles.sectionLabel}>Picture</Text>
          {imageUrl ? (
            <Image
              source={{ uri: imageUrl }}
              style={[styles.image, { width: imageWidth, height: imageWidth * 0.75 }]}
              resizeMode="cover"
              accessibilityLabel="Random picture from the API"
            />
          ) : null}
        </>
      )}
    </ScrollView>
  );
}
