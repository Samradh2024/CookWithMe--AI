import React from 'react';
import { Image, View } from 'react-native';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836';

export default function RecipeCard({ recipe }: any) {
  if (!recipe) {
    return null;
  }
  // Use fallback if recipeImage is missing or invalid
  const imageUrl = recipe.recipeImage && typeof recipe.recipeImage === 'string' && recipe.recipeImage.trim() !== ''
    ? recipe.recipeImage
    : FALLBACK_IMAGE;

  return (
    <View>
      <Image
        source={{ uri: imageUrl }}
        style={{
          width: '100%',
          height: 270,
        }}
      />
    </View>
  );
}