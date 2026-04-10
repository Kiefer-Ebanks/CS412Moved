import { styles } from '@/assets/my_styles'; // Importing the StyleSheet my_styles I created
import { View, Text, Image, ScrollView } from 'react-native'; // Importing the View, Text, Image, and ScrollView packages from React Native

// Detail tab: scrollable list of favorite movies with descriptions and images
export default function DetailScreen() {
  return (
    <View style={styles.container}>
      {/* ScrollView for the detail tab to make the content scrollable and the contentContainerStyle pads the inner column and centers the content */}
      <ScrollView contentContainerStyle={styles.scrollContent} style={styles.scrollView}>
        <Text style={styles.titleText}>My Favorite Movies</Text> {/* Title for the detail tab */}
        <View style={styles.smallSeparator} />
        <Text style={styles.descriptionText}>Here's a list of some of my favorite movies:</Text> {/* Description for the detail tab */}
        <View style={styles.separator} />
        <View style={styles.separator} /> {/* Vertical visual divider I use for spacing between sections */}

        {/* --- Interstellar  facts--- */}
        <Text style={styles.movieList}>Interstellar</Text>
        <View style={styles.smallSeparator} />
        <Text style={styles.descriptionText}>I love the insane visuals as well as the story</Text>
        <View style={styles.smallSeparator} />
        <Image 
          source= {{uri: 'https://cs-people.bu.edu/kebanks/images/interstellar.jpeg' }} {/* remote image from my website */}
          style={{width: 200, height: 200}} {/* fixed 200x200 size since sizining is required for remote images */}
        />
        <View style={styles.separator} />

        {/* --- Inside Man facts--- */}
        <Text style={styles.movieList}>Inside Man</Text>
        <View style={styles.smallSeparator} />
        <Text style={styles.descriptionText}>I love the suspense and twist at the end</Text>
        <View style={styles.smallSeparator} />
        <Image
          source={{ uri: 'https://cs-people.bu.edu/kebanks/images/InsideMan.jpg' }} {/* remote image from my website */}
          style={{ width: 200, height: 200 }} {/* fixed 200x200 size since sizining is required for remote images */}
        />
        <View style={styles.separator} />

        {/* --- American Psycho facts--- */}
        <Text style={styles.movieList}>American Psycho</Text>
        <View style={styles.smallSeparator} />
        <Text style={styles.descriptionText}>I love the surrealism and satire</Text>
        <View style={styles.smallSeparator} />
        <Image
          source={{ uri: 'https://cs-people.bu.edu/kebanks/images/AmericanPsycho.jpg' }} {/* remote image from my website */}
          style={{ width: 200, height: 200 }} {/* fixed 200x200 size since sizining is required for remote images */}
        />
        <View style={styles.separator} />

        {/* --- Django Unchained facts--- */}
        <Text style={styles.movieList}>Django Unchained</Text>
        <View style={styles.smallSeparator} />
        <Text style={styles.descriptionText}>I love the intensity and characters</Text>
        <View style={styles.smallSeparator} />
        <Image
          source={{ uri: 'https://cs-people.bu.edu/kebanks/images/Django.jpg' }} {/* remote image from my website */}
          style={{ width: 200, height: 200 }} {/* fixed 200x200 size since sizining is required for remote images */}
        />
        <View style={styles.separator} />

        {/* --- Alpha facts--- */}
        <Text style={styles.movieList}>Alpha</Text>
        <View style={styles.smallSeparator} />
        <Text style={styles.descriptionText}>I love the story</Text>
        <View style={styles.smallSeparator} />
        <Image
          source={{ uri: 'https://cs-people.bu.edu/kebanks/images/Alpha.jpg' }} {/* remote image from my website */}
          style={{ width: 200, height: 200 }} {/* fixed 200x200 size since sizining is required for remote images */}
        />
        <View style={styles.separator} />

        {/* --- Se7en facts--- */}
        <Text style={styles.movieList}>Se7en</Text>
        <View style={styles.smallSeparator} />
        <Text style={styles.descriptionText}>I love the intensity and mystery</Text>
        <View style={styles.smallSeparator} />
        <Image
          source={{ uri: 'https://cs-people.bu.edu/kebanks/images/seven.jpeg' }} {/* remote image from my website */}
          style={{ width: 200, height: 200 }} {/* fixed 200x200 size since sizining is required for remote images */}
        />
        <View style={styles.separator} />

        {/* --- Joker facts--- */}
        <Text style={styles.movieList}>Joker</Text>
        <View style={styles.smallSeparator} />
        <Text style={styles.descriptionText}>Great societal commentary and acting</Text>
        <View style={styles.smallSeparator} />
        <Image
          source={{ uri: 'https://cs-people.bu.edu/kebanks/images/Joker.jpeg' }} {/* remote image from my website */}
          style={{ width: 200, height: 200 }} {/* fixed 200x200 size since sizining is required for remote images */}
        />
        <View style={styles.separator} />
      </ScrollView>
    </View>
  );
}
