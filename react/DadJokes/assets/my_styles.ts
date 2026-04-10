// File: my_styles.ts
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/3/2026
// Description: The styles for the DadJokes app

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  // Index screen styles for random joke and picture
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  hint: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginTop: 8,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  errorBody: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.85,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    opacity: 0.55,
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    backgroundColor: 'rgba(128,128,128,0.12)',
  },
  jokeText: {
    fontSize: 18,
    lineHeight: 26,
  },
  contributor: {
    marginTop: 12,
    fontSize: 15,
    fontStyle: 'italic',
    opacity: 0.75,
  },
  image: {
    alignSelf: 'center',
    borderRadius: 12,
    backgroundColor: 'rgba(128,128,128,0.15)',
  },

  // --- Jokes list screen ---
  listTimestamp: {
    marginTop: 8,
    fontSize: 12,
    opacity: 0.45,
  },
  listEmptyText: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.65,
    paddingVertical: 24,
  },

  // --- Add joke screen ---
  addJokeContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'flex-start',
  },
  addJokeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  addJokeHint: {
    fontSize: 15,
    opacity: 0.7,
    lineHeight: 22,
    marginBottom: 20,
  },
  addJokeLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 12,
  },
  addJokeInput: {
    borderWidth: 1,
    borderColor: 'rgba(128,128,128,0.45)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 44,
  },
  addJokeInputMultiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  addJokeSubmit: {
    marginTop: 24,
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  addJokeSubmitDisabled: {
    opacity: 0.55,
  },
  addJokeSubmitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  addJokeMessage: {
    marginTop: 16,
    fontSize: 15,
  },
  addJokeMessageSuccess: {
    color: '#15803d',
  },
  addJokeMessageError: {
    color: '#b91c1c',
  },
});
