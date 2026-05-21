import React, { createContext, useContext, useMemo, useState } from 'react';

const initialRegisterForm = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  address: '',
  country: '',
};

const initialDniData = {
  frontUri: '',
  backUri: '',
};

const RegisterFlowContext = createContext(undefined);

export function RegisterFlowProvider({ children }) {
  const [registerForm, setRegisterForm] = useState(initialRegisterForm);
  const [dniData, setDniData] = useState(initialDniData);

  const updateRegisterForm = (payload) => {
    setRegisterForm((prev) => ({ ...prev, ...payload }));
  };

  const setDniImage = (side, uri) => {
    setDniData((prev) => ({ ...prev, [side]: uri }));
  };

  const resetRegisterFlow = () => {
    setRegisterForm(initialRegisterForm);
    setDniData(initialDniData);
  };

  const value = useMemo(
    () => ({
      registerForm,
      dniData,
      updateRegisterForm,
      setDniImage,
      resetRegisterFlow,
    }),
    [registerForm, dniData]
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
