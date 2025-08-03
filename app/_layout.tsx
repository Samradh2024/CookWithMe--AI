// app/_layout.tsx
import { UserContext } from "@/context/UserContext";
import { LogtoConfig, LogtoProvider, UserScope } from "@logto/rn";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as React from 'react';
import { useState } from "react";
import { ActivityIndicator } from "react-native";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function RootLayout() {
const[user,setUser]=useState();

  const [loaded,error] = useFonts({
    'outfit': require('../assets/fonts/Outfit-Regular.ttf'),
    'outfit-bold': require('../assets/fonts/Outfit-Bold.ttf'),
  });

 if (!loaded) {
  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </GestureHandlerRootView>
  )};

  const config: LogtoConfig = {
    endpoint: 'https://tfntys.logto.app',
    appId: 'jsnseg5zedz0ym7idk541',
    scopes: [UserScope.Email],
    
  };
  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LogtoProvider config={config}>
        <UserContext.Provider value={{ user, setUser }}>
          <Stack
            screenOptions={{
              headerShown: false,
            }}
          />
        </UserContext.Provider>
      </LogtoProvider>
    </GestureHandlerRootView>
  );
}
