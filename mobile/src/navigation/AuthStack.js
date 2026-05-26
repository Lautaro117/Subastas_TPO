import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  ForgotPasswordEmailScreen,
  ForgotPasswordNewPasswordScreen,
  LoginScreen,
  RegisterDniUploadScreen,
  RegisterEnteringScreen,
  RegisterFinalizePasswordScreen,
  RegisterPersonalDataScreen,
  RegisterVerificationScreen,
} from '../screens';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  return (
    <Stack.Navigator initialRouteName="Login" screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterPersonalData" component={RegisterPersonalDataScreen} />
      <Stack.Screen name="RegisterDniUpload" component={RegisterDniUploadScreen} />
      <Stack.Screen name="RegisterVerification" component={RegisterVerificationScreen} />
      <Stack.Screen name="RegisterFinalizePassword" component={RegisterFinalizePasswordScreen} />
      <Stack.Screen name="RegisterEntering" component={RegisterEnteringScreen} />
      <Stack.Screen name="ForgotPasswordEmail" component={ForgotPasswordEmailScreen} />
      <Stack.Screen name="ForgotPasswordNewPassword" component={ForgotPasswordNewPasswordScreen} />
    </Stack.Navigator>
  );
}
