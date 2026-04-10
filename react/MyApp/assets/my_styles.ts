import { StyleSheet } from 'react-native'; // Importing the StyleSheet package from React Native

// Creating the styles object that contains all the styles for the app
export const styles = StyleSheet.create({

  // Styles for titles
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'red',
  },

  // Styles for description text
  descriptionText: {
    fontSize: 16,
    color: '#2d2f30',
    textAlign: 'center'
  },

  // Styles for the vertical separator
  separator: {
    marginVertical: 10,
    height: 1,
    width: '80%',
  },

  // Styles for the small vertical separator
  smallSeparator: {
    marginVertical: 4,
    height: 1,
    width: '80%',
  },

  // Styles for the container that applies the main screen padding/background
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7eb0d6',
  },

  // Styles for the movie list text
  movieList: {
    fontSize: 16,
    color: '#2d2f30',
    fontWeight: 'bold',
  },

  // Styles for the scroll view
  scrollView: {
    width: '100%',
    height: '100%',
    marginTop: 30,
  },

  // Style for the scroll content
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },

  // Styles for the subtitle in the about tab
  titleText2: {
    fontSize: 18,
    color: 'black',
  },

});