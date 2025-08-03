import RecipeCard from '@/Components/RecipeCard';
import { colors } from '@/services/Colors';
import GlobalApi from '@/services/GlobalApi';
import { useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

export default function RecipeByCategory() {
  const { categoryname } = useLocalSearchParams();
  const [recipeList, setRecipeList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const GetRecipeListByCategory = async () => {
    try {
      setLoading(true);
      console.log('=== DEBUGGING API CALL ===');
      console.log('Category name:', categoryname);
      console.log('API Key exists:', !!process.env.EXPO_PUBLIC_STRAPI_API_KEY);
      console.log('API Key first 10 chars:', process.env.EXPO_PUBLIC_STRAPI_API_KEY?.substring(0, 10) + '...');
      
      // Test basic connectivity to Strapi server
      try {
        console.log('Testing Strapi server connectivity...');
        const response = await fetch('http://172.25.214.2:1337/api');
        console.log('Strapi server response status:', response.status);
        if (response.ok) {
          const data = await response.text();
          console.log('Strapi server response:', data.substring(0, 200));
        }
      } catch (connectErr: any) {
        console.error('Strapi server connectivity test failed:', connectErr.message);
      }
      
      // First, try to get all recipes to test the API connection
      try {
        console.log('Testing basic API connection...');
        const testResult = await GlobalApi.GetCategories();
        console.log('Categories API works:', testResult.data);
      } catch (testErr: any) {
        console.error('Basic API test failed:', testErr.response?.data);
      }
      
      const result = await GlobalApi.GetRecipeByCategory(categoryname as string);
      console.log('=== API RESPONSE ===');
      console.log('Full result:', result);
      console.log('Data structure:', result?.data);
      console.log('Recipe list:', result?.data?.data);
      
      if (result?.data?.data && Array.isArray(result.data.data)) {
        console.log('First recipe item:', result.data.data[0]);
        console.log('Recipe image structure:', result.data.data[0]?.Image);
        console.log('Recipe image URL:', result.data.data[0]?.Image?.url);
      }
      
      setRecipeList(result?.data?.data || []);
    } catch (err: any) {
      console.error('=== ERROR DETAILS ===');
      console.error('Error fetching recipes:', err);
      console.error('Error message:', err.message);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      console.error('Error headers:', err.response?.headers);
      console.error('Request URL:', err.config?.url);
      console.error('Request method:', err.config?.method);
      
      // If it's a 401 error, show a helpful message
      if (err.response?.status === 401) {
        setError('API Key not configured. Please add EXPO_PUBLIC_STRAPI_API_KEY to your .env file');
      } else {
        setError(err.message || 'Unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    GetRecipeListByCategory();
  }, []);

  if (loading) {
    return (
      <View style={{
        padding: 25,
        paddingTop: 50,
        backgroundColor: colors.WHITE,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text>Loading recipes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{
        padding: 25,
        paddingTop: 50,
        backgroundColor: colors.WHITE,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <Text style={{textAlign: 'center', marginBottom: 20}}>Error: {error}</Text>
        <Text style={{textAlign: 'center', fontSize: 12, color: '#666'}}>
          To fix this, create a .env file in your project root with:
          {'\n'}EXPO_PUBLIC_STRAPI_API_KEY=your_api_key_here
        </Text>
      </View>
    );
  }

  return (
    <View style={{
      padding: 25,
      paddingTop: 50,
      backgroundColor: colors.WHITE,
      height: '100%',
    }}>
      <Text style={{
        fontFamily: 'outfit-bold',
        fontSize: 24,
      }}>Browse {categoryname} Recipes</Text>

      {recipeList && recipeList.length > 0 ? (
        <FlatList
          data={recipeList}
          renderItem={({item,index})=>{
            console.log('Recipe item:', item);
            return (
              <View style={{marginBottom: 15}}>
                <RecipeCard recipe={item} 
                style={{
                  width: '100%',
                  height: 200,
                }} />
              </View>
            );
          }}
          keyExtractor={(item, index) => index.toString()}
        />
      ) : (
        <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
          <Text>No recipes found for {categoryname}</Text>
        </View>
      )}
    </View>
  );
}