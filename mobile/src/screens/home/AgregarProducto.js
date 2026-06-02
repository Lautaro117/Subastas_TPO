import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, Icon, IconButton, Text } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { COLORS } from '../../theme/colors';
import { useAppSession } from '../../navigation/AppSessionContext';
import { agregarProducto } from '../../services/itemsApi';

export default function AgregarProducto({ navigation }) {
  const { session } = useAppSession();
  const [descripcionCatalogo, setDescripcionCatalogo] = useState('');
  const [descripcionCompleta, setDescripcionCompleta] = useState('');
  const [fotos, setFotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const seleccionarFoto = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.3,
    });

    if (!result.canceled) {
      setFotos(prev => [...prev, ...result.assets]);
    }
  };

  const eliminarFoto = (index) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };



  const handleSubmit = async () => {
    if (!descripcionCatalogo.trim()) { setError('La descripción corta es requerida'); return; }
    if (!descripcionCompleta.trim()) { setError('La descripción completa es requerida'); return; }
    if (fotos.length < 6) { setError('Se requieren al menos 6 fotos'); return; }

    setLoading(true);
    setError('');
    try {
      await agregarProducto(session.token, descripcionCatalogo, descripcionCompleta, fotos);
      navigation.goBack();
    } catch (e) {
      setError(e.message || 'No se pudo agregar el producto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.container}>

          <View style={styles.header}>
            <IconButton icon="arrow-left" iconColor={COLORS.onSurface} size={22} onPress={() => navigation.goBack()} />
            <Text style={styles.title}>Agregar producto</Text>
          </View>

          <Text style={styles.label}>Descripción corta</Text>
          <TextInput
            value={descripcionCatalogo}
            onChangeText={setDescripcionCatalogo}
            placeholder="Ej: Reloj vintage Omega"
            placeholderTextColor={COLORS.onSurfaceVariant}
            style={styles.textInput}
          />

          <Text style={styles.label}>Descripción completa</Text>
          <TextInput
            value={descripcionCompleta}
            onChangeText={setDescripcionCompleta}
            placeholder="Describí el producto en detalle..."
            placeholderTextColor={COLORS.onSurfaceVariant}
            multiline
            numberOfLines={4}
            style={[styles.textInput, { height: 100, textAlignVertical: 'top' }]}
          />

          <View style={styles.fotosHeader}>
            <Text style={styles.label}>Fotos ({fotos.length}/6 mínimo)</Text>
            <TouchableOpacity onPress={seleccionarFoto}>
              <Icon source="plus-circle-outline" size={26} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.fotosGrid}>
            {fotos.map((foto, index) => (
              <View key={index} style={styles.fotoContainer}>
                <Image source={{ uri: foto.uri }} style={styles.foto} />
                <TouchableOpacity style={styles.fotoDelete} onPress={() => eliminarFoto(index)}>
                  <Icon source="close-circle" size={20} color={COLORS.error} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleSubmit}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            {loading ? <ActivityIndicator size="small" color={COLORS.onPrimary} /> : 'Enviar para revisión'}
          </Button>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1 },
  container: { flex: 1, paddingHorizontal: 24, paddingTop: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '700', color: COLORS.onBackground },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, marginBottom: 8, marginTop: 16 },
  textInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  fotosHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 },
  fotosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fotoContainer: { position: 'relative' },
  foto: { width: 90, height: 90, borderRadius: 10 },
  fotoDelete: { position: 'absolute', top: -6, right: -6 },
  error: { color: COLORS.error, fontSize: 13, marginTop: 12 },
  button: { marginTop: 32, borderRadius: 999, backgroundColor: COLORS.primary },
  buttonContent: { minHeight: 52 },
  buttonLabel: { fontSize: 15, fontWeight: '600', color: COLORS.onPrimary },
});