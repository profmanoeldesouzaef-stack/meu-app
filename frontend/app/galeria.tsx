export { GaleriaView as default, GaleriaView } from "../src/views/GaleriaView";
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function Galeria() {
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPhotos();
  }, []);

  const fetchPhotos = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('challenge_photos')
      .select('*')
      .order('votes_count', { ascending: false });

    if (error) {
      console.log('Erro ao buscar fotos:', error);
    } else {
      setPhotos(data || []);
    }
    setLoading(false);
  };

  const handleLike = async (photoId: string) => {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      Alert.alert('Atenção', 'Você precisa estar logado no aplicativo para votar!');
      return;
    }

    const userId = userData.user.id;

    const { error: insertError } = await supabase
      .from('photo_votes')
      .insert({ photo_id: photoId, user_id: userId });

    if (insertError) {
      await supabase
        .from('photo_votes')
        .delete()
        .match({ photo_id: photoId, user_id: userId });
    }

    fetchPhotos();
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#ffffff" style={{ marginTop: 50 }} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Desafio Vyra</Text>
      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={{ uri: item.photo_url || "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=400&q=80" }} style={styles.image} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.participant_name}</Text>
              <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id)}>
                <Text style={styles.likeText}>❤️ {item.votes_count}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={{color: '#fff', textAlign: 'center'}}>Nenhuma foto no desafio ainda.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 15, textAlign: 'center', marginTop: 40 },
  card: { backgroundColor: '#1e1e1e', borderRadius: 10, marginBottom: 20, overflow: 'hidden' },
  image: { width: '100%', height: 350, resizeMode: 'cover' },
  info: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, alignItems: 'center' },
  name: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  likeButton: { backgroundColor: '#333', padding: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center' },
  likeText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});