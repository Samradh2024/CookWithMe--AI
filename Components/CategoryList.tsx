import GlobalApi from '@/services/GlobalApi';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FlatList } from 'react-native-gesture-handler';

export default function CategoryList() {
  const [categoryList, setCategoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    GetCategoryList();
  }, []);

  const GetCategoryList = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await GlobalApi.GetCategories();
      console.log('Categories result:', result?.data?.data);
      
      if (result?.data?.data) {
        setCategoryList(result.data.data);
      } else {
        setError('No categories found');
        setCategoryList([]);
      }
    } catch (error: any) {
      console.error('GetCategoryList error:', error);
      setError('Failed to load categories');
      setCategoryList([]);
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleImageError = (item: any) => {
    console.log('Image failed to load for category:', item?.Name);
    // You could set a fallback image here if needed
  };

  const renderCategoryItem = ({ item, index }: any) => (
    <TouchableOpacity
      style={styles.category}
      onPress={() => router.push({ pathname: '/recipe-by-category', params: {categoryname: item?.Name} })}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item?.Image?.url ? (
          <Image
            source={{ uri: item.Image.url }}
            style={styles.categoryImage}
            onError={() => handleImageError(item)}
            defaultSource={require('../assets/images/logo.png')} // Fallback image
          />
        ) : (
          <View style={styles.placeholderImage}>
            <Text style={styles.placeholderText}>?</Text>
          </View>
        )}
      </View>
      <Text style={styles.CategoryName} numberOfLines={2}>
        {item?.Name || 'Unknown Category'}
      </Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Category</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#34A853" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.heading}>Category</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Category</Text>
      {categoryList.length > 0 ? (
        <FlatList
          data={categoryList}
          numColumns={4}
          renderItem={renderCategoryItem}
          keyExtractor={(item, index) => item?.id?.toString() || index.toString()}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No categories available</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  heading: {
    fontFamily: 'outfit-bold',
    fontSize: 17,
    padding: 10,
  },
  category: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 5,
  },
  imageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  categoryImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  placeholderImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
    fontFamily: 'outfit-bold',
  },
  CategoryName: {
    fontFamily: 'outfit',
    marginTop: 5,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 80,
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontFamily: 'outfit',
    color: '#666',
  },
  errorContainer: {
    padding: 20,
    alignItems: 'center',
  },
  errorText: {
    fontFamily: 'outfit',
    color: '#ff0000',
    textAlign: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'outfit',
    color: '#666',
    textAlign: 'center',
  },
});