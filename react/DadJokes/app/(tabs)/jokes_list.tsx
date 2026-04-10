// File: jokes_list.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/3/2026
// Description: The jokes list screen for the DadJokes app

import { styles } from '../../assets/my_styles';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';

// Base URL for the dadjokes django app
const API_BASE = 'https://cs-webapps.bu.edu/kebanks/dadjokes';


function jokesArrayFromResponse(data: any): unknown[] {
  // Function ensures that we get a valid array of jokes
  if (Array.isArray(data)) 
    return data; // If the data is already an array, return it
  if (Array.isArray(data?.results)) 
    return data.results; // If the data has a results property and it's an array return results
  return []; // otherwise return an empty array
}

// getting the row key for react from the joke id, or joke index in the list if id is missing.
function jokeKey(item: any, index: number): string {
  if (item?.id != null) 
    return String(item.id);
  return `joke-${index}`;
}

export default function JokeListScreen() {
  // States for jokes from API, loading and error, and pull to refresh
  const [jokes, setJokes] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // fetches jokes from the API. Pull-to-refresh uses refreshing so the first load uses loading
  const fetchData = useCallback(async (isRefresh: boolean) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/jokes/`);
      if (!response.ok) {
        throw new Error(`Jokes request failed (${response.status})`);
      }
      const raw = await response.json();
      setJokes(jokesArrayFromResponse(raw));
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message);
    } finally {
      // getting rid of loading and refreshing spinners
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Fetch once when this screen first loads
  useEffect(() => {
    void fetchData(false);
  }, [fetchData]);

  // passed to RefreshControl so pull-down triggers another fetch from the api
  const onRefresh = useCallback(() => {
    void fetchData(true);
  }, [fetchData]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* first load so we show a big center spinner*/}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <Text style={styles.hint}>Loading jokes…</Text>
        </View>
      ) : error ? (
        /* If the request fails show the error and let the user retry */
        <View style={styles.centered}>
          <Text style={styles.errorTitle}>Could not load jokes</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <Text style={styles.hint}>Pull down to retry.</Text>
        </View>
      ) : (
        /* If the request succeeds show the section title and one card per joke */
        <>
          <Text style={styles.sectionLabel}>All jokes</Text>
          {jokes.length === 0 ? (
            <Text style={styles.listEmptyText}>No jokes to show.</Text>
          ) : null}
          {jokes.map((item, index) => {
            // get the text, contributor, and timestamp from this joke object if they exist
            const text =
              item && typeof item === 'object' && item !== null && 'text' in item
                ? String((item as Record<string, unknown>).text ?? '')
                : '';
            const contributor =
              item && typeof item === 'object' && item !== null && 'contributor' in item
                ? String((item as Record<string, unknown>).contributor ?? '')
                : '';
            const timestamp =
              item && typeof item === 'object' && item !== null && 'timestamp' in item
                ? String((item as Record<string, unknown>).timestamp ?? '')
                : '';

            return (
              <View key={jokeKey(item, index)} style={styles.card}>
                <Text style={styles.jokeText}>{text}</Text>
                <Text style={styles.contributor}>— {contributor}</Text>
                {timestamp ? <Text style={styles.listTimestamp}>{timestamp}</Text> : null}
              </View>
            );
          })}
        </>
      )}
    </ScrollView>
  );
}
