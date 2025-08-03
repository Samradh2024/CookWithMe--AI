import { colors } from '@/services/Colors';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity } from 'react-native';
export default function Button({label,onPress,icon = '',loading=false}:any) {
  return (
    <TouchableOpacity onPress={onPress} 
    disabled={loading}
    style={styles.Button}>

      {loading?<ActivityIndicator color={colors.WHITE}/>:

        <Ionicons name={icon} size={24} color="white" />}
              <Text style={styles.ButtonText}>{label}</Text>
            </TouchableOpacity>
  )
}
const styles = StyleSheet.create({
    Button: {
    backgroundColor: '#34A853',
    padding: 20,
    borderRadius: 20,
    marginTop: 15,
    zIndex: 10,
    elevation: 10,
    width:'100%',
    display:'flex',
    gap:10,
    justifyContent:'center',
    flexDirection:'row',
  },
  ButtonText:{
    textAlign:'center',
    color: colors.WHITE,
    fontSize:17,
    fontFamily:'outfit',
  }
})