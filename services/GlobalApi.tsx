import axios from "axios";
import OpenAI from 'openai';

// Debug API keys on startup
console.log('=== API KEYS DEBUG ===');
console.log('Strapi API Key exists:', !!process.env.EXPO_PUBLIC_STRAPI_API_KEY);
console.log('Aiguru Lab API Key exists:', !!process.env.EXPO_PUBLIC_AIGURULAB_API_KEY);
console.log('OpenRouter API Key exists:', !!process.env.EXPO_PUBLIC_OPENROUTER_API_KEY);

const axiosClient=axios.create({
    baseURL:'http://10.114.160.145:1337/api',
    headers:{
        Authorization:`Bearer ${process.env.EXPO_PUBLIC_STRAPI_API_KEY}`
    }
})

// Add request interceptor for debugging
axiosClient.interceptors.request.use(
  (config) => {
    console.log('=== AXIOS REQUEST ===');
    console.log('URL:', config.url);
    console.log('Method:', config.method);
    console.log('Headers:', config.headers);
    console.log('Base URL:', config.baseURL);
    console.log('Authorization header:', config.headers?.Authorization);
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosClient.interceptors.response.use(
  (response) => {
    console.log('=== AXIOS RESPONSE ===');
    console.log('Status:', response.status);
    console.log('Data:', response.data);
    return response;
  },
  (error) => {
    console.error('=== AXIOS ERROR ===');
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
    return Promise.reject(error);
  }
);

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.EXPO_PUBLIC_OPENROUTER_API_KEY,
  
});

const BASE_URL='https://aigurulab.tech';

const getUserByEmail=(email:string)=>axiosClient.get('/user-lists?filters[Email][$eq]='+email);
const CreateNewUser=(data:any)=>axiosClient.post('/user-lists',{data:data});
const CreateNewRecipe=(data:any)=>axiosClient.post('/recipes',{data:data});

// Fixed GetRecipeByCategory function with proper URL encoding
const GetRecipeByCategory=async(category:string)=>{
    const encodedCategory = encodeURIComponent(category);
    // Filter by related category name (for Strapi relation field)
    return axiosClient.get(`/recipes?filters[category][name][$contains]=${encodedCategory}&populate=*`);
};

const GetCategories=()=>axiosClient.get('/categories?populate=*');
const UpdateUser=(uid:any,data:any)=>axiosClient.put('/user-lists/'+uid,{data:data});

const AiModel=async(prompt:string) => await openai.chat.completions.create({
    model: 'google/gemini-2.0-flash-exp:free',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format:{type:'json_object'}
  });

// Enhanced GenerateAiImage function with better error handling and debugging
const GenerateAiImage=async(input:string) => {
  console.log('=== GENERATING AI IMAGE ===');
  console.log('Input prompt:', input);
  console.log('Aiguru Lab API Key exists:', !!process.env.EXPO_PUBLIC_AIGURULAB_API_KEY);
  console.log('Aiguru Lab API Key length:', process.env.EXPO_PUBLIC_AIGURULAB_API_KEY?.length);
  
  if (!process.env.EXPO_PUBLIC_AIGURULAB_API_KEY) {
    throw new Error('Aiguru Lab API key is not configured. Please add EXPO_PUBLIC_AIGURULAB_API_KEY to your .env file');
  }
  
  try {
    const response = await axios.post(BASE_URL+'/api/generate-image',
      {
        width: 1024,
        height: 1024,
        input: input,
        model: 'sdxl', // 'flux'
        aspectRatio: "1:1" // Applicable to Flux model only
      },
      {
        headers: {
          'x-api-key': process.env.EXPO_PUBLIC_AIGURULAB_API_KEY,
          'Content-Type': 'application/json',
        },
        timeout: 60000, // 60 second timeout
      }
    );
    
    console.log('Aiguru Lab API Response:', response.data);
    return response;
  } catch (error: any) {
    console.error('Aiguru Lab API Error:', error);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    throw error;
  }
};

export default{     
    getUserByEmail,
    CreateNewUser,
    GetCategories,
    AiModel,
    GenerateAiImage,
    CreateNewRecipe,
    UpdateUser,
    GetRecipeByCategory,
}
