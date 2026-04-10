// File: add_joke.tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/3/2026
// Description: Add a new dad joke via POST to the Django REST API

import { styles } from '../../assets/my_styles';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

// Same url as index and jokes_list for the django app
const API_BASE = 'https://cs-webapps.bu.edu/kebanks/dadjokes';

// The form collects joke text and contributor, then POSTs to api/jokes/
export default function AddJokeScreen() {
  const [jokeText, setJokeText] = useState('');
  const [contributor, setContributor] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sends POST to /api/jokes/ with { text, contributor }
  const handleSubmit = useCallback(async () => {
    const text = jokeText.trim();
    const who = contributor.trim();
    if (!text || !who) {
      setErrorMessage('Please enter both the joke and the contributor name.');
      setSuccessMessage(null);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    // POST adds a new joke and since django expects JSON with "text" and "contributor" we create a body object to be filled with those values
    const url = `${API_BASE}/api/jokes/`;
    const body = { text, contributor: who };

    console.log('[AddJoke] POST request URL:', url);
    console.log('[AddJoke] POST JSON body:', JSON.stringify(body));

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      console.log('[AddJoke] Response HTTP status:', response.status, '(201 = Created, 200 = OK)');

      const responseText = await response.text();
      console.log('[AddJoke] Response body (preview):', responseText.slice(0, 400));

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      // Clear the form after success
      setSuccessMessage('Joke submitted successfully.');
      setJokeText('');
      setContributor('');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Something went wrong';
      setErrorMessage(msg);
      console.log('[AddJoke] Error:', msg);
    } finally {
      setSubmitting(false);
    }
  }, [jokeText, contributor]);

  return (
    <ScrollView contentContainerStyle={styles.addJokeContainer}>
      <Text style={styles.addJokeTitle}>Add a joke</Text>
      <Text style={styles.addJokeHint}>
        Type in a new joke and who came up with it
      </Text>

      {/* multiline is allowed for the joke text so people can write longer jokes*/}
      <Text style={styles.addJokeLabel}>Joke</Text>
      <TextInput
        style={[styles.addJokeInput, styles.addJokeInputMultiline]}
        placeholder="Type your dad joke"
        placeholderTextColor="#888"
        multiline
        value={jokeText}
        onChangeText={setJokeText}
        editable={!submitting}
      />

      <Text style={styles.addJokeLabel}>Contributor</Text>
      <TextInput
        style={styles.addJokeInput}
        placeholder="Your name"
        placeholderTextColor="#888"
        value={contributor}
        onChangeText={setContributor}
        editable={!submitting}
        autoCapitalize="words"
      />

      {/* POST is handled by handleSubmit and the ActivityIndicator spinner shows while waiting */}
      <Pressable
        style={[styles.addJokeSubmit, submitting && styles.addJokeSubmitDisabled]}
        onPress={() => void handleSubmit()}
        disabled={submitting}>
        {submitting ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.addJokeSubmitText}>Submit joke</Text>
        )}
      </Pressable>

      {successMessage ? (
        <Text style={[styles.addJokeMessage, styles.addJokeMessageSuccess]}>{successMessage}</Text>
      ) : null}
      {errorMessage ? (
        <Text style={[styles.addJokeMessage, styles.addJokeMessageError]}>{errorMessage}</Text>
      ) : null}
    </ScrollView>
  );
}
