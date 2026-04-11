// File: mini_insta_styles.ts
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/10/2026
// Description: Shared styles for the MiniInsta app (all tab screens)

import { StyleSheet } from 'react-native';

const bg = '#f2f2f7';
const card = '#ffffff';
const text = '#111111';
const textSecondary = '#555555';
const textMuted = '#6e6e73';
const border = '#d1d1d6';
const tint = '#007aff';

export const colors = {
  bg,
  card,
  text,
  textSecondary,
  textMuted,
  border,
  tint,
};

export const styles = StyleSheet.create({
  pageRoot: {
    flex: 1,
    backgroundColor: bg,
  },
  pageScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 32,
  },

  screenTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: text,
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 15,
    color: textMuted,
    marginBottom: 16,
  },
  textSubtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: text,
  },
  textBody: {
    fontSize: 16,
    color: text,
  },
  textMeta: {
    fontSize: 13,
    color: textMuted,
  },
  textError: {
    fontSize: 15,
    color: '#c00',
    textAlign: 'center',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: tint,
  },

  centered: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 24,
  },
  hint: {
    fontSize: 15,
    color: textMuted,
  },
  errorBody: {
    fontSize: 15,
    textAlign: 'center',
    color: textSecondary,
  },
  retry: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    backgroundColor: '#e8f0ff',
    alignSelf: 'center',
  },
  /** Profile — primary CTA under bio; extra space below before posts list */
  profileMakePostCta: {
    marginTop: 16,
    marginBottom: 32,
    alignSelf: 'flex-start',
  },

  /** Profile header: avatar left, names right */
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    marginBottom: 16,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: border,
  },
  profileNamesCol: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 4,
  },
  profileDisplayName: {
    fontSize: 22,
    fontWeight: '700',
    color: text,
  },
  profileUsername: {
    fontSize: 16,
    color: textSecondary,
    marginTop: 2,
  },
  bio: {
    marginTop: 4,
    fontSize: 16,
    lineHeight: 22,
    color: text,
  },
  meta: {
    marginTop: 8,
    fontSize: 13,
    color: textMuted,
  },

  postCard: {
    marginBottom: 20,
    gap: 8,
    backgroundColor: card,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: border,
  },
  postImage: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    backgroundColor: border,
  },

  /** Feed: author above image, caption where date was, date under image */
  feedPostCard: {
    marginBottom: 20,
    gap: 8,
    backgroundColor: card,
    borderRadius: 12,
    padding: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: border,
  },
  feedAuthorTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: text,
  },
  feedImage: {
    width: '100%',
    height: 260,
    borderRadius: 8,
    backgroundColor: border,
  },
  feedDateUnderImage: {
    fontSize: 13,
    color: textMuted,
  },
  feedCaptionLine: {
    fontSize: 15,
    color: textSecondary,
    lineHeight: 20,
  },

  /** New post modal — full screen style */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    padding: 20,
  },
  modalFill: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: card,
    borderRadius: 14,
    padding: 16,
    gap: 12,
    maxHeight: '90%',
  },
  modalInput: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: border,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    color: text,
    minHeight: 88,
  },
  modalRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  thumbStrip: {
    marginVertical: 4,
  },
  thumbWrap: {
    marginRight: 10,
    position: 'relative',
  },
  thumb: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: border,
  },
  thumbRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  thumbRemoveLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },

  /** Post detail screen (stack content) */
  postDetailScrollOuter: {
    flexGrow: 1,
    backgroundColor: bg,
  },
  postDetailInner: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  postDetailBackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingRight: 12,
  },
  postDetailBackLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: tint,
  },
  postDetailCaption: {
    fontSize: 18,
    fontWeight: '600',
    color: text,
  },
  postDetailDate: {
    fontSize: 15,
    color: textMuted,
  },
  postDetailImage: {
    width: '100%',
    height: 280,
    borderRadius: 8,
    backgroundColor: border,
  },
  screenPadding: {
    padding: 24,
    gap: 12,
    flex: 1,
    backgroundColor: bg,
  },

  /** Login (outside tabs) */
  loginKeyboard: { flex: 1 },
  loginBody: {
    flex: 1,
    padding: 24,
    gap: 14,
    justifyContent: 'center',
    backgroundColor: bg,
  },
  loginTitleLarge: {
    fontSize: 34,
    fontWeight: '700',
    color: text,
    textAlign: 'center',
  },
  loginSubText: {
    fontSize: 15,
    color: textMuted,
    marginBottom: 8,
    textAlign: 'center',
  },
  loginInputField: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: text,
    backgroundColor: card,
  },
  loginPrimaryButton: {
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.18)',
  },
  loginPrimaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: text,
  },
  loginLinkText: {
    fontSize: 16,
    color: tint,
    textAlign: 'center',
  },
});
