import React, { createContext, useContext, useMemo, useState } from 'react';

const initialRegisterForm = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  address: '',
  country: '',
  countryCode: null,
};

const initialDniData = {
  frontUri: '',
  backUri: '',
};

const initialRegisterStatus = {
  solicitudId: null,
  estado: null,
};

const RegisterFlowContext = createContext(undefined);

export function RegisterFlowProvider({ children }) {
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [dniData, setDniData] = useState(initialDniData);
  const [registerStatus, setRegisterStatus] = useState(initialRegisterStatus);

  const updateRegisterForm = (payload) => {
    setRegisterForm((prev) => ({ ...prev, ...payload }));
  };

  const setDniImage = (side, uri) => {
    setDniData((prev) => ({ ...prev, [side]: uri }));
  };

  const resetRegisterFlow = () => {
    setRegisterForm(initialRegisterForm);
    setDniData(initialDniData);
    setRegisterStatus(initialRegisterStatus);
  };

  const setRegisterResult = (payload) => {
    setRegisterStatus({
      solicitudId: payload?.solicitudId ?? null,
      estado: payload?.estado ?? null,
    });
  };

  const value = useMemo(
    () => ({
      registerForm,
      dniData,
      registerStatus,
      updateRegisterForm,
      setDniImage,
      setRegisterResult,
      resetRegisterFlow,
    }),
    [registerForm, dniData, registerStatus]
  );

  return <RegisterFlowContext.Provider value={value}>{children}</RegisterFlowContext.Provider>;
}

export function useRegisterFlow() {
  const context = useContext(RegisterFlowContext);

  if (!context) {
    throw new Error('useRegisterFlow must be used inside RegisterFlowProvider');
  }

  return context;
}
