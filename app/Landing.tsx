import { Marquee } from '@animatereactnative/marquee';
import { useLogto } from '@logto/rn';
import * as React from 'react';
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { colors } from '../services/Colors'; // Adjust the import path as needed

export default function Landing() {
  const { signIn } = useLogto();

  const imageList = [
    require('../assets/images/1.jpg'),
    require('../assets/images/c1.jpg'),
    require('../assets/images/2.jpg'),
    require('../assets/images/c2.jpg'),
    require('../assets/images/3.jpg'),
    require('../assets/images/c3.jpg'),
    require('../assets/images/4.jpg'),
    require('../assets/images/5.jpg'),
    require('../assets/images/6.jpg'),
  ];

 


  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {[0.6, 0.4, 0.5].map((speed, i) => (
        <Marquee spacing={15} speed={speed} style={styles.marqueeStyle} key={i}>
          <View style={styles.imagecontainer}>
            {imageList.map((image, index) => (
              <Image key={index} source={image} style={styles.image} />
            ))}
          </View>
        </Marquee>
      ))}

      <View style={styles.bottomContainer}>
        <Text style={styles.foodtext1}>CookWithMe-AI🧑‍🍳</Text>
        <Text style={styles.foodtext2}>Find, Create and Enjoy New Exciting Recipes!</Text>
        <Text style={styles.foodtext}>Generate any recipe with the help of AI 😋!</Text>

        <TouchableOpacity onPress={async () => signIn(' exp://10.114.160.145:8081')} style={styles.Button}>
          <Text style={styles.buttonText}>Get Started!</Text>
        </TouchableOpacity>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  image: {
    height: 160,
    width: 160,
    borderRadius: 20,
  },
  imagecontainer: {
    flexDirection: 'row',
    gap: 15,
  },
  marqueeStyle: {
    transform: [{ rotate: '-4deg' }],
    marginTop: 15,
  },
  bottomContainer: {
    backgroundColor: colors.WHITE,
    flex: 1,
    padding: 20,
    marginTop: 20,
  },
  foodtext1: {
    fontFamily: 'outfit-bold',
    textAlign: 'center',
    fontSize: 27,
    color: '#000080',
  },
  foodtext2: {
    fontFamily: 'outfit-bold',
    textAlign: 'center',
    fontSize: 24,
    padding: 20,
  },
  foodtext: {
    textAlign: 'center',   
    fontSize: 17,
    fontFamily: 'outfit',
    marginTop: 10,
    color: 'gray',
  },
  Button: {
    backgroundColor: '#34A853',
    padding: 20,
    borderRadius: 20,
    marginTop:5,
   
  },
  buttonText: {
    textAlign: 'center',
    fontFamily: 'outfit',
    fontSize: 17,
    color: '#fff',
  },
});
