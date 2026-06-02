import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  AddBankAccountScreen,
  AddCertifiedCheckScreen,
  AddCreditCardScreen,
  ForgotPasswordEmailScreen,
  ForgotPasswordNewPasswordScreen,
  LoginScreen,
  PaymentMethodsScreen,
  RegisterDniUploadScreen,
  RegisterEnteringScreen,
  RegisterFinalizePasswordScreen,
  RegisterPersonalDataScreen,
  RegisterVerificationScreen,
} from '../screens';
import { useAppSession } from './AppSessionContext';

const Stack = createNativeStackNavigator();

export function AuthStack() {
  const { session } = useAppSession();
  const initialRoute =
    session.entryMode === 'finalizing'        ? 'RegisterFinalizePassword' :
    session.entryMode === 'pending-register'  ? 'RegisterVerification' :
    'Login';

  return (
    <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="RegisterPersonalData" component={RegisterPersonalDataScreen} />
      <Stack.Screen name="RegisterDniUpload" component={RegisterDniUploadScreen} />
      <Stack.Screen name="RegisterVerification" component={RegisterVerificationScreen} />
      <Stack.Screen name="RegisterFinalizePassword" component={RegisterFinalizePasswordScreen} />
      <Stack.Screen name="RegisterEntering" component={RegisterEnteringScreen} />
      <Stack.Screen name="ForgotPasswordEmail" component={ForgotPasswordEmailScreen} />
      <Stack.Screen name="ForgotPasswordNewPassword" component={ForgotPasswordNewPasswordScreen} />
      <Stack.Screen name="PaymentMethodsOnboarding" component={PaymentMethodsScreen} initialParams={{ isOnboarding: true }} />
      <Stack.Screen name="AddBankAccount" component={AddBankAccountScreen} />
      <Stack.Screen name="AddCreditCard" component={AddCreditCardScreen} />
      <Stack.Screen name="AddCertifiedCheck" component={AddCertifiedCheckScreen} />
    </Stack.Navigator>
  );
}
