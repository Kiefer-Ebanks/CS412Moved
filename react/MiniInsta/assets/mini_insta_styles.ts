// File: mini_insta_styles.ts
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/10/2026
// Description: Shared styles for the MiniInsta app

import { Fonts } from '@/constants/theme';
import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  profileTitle: {
    fontFamily: Fonts.rounded,
  },
  centered: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  hint: {
    opacity: 0.7,
  },
  errorBody: {
    textAlign: 'center',
    opacity: 0.85,
  },
  retry: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
  },
  bio: {
    marginTop: 8,
    lineHeight: 22,
  },
  meta: {
    opacity: 0.6,
    fontSize: 13,
  },
});
