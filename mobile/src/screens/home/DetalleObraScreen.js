import React, { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, Button, IconButton, Text } from 'react-native-paper';

import { COLORS } from '../../theme/colors';
import { useAppSession } from '../../navigation/AppSessionContext';
import { agregarProducto } from '../../services/itemsApi';

const TIPO_LABEL = { arte: 'Obra de arte', diseno: 'Objeto de diseñador' };

export default function DetalleObraScreen({ navigation, route }) {
  const { session } = useAppSession();
  const { descripcionCatalogo, descripcionCompleta, fotos, tipo } = route.params;

  const [nombreAutor, setNombreAutor] = useState('');
  const [fechaCreacion, setFechaCreacion] = useState('');
  const [historia, setHistoria] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!nombreAutor.trim()) { setError('El nombre del artista o diseñador es requerido'); return; }
    if (!historia.trim()) { setError('La historia del objeto es requerida'); return; }

    if (fechaCreacion.trim() && !/^\d{4}-\d{2}-\d{2}$/.test(fechaCreacion.trim())) {
      setError('La fecha debe tener el formato AAAA-MM-DD (ej: 1889-03-15)');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await agregarProducto(
        session.token,
        descripcionCatalogo,
        descripcionCompleta,
        fotos,
        tipo,
        { nombreAutor: nombreAutor.trim(), fechaCreacion: fechaCreacion.trim() || null, historia: historia.trim() }
      );
      navigation.popToTop();
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
            <View>
              <Text style={styles.title}>Datos del autor</Text>
              <Text style={styles.subtitle}>{TIPO_LABEL[tipo]}</Text>
            </View>
          </View>

          <Text style={styles.label}>Nombre del artista / diseñador</Text>
          <TextInput
            value={nombreAutor}
            onChangeText={setNombreAutor}
            placeholder="Ej: Vincent van Gogh"
            placeholderTextColor={COLORS.onSurfaceVariant}
            style={styles.textInput}
          />

          <Text style={styles.label}>Fecha de creación <Text style={styles.opcional}>(opcional)</Text></Text>
          <TextInput
            value={fechaCreacion}
            onChangeText={(text) => {
              // Mantiene solo dígitos y aplica guiones automáticos: AAAA-MM-DD
              const digits = text.replace(/\D/g, '').slice(0, 8);
              let formatted = digits;
              if (digits.length > 4) formatted = digits.slice(0, 4) + '-' + digits.slice(4);
              if (digits.length > 6) formatted = digits.slice(0, 4) + '-' + digits.slice(4, 6) + '-' + digits.slice(6);
              setFechaCreacion(formatted);
            }}
            placeholder="AAAA-MM-DD  (ej: 1889-03-15)"
            placeholderTextColor={COLORS.onSurfaceVariant}
            keyboardType="numeric"
            maxLength={10}
            style={styles.textInput}
          />

          <Text style={styles.label}>Historia del objeto</Text>
          <TextInput
            value={historia}
            onChangeText={setHistoria}
            placeholder="Contá la historia, procedencia y contexto de esta pieza..."
            placeholderTextColor={COLORS.onSurfaceVariant}
            multiline
            numberOfLines={6}
            style={[styles.textInput, { height: 140, textAlignVertical: 'top' }]}
          />

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
  subtitle: { fontSize: 13, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  label: { fontSize: 14, fontWeight: '600', color: COLORS.onSurfaceVariant, marginBottom: 8, marginTop: 16 },
  opcional: { fontSize: 12, fontWeight: '400', color: COLORS.outline },
  textInput: {
    backgroundColor: COLORS.surfaceContainerLow,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: COLORS.onSurface,
    borderWidth: 1,
    borderColor: COLORS.outlineVariant,
  },
  error: { color: COLORS.error, fontSize: 13, marginTop: 12 },
  button: { marginTop: 32, borderRadius: 999, backgroundColor: COLORS.primary },
  buttonContent: { minHeight: 52 },
  buttonLabel: { fontSize: 15, fontWeight: '600', color: COLORS.onPrimary },
});
