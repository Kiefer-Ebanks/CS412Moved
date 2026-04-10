// Stack inside tabs so post detail gets a header and back navigation
import { Stack } from 'expo-router';

export default function PostsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: true, title: 'Post' }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
