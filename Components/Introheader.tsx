import { UserContext } from '@/context/UserContext';
import React, { useContext, useState } from 'react';
import { Image, Switch, Text, View } from 'react-native';

export default function IntroHeader() {
  const { user } = useContext(UserContext);
  const[isEnabled,setIsEnabled]=useState(false);
  return (
    <View style={{
      display:'flex',
      flexDirection:'row',
      alignItems:'center',
      justifyContent:'space-between',
    }}>
    <View style={{
      display:'flex',
      flexDirection:'row',
      alignItems:'center',
      gap: 10,
    }} >
      {user?.picture ? (
        <Image 
          source={{ uri: user.picture }}
          style={{
            width: 40,
            height: 40,
          }} 
        />
      ) : (
        // Fallback when no picture is available
        <View style={{
          width: 40,
          height: 40,
          backgroundColor: '#ccc',
          borderRadius: 20,
          marginTop:15,
        }} />
      )}
      <Text style={{
        fontFamily: 'outfit-bold',
        fontSize: 20,
        color: '#000',
        marginTop:20,
      }}>Hello, {user?.name}</Text>
    </View>
    <View style={{
      display:'flex',
      flexDirection:'row',
      alignItems:'center',
      gap: 4,
      
    }}>
      <Text style={{
        fontFamily:'outfit',
        fontSize:16,
        marginTop:20,
        
      }}>{isEnabled?'Veg':'Non-Veg'}</Text>
    <Switch 
    style={{marginTop:20,}}
    value={isEnabled}
    onValueChange={()=>setIsEnabled(!isEnabled)}
    />
    </View>
    </View>
  );
}