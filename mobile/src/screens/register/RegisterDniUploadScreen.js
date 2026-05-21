import React, { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, IconButton, Surface, Text, useTheme } from 'react-native-paper';
import * as ImagePicker from 'expo-image-picker';

import { useRegisterFlow } from '../../navigation/RegisterFlowContext';
import { registerSharedStyles } from './sharedStyles';

function UploadBox({ label, imageUri, onPickFromCamera, onPickFromGallery }) {
  const theme = useTheme();
  const hasImage = !!imageUri;

  return (
    <Surface
      style={[
        styles.uploadBox,
        {
          borderColor: hasImage ? theme.colors.primary : theme.colors.outline,
          backgroundColor: theme.colors.surfaceContainerLowest,
        },
      ]}
      elevation={0}
    >
      {hasImage ? (
        <Image source={{ uri: imageUri }} style={styles.previewImage} />
      ) : (
        <View style={styles.placeholderBlock}>
          <IconButton icon="image-outline" iconColor={theme.colors.primary} size={26} />
          <Text style={[styles.placeholderText, { color: theme.colors.onSurfaceVariant }]}>{label}</Text>
        </View>
      )}

      <View style={styles.uploadActions}>
        <Button
          mode="contained-tonal"
          onPress={onPickFromCamera}
          style={[styles.sourceButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
          labelStyle={[styles.sourceButtonLabel, { color: theme.colors.onSurface }]}
          icon="camera-outline"
          compact
        >
          Camara
        </Button>
        <Button
          mode="contained-tonal"
          onPress={onPickFromGallery}
          style={[styles.sourceButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
          labelStyle={[styles.sourceButtonLabel, { color: theme.colors.onSurface }]}
          icon="image-outline"
          compact
        >
          Galeria
        </Button>
      </View>
    </Surface>
  );
}

export default function RegisterDniUploadScreen({ navigation }) {
  const theme = useTheme();
  const { dniData, setDniImage } = useRegisterFlow();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canContinue = useMemo(() => !!dniData.frontUri && !!dniData.backUri, [dniData]);

  const pickFromGallery = async (side) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setDniImage(side, result.assets[0].uri);
    }
  };

  const pickFromCamera = async (side) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();

    if (!permission.granted) {
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [4, 3],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      setDniImage(side, result.assets[0].uri);
    }
  };

  const handleNext = async () => {
    if (!canContinue || isSubmitting) {
      return;
    }

    setIsSubmitting(true);

    await new Promise((resolve) => {
      setTimeout(resolve, 1000);
    });

    setIsSubmitting(false);
    navigation.navigate('RegisterVerification');
  };

  return (
    <SafeAreaView style={[registerSharedStyles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <KeyboardAvoidingView
        style={registerSharedStyles.keyboard}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={registerSharedStyles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={registerSharedStyles.container}>
            <View style={registerSharedStyles.titleRow}>
              <IconButton
                icon="arrow-left"
                iconColor={theme.colors.onSurface}
                size={22}
                onPress={() => navigation.goBack()}
              />
              <Text style={[registerSharedStyles.title, { color: theme.colors.onBackground }]}>Registro</Text>
            </View>

            <Text style={[registerSharedStyles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
              Carga frente y dorso de tu DNI para continuar la verificacion.
            </Text>

            <View style={styles.boxesWrapper}>
              <UploadBox
                label="DNI Frente"
                imageUri={dniData.frontUri}
                onPickFromCamera={() => pickFromCamera('frontUri')}
                onPickFromGallery={() => pickFromGallery('frontUri')}
              />
              <UploadBox
                label="DNI Dorso"
                imageUri={dniData.backUri}
                onPickFromCamera={() => pickFromCamera('backUri')}
                onPickFromGallery={() => pickFromGallery('backUri')}
              />
            </View>

            <View style={registerSharedStyles.bottomRow}>
              <Button
                mode="contained-tonal"
                onPress={() => navigation.goBack()}
                style={[styles.bottomButton, { backgroundColor: theme.colors.surfaceContainerLow }]}
                contentStyle={styles.bottomButtonContent}
                labelStyle={[styles.bottomButtonLabel, { color: theme.colors.onSurface }]}
              >
                Atras
              </Button>
              <Button
                mode="contained"
                onPress={handleNext}
                disabled={!canContinue || isSubmitting}
                loading={isSubmitting}
                style={[styles.bottomButton, { backgroundColor: theme.colors.primary }]}
                contentStyle={styles.bottomButtonContent}
                labelStyle={[styles.bottomButtonLabel, { color: theme.colors.onPrimary }]}
              >
                Siguiente
              </Button>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  boxesWrapper: {
    gap: 16,
  },
  uploadBox: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 154,
    padding: 12,
    justifyContent: 'space-between',
  },
  placeholderBlock: {
    minHeight: 74,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 14,
    lineHeight: 20,
  },
  previewImage: {
    width: '100%',
    height: 88,
    borderRadius: 10,
  },
  uploadActions: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10,
  },
  sourceButton: {
    flex: 1,
    borderRadius: 999,
  },
  sourceButtonLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  bottomButton: {
    minWidth: 130,
    borderRadius: 999,
  },
  bottomButtonContent: {
    height: 50,
    paddingHorizontal: 12,
  },
  bottomButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
