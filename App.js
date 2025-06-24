import React, { useEffect, useState } from 'react';
import { Button, Image, StyleSheet, Text, View, ActivityIndicator, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import mime from 'mime';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;

const SUPABASE_URL = 'https://foimaapdfdhvyrhvpxtw.supabase.co';

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW1hYXBkZmRodnlyaHZweHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQyMTAsImV4cCI6MjA2NjI2MDIxMH0.KlooWo0U3CknmaHwV-45smnpXxZaK47O2ijZn4I5IEI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [publicUrl, setPublicUrl] = useState(null);
  const [allImages, setAllImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission needed to access gallery.');
      }
      await getAllImages(); // Load all images when app starts
    })();
  }, []);

  const pickImage = async () => {
    setPublicUrl(null);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      uploadToSupabase(uri);
    }
  };

  const uploadToSupabase = async (uri) => {
    setUploading(true);
    const fileExt = uri.split('.').pop();
    const fileName = `${Date.now()}.${fileExt || 'jpg'}`;
    const fileType = mime.getType(uri);

    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const fileBuffer = Buffer.from(base64, 'base64');

      const { data, error } = await supabase.storage
        .from('user-images') // your bucket name
        .upload(fileName, fileBuffer, {
          contentType: fileType,
        });

      if (error) {
        console.error('Upload error:', error.message);
        alert('Upload failed');
      } else {
        const { data: urlData } = supabase
          .storage
          .from('user-images')
          .getPublicUrl(fileName);
        setPublicUrl(urlData.publicUrl);
        alert('Upload successful!');
      }
    } catch (err) {
      console.error('Upload failed:', err.message);
    } finally {
      setUploading(false);
    }
  };

  const getAllImages = async () => {
    try {
      setLoadingImages(true);
      const { data, error } = await supabase.storage
        .from('user-images')
        .list('', { limit: 100 });

      if (error) {
        console.error('Fetch error:', error.message);
        return;
      }

      const urls = data.map((file) =>
        supabase.storage.from('user-images').getPublicUrl(file.name).data.publicUrl
      );

      setAllImages(urls);
    } catch (err) {
      console.error('Error loading images:', err.message);
    } finally {
      setLoadingImages(false);
    }
  };

  return (
    <View style={styles.container}>
      <Button title="Pick and Upload Image" onPress={pickImage} />
      {uploading && <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />}
      <Text style={styles.heading}>All Uploaded Images:</Text>
      {loadingImages ? (
        <ActivityIndicator size="large" color="green" style={{ marginTop: 20 }} />
      ) : (
        <ScrollView style={{ width: '100%' }}>
          {allImages.map((url, index) => (
            <Image key={index} source={{ uri: url }} style={styles.image} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 50, backgroundColor: '#fff',
  },
  heading: {
    fontSize: 18, fontWeight: 'bold', marginVertical: 20,
  },
  image: {
    width: 300, height: 200, resizeMode: 'cover', marginVertical: 10, alignSelf: 'center', borderRadius: 10,
  },
});
