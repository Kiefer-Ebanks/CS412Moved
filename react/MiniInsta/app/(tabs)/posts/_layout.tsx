// Stack for post detail only. headerShown: false avoids a second “back” (native header) fighting goBack() / your in-screen button.
import { Stack } from 'expo-router';

export default function PostsStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
