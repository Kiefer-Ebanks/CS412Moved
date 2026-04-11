import { Stack } from 'expo-router';

export default function PostStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        title: 'Post',
      }}
    />
  );
}
