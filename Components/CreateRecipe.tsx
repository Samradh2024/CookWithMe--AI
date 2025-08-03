import { UserContext } from '@/context/UserContext';
import { colors } from '@/services/Colors';
import GlobalApi from '@/services/GlobalApi';
import Prompt from '@/services/Prompt';
import * as React from 'react';
import { useContext, useRef, useState } from 'react';
import { Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import ActionSheet, { ActionSheetRef } from "react-native-actions-sheet";
import Button from './Button';
import LoadingDialog from './LoadingDialog';

export default function CreateRecipe() {
  const [userInput, setUserInput] = useState<string>('');
  const [recipeOptions, setRecipeOptions] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const actionSheetRef = useRef<ActionSheetRef>(null);
  const [openLoading, setOpenLoading] = useState(false);
  const [lastRequestTime, setLastRequestTime] = useState<number>(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const {user,setUser}=useContext(UserContext);
  
  console.log('=== CREATERECIPE COMPONENT RENDERED ===');
  console.log('User Context Available:', !!user);
  console.log('User Email:', user?.email);
  
  const [retryCount, setRetryCount] = useState(0);

  // Rate limiting: minimum 3 seconds between requests, with exponential backoff
  const BASE_RATE_LIMIT_DELAY = 3000; // 3 seconds
  const MAX_RETRIES = 3;

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const checkRateLimit = (): boolean => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    const currentDelay = isRateLimited ? BASE_RATE_LIMIT_DELAY * Math.pow(2, retryCount) : BASE_RATE_LIMIT_DELAY;
    
    if (timeSinceLastRequest < currentDelay) {
      const remainingTime = Math.ceil((currentDelay - timeSinceLastRequest) / 1000);
      Alert.alert(
        'Rate Limit', 
        `Please wait ${remainingTime} second(s) before making another request.`
      );
      return false;
    }
    
    setLastRequestTime(now);
    return true;
  };

  const handleRateLimitError = () => {
    setIsRateLimited(true);
    setRetryCount(prev => Math.min(prev + 1, MAX_RETRIES));
    
    const waitTime = BASE_RATE_LIMIT_DELAY * Math.pow(2, retryCount);
    const waitMinutes = Math.ceil(waitTime / 60000);
    
    Alert.alert(
      'Rate Limit Exceeded', 
      `Too many requests. Please wait ${waitMinutes} minute(s) before trying again.`,
      [
        {
          text: 'OK',
          onPress: () => {
            // Reset rate limit after the wait time
            setTimeout(() => {
              setIsRateLimited(false);
              setRetryCount(0);
            }, waitTime);
          }
        }
      ]
    );
  };

  const makeApiCallWithRetry = async (apiCall: () => Promise<any>, maxRetries: number = 2) => {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error: any) {
        const isRateLimitError = error?.message?.includes('429') || 
                                error?.message?.includes('rate limit') ||
                                error?.message?.includes('Provider returned error');
        
        const isNetworkError = error?.message?.includes('Network Error') || 
                              error?.code === 'NETWORK_ERROR' ||
                              error?.response?.status === 0;
        
        if ((isRateLimitError || isNetworkError) && attempt < maxRetries) {
          const backoffDelay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(`${isRateLimitError ? 'Rate limited' : 'Network error'}, retrying in ${backoffDelay}ms (attempt ${attempt + 1}/${maxRetries + 1})`);
          await sleep(backoffDelay);
          continue;
        }
        
        throw error;
      }
    }
  };

  const cleanAndParseJSON = (content: string): any => {
    console.log('Raw content received:', content);
    
    // Remove any leading/trailing whitespace
    let cleanedContent = content.trim();

    // Remove leading/trailing code block markers if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.slice(7).trim();
    }
    if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.slice(3).trim();
    }
    if (cleanedContent.endsWith('```')) {
      cleanedContent = cleanedContent.slice(0, -3).trim();
    }

    // If content starts with common non-JSON responses, try to extract JSON
    const commonPrefixes = ['Okay', 'Of course', 'Here', 'Sure', 'I\'ll', 'Let me'];
    for (const prefix of commonPrefixes) {
      if (cleanedContent.toLowerCase().startsWith(prefix.toLowerCase())) {
        console.log(`Removing prefix: "${prefix}"`);
        cleanedContent = cleanedContent.substring(prefix.length).trim();
        break;
      }
    }

    // Try to extract JSON from markdown/code blocks
    const jsonCodeBlockMatch = cleanedContent.match(/```json\s*([\s\S]*?)\s*```/i);
    if (jsonCodeBlockMatch) {
      console.log('Found JSON code block');
      try {
        return JSON.parse(jsonCodeBlockMatch[1].trim());
      } catch (error) {
        console.log('Failed to parse JSON from code block:', error);
      }
    }

    // Try to extract JSON from any code block
    const codeBlockMatch = cleanedContent.match(/```\s*([\s\S]*?)\s*```/i);
    if (codeBlockMatch) {
      console.log('Found code block');
      try {
        return JSON.parse(codeBlockMatch[1].trim());
      } catch (error) {
        console.log('Failed to parse JSON from code block:', error);
      }
    }


    // Try to find JSON object/array in the content (robust: find first { or [)
    const firstJsonIndex = cleanedContent.search(/[\[{]/);
    if (firstJsonIndex !== -1) {
      const possibleJson = cleanedContent.slice(firstJsonIndex);
      try {
        return JSON.parse(possibleJson);
      } catch (error) {
        console.log('Failed to parse extracted JSON from first { or [:', error);
      }
    }

    // If no JSON found, try to parse the entire content as JSON
    try {
      return JSON.parse(cleanedContent);
    } catch (error) {
      console.log('Failed to parse content as JSON:', error);
    }

    // If all parsing attempts fail, throw a descriptive error
    throw new Error(`Unable to parse JSON from content. Content starts with: "${cleanedContent.substring(0, 100)}..."`);
  };

  const OnGenerate = async () => {
    console.log('=== ONGENERATE FUNCTION CALLED ===');
    console.log('User Input:', userInput);
    console.log('User Context:', user);
    
    if (!userInput || userInput.trim() === '') {
      Alert.alert('Please enter details');
      return;
    }

    if (!checkRateLimit()) {
      return;
    }

    setLoading(true);
    try {
      const result = await makeApiCallWithRetry(async () => {
        return await GlobalApi.AiModel(userInput + Prompt.GENERATE_RECIPE_OPTION_PROMPT);
      });
      
      console.log('AIModel result:', result);
      const content = result?.choices?.[0]?.message?.content;
      console.log('AIModel content:', content);
      
      if (content) {
        try {
          const parsedData = cleanAndParseJSON(content);
          setRecipeOptions(parsedData);
        } catch (err) {
          console.error('JSON parsing error:', err);
          Alert.alert(
            'Error', 
            `Failed to parse recipe data. The AI returned an unexpected format.\n\nRaw response:\n${content.substring(0, 200)}...`
          );
          setRecipeOptions([{ Name: 'Raw Response', Description: content }]);
        }
      } else {
        Alert.alert('Error', 'No recipe data received from API.');
        setRecipeOptions([]);
      }
      actionSheetRef.current?.show();
    } catch (error: any) {
      console.log('OnGenerate error:', error);
      
      // Handle rate limit errors specifically
      if (error?.message?.includes('429') || 
          error?.message?.includes('rate limit') ||
          error?.message?.includes('Provider returned error')) {
        handleRateLimitError();
      } else {
        Alert.alert('Error', `Failed to generate recipe.\n${error?.message || error}`);
      }
      setRecipeOptions([]);
    } finally {
      setLoading(false);
    }
  };

  const GenerateCompleteRecipe = async (option: any) => {
    console.log('=== STARTING RECIPE GENERATION ===');
    console.log('Selected Option:', JSON.stringify(option, null, 2));
    
    if (!option) {
      Alert.alert('Error', 'Invalid recipe option selected.');
      return;
    }

    if (!checkRateLimit()) {
      return;
    }

    actionSheetRef.current?.hide();
    setOpenLoading(true);
    
    try {
      const recipeName = option.recipeName || option.Name || option.name || 'Unknown Recipe';
      const description = option.description || option.Description || '';
      
      const PROMPT = `RecipeName:${recipeName}Description:${description}${Prompt.GENERATE_COMPLETE_RECIPE_PROMPT}`;
      
      const result = await makeApiCallWithRetry(async () => {
        return await GlobalApi.AiModel(PROMPT);
      });
      
      const content: any = result?.choices?.[0]?.message?.content;
      
      if (!content) {
        throw new Error('No content received from AI model');
      }
      
      let JSONContent;
      try {
        JSONContent = cleanAndParseJSON(content);
      } catch (parseError) {
        console.error('JSON parsing error in GenerateCompleteRecipe:', parseError);
        console.log('Raw content:', content);
        throw new Error(`Failed to parse recipe content: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
      }
      
      console.log('Parsed JSON content:', JSONContent);
      
      if (!JSONContent?.imagePrompt) {
        console.error('Missing imagePrompt field. Available fields:', Object.keys(JSONContent || {}));
        console.error('Full JSON content:', JSON.stringify(JSONContent, null, 2));
        throw new Error(`No image prompt found in recipe data. Available fields: ${Object.keys(JSONContent || {}).join(', ')}`);
      }
      
      let imageUrl = '';
      try {
        imageUrl = await GenerateRecipeImage(JSONContent.imagePrompt);
      } catch (imageError: any) {
        console.error('Image generation failed:', imageError);
        console.error('Image error details:', {
          message: imageError.message,
          code: imageError.code,
          status: imageError.response?.status,
          statusText: imageError.response?.statusText,
          data: imageError.response?.data
        });
        
        // Ask user if they want to continue without image
        Alert.alert(
          'Image Generation Failed',
          `${imageError.message}\n\nWould you like to continue without the image?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setOpenLoading(false);
                return;
              }
            },
            {
              text: 'Continue Without Image',
              onPress: async () => {
                try {
                  const insertedRecordResult = await SaveToDb(JSONContent, '');
                  console.log(insertedRecordResult);
                  Alert.alert('Success', 'Recipe created successfully (without image)!');
                } catch (dbError: any) {
                  console.error('SaveToDb error:', dbError);
                  Alert.alert('Error', `Failed to save recipe: ${dbError.message}`);
                } finally {
                  setOpenLoading(false);
                }
              }
            }
          ]
        );
        return;
      }
      
      const insertedRecordResult = await SaveToDb(JSONContent, imageUrl);
      console.log('=== RECIPE CREATION SUCCESS ===');
      console.log('Recipe ID:', insertedRecordResult?.id);
      console.log('Recipe Data:', JSON.stringify(insertedRecordResult, null, 2));
      console.log('User Credits Updated:', user?.credits - 1);
      console.log('=== END RECIPE CREATION ===');
      
      Alert.alert('Success', 'Recipe created successfully!');
    } catch (error: any) {
      console.error('GenerateCompleteRecipe error:', error);
      
      // Handle rate limit errors specifically
      if (error?.message?.includes('429') || 
          error?.message?.includes('rate limit') ||
          error?.message?.includes('Provider returned error')) {
        handleRateLimitError();
      } else {
        Alert.alert('Error', `Failed to generate complete recipe.\n${error?.message || error}`);
      }
    } finally {
      setOpenLoading(false);
    }
  };

  const GenerateRecipeImage = async (imagePrompt: string) => {
    if (!imagePrompt) {
      throw new Error('Image prompt is required');
    }
    
    console.log('=== GENERATING RECIPE IMAGE ===');
    console.log('Image prompt:', imagePrompt);
    console.log('Aiguru Lab API Key exists:', !!process.env.EXPO_PUBLIC_AIGURULAB_API_KEY);
    
    try {
      const result = await makeApiCallWithRetry(async () => {
        return await GlobalApi.GenerateAiImage(imagePrompt);
      });
      
      console.log('Image generation result:', result);
      console.log('Image URL:', result.data?.image);
      
      if (!result.data?.image) {
        throw new Error('No image URL returned from Aiguru Lab API');
      }
      
      return result.data.image;
    } catch (error: any) {
      console.error('GenerateRecipeImage error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      
      // Handle different types of errors
      if (error?.message?.includes('429') || 
          error?.message?.includes('rate limit') ||
          error?.message?.includes('Provider returned error')) {
        throw new Error('Rate limit exceeded for image generation. Please wait before trying again.');
      } else if (error?.message?.includes('Network Error') || 
                 error?.code === 'NETWORK_ERROR' ||
                 error?.response?.status === 0) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      } else if (error?.response?.status === 401) {
        throw new Error('Aiguru Lab API key is invalid or expired. Please check your configuration.');
      } else if (error?.response?.status === 403) {
        throw new Error('Aiguru Lab access denied. Please check your API permissions.');
      } else if (error?.response?.status >= 500) {
        throw new Error('Aiguru Lab service is temporarily unavailable. Please try again later.');
      } else if (error?.message?.includes('not configured')) {
        throw new Error('Aiguru Lab API key is not configured. Please add EXPO_PUBLIC_AIGURULAB_API_KEY to your .env file');
      } else {
        throw new Error(`Failed to generate image: ${error?.message || error?.response?.data?.message || error}`);
      }
    }
  };

  // Normalize keys to match Strapi model
  function normalizeRecipeKeys(obj: any) {
    const keyMap: Record<string, string> = {
      RecipeName: 'recipeName',
      Description: 'description',
      Ingredients: 'ingredients',
      Steps: 'steps',
      Calories: 'calories',
      CookTime: 'cookTime',
      ServeTo: 'serveTo',
      ImagePrompt: 'imagePrompt',
      Category: 'category',
      // Add more mappings as needed
    };
    const newObj: Record<string, any> = {};
    for (const key in obj) {
      const mappedKey = keyMap[key] || key.charAt(0).toLowerCase() + key.slice(1);
      newObj[mappedKey] = obj[key];
    }
    return newObj;
  }

  const SaveToDb = async (content: any, imageUrl: string) => {
    if (!content) {
      throw new Error('Recipe content is required');
    }
    // Try to get email from user context, fallback to user?.profile?.email or user?.userEmail if available
    let userEmail = user?.email || user?.profile?.email || user?.userEmail || '';
    if (!userEmail || userEmail.trim() === '') {
      // Try to get email from localStorage/sessionStorage if available (for some auth flows)
      try {
        userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
      } catch (e) {}
    }
    if (!userEmail || userEmail.trim() === '') {
      // Fallback to a default anonymous email
      userEmail = 'anonymous@cookwithme.ai';
      console.warn('User email not found. Using fallback email:', userEmail);
    }
    try {
      console.log('=== SAVING RECIPE TO DATABASE ===');
      console.log('User Info:', {
        email: user?.email,
        documentId: user?.documentId,
        currentCredits: user?.credits
      });
      // If imageUrl is a base64 string, prepend the data URI prefix
      let finalImageUrl = imageUrl;
      if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:image')) {
        finalImageUrl = 'data:image/png;base64,' + imageUrl;
      }
      // Hardcode a test image if imageUrl is still empty
      const testImageUrl = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';
      const data = {
        ...normalizeRecipeKeys(content),
        recipeImage: finalImageUrl && finalImageUrl.trim() !== '' ? finalImageUrl : testImageUrl,
        userEmail: userEmail, // Use the best available email
      };
      console.log('Recipe Data to Save:', JSON.stringify(data, null, 2));
      console.log('Image URL being saved:', data.recipeImage);
      const userData = {
        name: user?.name,
        email: user?.email,
        picture: user?.picture,
        credits: user?.credits - 1,
        pref: null
      };
      console.log('User Data to Update:', JSON.stringify(userData, null, 2));
      console.log('Creating recipe...');
      const result = await GlobalApi.CreateNewRecipe(data);
      console.log('Recipe Creation Result:', JSON.stringify(result.data, null, 2));
      console.log('Updating user credits...');
      const updateUser = await GlobalApi.UpdateUser(user?.documentId, userData);
      console.log('User Update Result:', JSON.stringify(updateUser.data, null, 2));
      console.log('=== DATABASE SAVE COMPLETE ===');
      return result.data.data;
    } catch (error: any) {
      console.error('SaveToDb error:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw new Error(`Failed to save recipe: ${error?.message || error}`);
    }
  };

  return (
    <View style={styles.container}>
      <Image source={require('./../assets/images/pan.gif')} style={styles.PanImage} />
      <Text style={styles.Heading}>Heat up your kitchen, Create your next favorite meal.</Text>
      <Text style={styles.Heading2}>Make Something for your DEAREST!</Text>
      <TextInput
        style={styles.textInput}
        multiline={true}
        numberOfLines={10}
        keyboardType='default'
        placeholder='What do you want to cook, Enter the Ingredients etc..'
        value={userInput}
        onChangeText={(value) => setUserInput(value)}
      />
      <Button
        label={'Generate Recipe!'}
        onPress={() => {
          console.log('=== BUTTON PRESSED ===');
          OnGenerate();
        }}
        loading={loading}
        icon={'sparkles'}
      />
      <LoadingDialog visible={openLoading} />
      <ActionSheet ref={actionSheetRef}>
        <View style={styles.ActionSheetContainer}>
          <Text style={styles.Heading}>Select Recipe!</Text>
          <View>
            {Array.isArray(recipeOptions) && recipeOptions.length > 0 ? (
              recipeOptions.map((item: any, index: any) => (
                <TouchableOpacity
                  onPress={() => {
                    console.log('=== RECIPE OPTION SELECTED ===');
                    console.log('Selected Item:', item);
                    GenerateCompleteRecipe(item);
                  }}
                  key={index}
                  style={styles.recipeOptionContainer}
                >
                  {/* Show all keys if Name/Description missing */}
                  {item?.Name || item?.name ? (
                    <Text style={styles.ActionSheetText}>{item?.Name || item?.name}</Text>
                  ) : (
                    Object.keys(item).map((key) => (
                      <Text key={key} style={styles.ActionSheetText}>
                        {key}: {String(item[key])}
                      </Text>
                    ))
                  )}
                  {item?.Description || item?.description ? (
                    <Text style={styles.ActionSheetText2}>
                      {item?.Description || item?.description}
                    </Text>
                  ) : null}
                </TouchableOpacity>
              ))
            ) : typeof recipeOptions === 'object' && recipeOptions !== null ? (
              <View style={styles.recipeOptionContainer}>
                {Object.keys(recipeOptions).map((key) => (
                  <Text key={key} style={styles.ActionSheetText}>
                    {key}: {String(recipeOptions[key])}
                  </Text>
                ))}
              </View>
            ) : (
              <Text style={styles.ActionSheetText2}>No recipes available</Text>
            )}
          </View>
        </View>
      </ActionSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    padding: 15,
    backgroundColor: colors.SECONDARY,
    borderRadius: 20,
    display: 'flex',
    alignItems: 'center',
    marginLeft: 15,
    marginRight: 15,
  },
  PanImage: {
    height: 80,
    width: 80,
  },
  Heading: {
    fontFamily: 'outfit',
    fontSize: 23,
    textAlign: 'center',
  },
  Heading2: {
    fontFamily: 'outfit',
    fontSize: 15,
    marginTop: 8,
  },
  textInput: {
    backgroundColor: colors.WHITE,
    borderRadius: 12,
    marginTop: 10,
    width: '100%',
    height: 140,
    padding: 15,
    textAlignVertical: 'top',
    fontSize: 15,
  },
  ActionSheetContainer: {
    padding: 25,
  },
  ActionSheetText: {
    fontFamily: 'outfit-bold',
    fontSize: 17,
  },
  ActionSheetText2: {
    fontFamily: 'outfit',
    color: colors.GRAY,
  },
  recipeOptionContainer: {
    padding: 15,
    borderWidth: 0.2,
    borderRadius: 15,
    marginTop: 15,
  },
});