import { UserContext } from "@/context/UserContext";
import { useLogto } from '@logto/rn';
import { useRouter } from 'expo-router';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import GlobalApi from '../services/GlobalApi';
import Landing from "./Landing";

export default function Index() {
  const { getIdTokenClaims, isAuthenticated, isInitialized } = useLogto();
  const { setUser } = useContext(UserContext);
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('isInitialized:', isInitialized);
    console.log('isAuthenticated:', isAuthenticated);

    if (isInitialized) {
      if (isAuthenticated) {
        getIdTokenClaims().then(async (userData) => {
          console.log("-- userData:", userData);
          console.log("userData keys:", Object.keys(userData));
          console.log("Full userData:", userData);

          if (userData?.email) {
            try {
              const result = await GlobalApi.getUserByEmail(userData?.email);
              if (!result.data.data) {
                const data = {
                  Email: userData.email,
                  Name: userData.name,
                  Picture: userData.picture
                };
                const resp = await GlobalApi.CreateNewUser(data);
                setUser(resp.data.data);
                router.replace('/(tabs)/Home');
              } else {
                setUser(result?.data?.data[0]);
                router.replace('/(tabs)/Home');
              }
            } catch (error) {
              console.log("API error:", error);
              setLoading(false);
            }
          } else {
            console.log("No email in user data");
            setLoading(false);
          }
        });
      } else {
        setLoading(false);
      }
    }
  }, [isAuthenticated, isInitialized]);

  if (loading || !isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <Landing />;
  }

  // Temporary fallback
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
