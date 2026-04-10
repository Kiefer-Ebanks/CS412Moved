// File: posts/[id].tsx
// Author: Kiefer Ebanks (kebanks@bu.edu), 4/10/2026
// Description: Load and show one post by URL id via GET /api/posts/<id>/

import { ThemedText } from '@/components/themed-text';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';

const API_BASE = 'https://cs-webapps.bu.edu/kebanks/mini_insta';
const API_ORIGIN = new URL(API_BASE).origin;

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

type PostDetail = {
  id: number;
  profile: number;
  caption: string;
  timestamp: string;
  images: Array<{ id: number; post: number; image: string }>;
};

export default function PostDetailScreen() {

  const { id: idParam } = useLocalSearchParams<{ id: string | string[] }>();
  const id = Array.isArray(idParam) ? idParam[0] : idParam;

  const [post, setPost] = useState<PostDetail | null>(null); // state for the post data from the API
  const [loading, setLoading] = useState(true); // state for whether the post is loading
  const [error, setError] = useState<string | null>(null); // state for the error message if the post fails to load

  const fetchPost = useCallback(async () => {
    if (!id) {
      setError('Missing post id');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const url = `${API_BASE}/api/posts/${id}/`; // creates the URL to send the GET request to .../api/posts/<id>/

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Post failed (${response.status})`);
      }

      const data = (await response.json()) as PostDetail; // converts the response to a PostDetail object
      setPost(data); // sets the post data to the state
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Something went wrong';
      setError(message); // sets the error message to the state
      setPost(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchPost();
  }, [fetchPost]);

  if (loading) {
    return (
      <View style={{ padding: 24 }}>
        <ActivityIndicator size="large" />
        <ThemedText>Loading post…</ThemedText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ padding: 24 }}>
        <ThemedText>{error}</ThemedText>
      </View>
    );
  }

  if (!post) {
    return (
      <View style={{ padding: 24 }}>
        <ThemedText>No post found.</ThemedText>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <ThemedText type="subtitle">{post.caption || 'No caption'}</ThemedText>
      <ThemedText>{post.timestamp}</ThemedText>
      {post.images.map((img) => {
        const uri = toAbsoluteImageUrl(img.image);
        if (!uri) {
          return null;
        }
        return (
          <Image
            key={img.id}
            source={{ uri }}
            style={{ width: '100%', height: 280 }}
            contentFit="cover"
            accessibilityLabel="Post photo"
          />
        );
      })}
    </ScrollView>
  );
}
