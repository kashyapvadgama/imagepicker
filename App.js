import React, { useEffect, useState } from 'react';
import { Button, Image, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import mime from 'mime';
import { createClient } from '@supabase/supabase-js';
import { Buffer } from 'buffer';
global.Buffer = global.Buffer || Buffer;


// 🔁 Replace with your Supabase credentials
const SUPABASE_URL = 'https://foimaapdfdhvyrhvpxtw.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaW1hYXBkZmRodnlyaHZweHR3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2ODQyMTAsImV4cCI6MjA2NjI2MDIxMH0.KlooWo0U3CknmaHwV-45smnpXxZaK47O2ijZn4I5IEI';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export default function App() {
  const [imageUri, setImageUri] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [publicUrl, setPublicUrl] = useState(null);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission needed to access gallery.');
      }
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

  return (
    <View style={styles.container}>
      <Button title="Pick and Upload Image" onPress={pickImage} />
      {uploading && <ActivityIndicator size="large" color="blue" style={{ marginTop: 20 }} />}
      {publicUrl && (
        <>
          <Text style={styles.text}>Uploaded Image:</Text>
          <Image source={{ uri: publicUrl }} style={styles.image} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: '#fff',
  },
  image: {
    width: 250, height: 250, marginTop: 20, borderRadius: 10,
  },
  text: {
    marginTop: 15, fontSize: 16,
  },
});
