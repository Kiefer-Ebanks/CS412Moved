import { styles } from '@/assets/my_styles'; // Importing the StyleSheet my_styles I created
import { View, Text, Image } from 'react-native'; // Importing the View, Text, and Image packages from React Native

// Creating the Index tab screen as a default Expo Router function
export default function IndexScreen() {
  return (
     // Container that applies the main screen padding/background from my_styles
    <View style={styles.container}>
      <Text style={styles.titleText}>Hi, I'm Kiefer!</Text> {/* Title for the Index tab screen */}
      <View style={styles.separator} /> {/* Vertical visual divider I use for spacing between sections */}
      <Text style={styles.descriptionText}>I love lifting weights and watching movies!</Text> {/* Short bio text */}
      <View style={styles.separator} /> {/* Vertical visual divider I use for spacing between sections */}
      <Image source={require('@/assets/images/Kiefer.jpg')} style={{ width: 200, height: 200 }} /> {/* local image from my assets folder */}
      <View style={styles.separator} /> 
    </View>
  );
}
