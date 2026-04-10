import { styles } from '@/assets/my_styles'; // Importing the StyleSheet my_styles I created
import { View, Text, Image } from 'react-native'; // Importing the View, Text, and Image packages from React Native


export default function AboutScreen() {
  return (
    // Container that applies the main screen padding/background from my_styles
    <View style={styles.container}>
      <Text style={styles.titleText}>My Favorite Actor</Text> {/* title for this page */}
      <View style={styles.separator} /> {/* Vertical visual divider I use for spacing between sections */}
      <Image source={require('@/assets/images/Jensen.jpg')} style={{width: 200, height: 200}} /> {/* Local image from my assets folder */}
      <View style={styles.separator} />
      <Text style={styles.titleText2}>Jensen Ackels</Text> {/* Second heading style for the Jensen Ackles' name */}
      <View style={styles.smallSeparator} /> {/* Smaller gap than separator to sit the bio closer to the name */}
      <Text style={styles.descriptionText}>I love him as Soldier Boy in The Boys, Dean Winchester in Supernatural, and Jason Todd in Batman: Under the Red Hood</Text> {/* Body text describing my favorite roles of his */}
      <View style={styles.separator} />
    </View>
  );
}
