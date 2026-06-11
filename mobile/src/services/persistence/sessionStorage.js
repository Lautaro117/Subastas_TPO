import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSION_KEY = '@subastas:session';

const GUEST_MODES = ['guest-login', 'pending-register'];

export async function saveSessionSnapshot(session) {
  if (GUEST_MODES.includes(session.entryMode)) return;
  const snapshot = {
    isAuthenticated: session.isAuthenticated,
    entryMode: session.entryMode,
    token: session.token,
    solicitudId: session.solicitudId ?? null,
  };
  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(snapshot));
}

export async function loadSessionSnapshot() {
  const stored = await AsyncStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  return JSON.parse(stored);
}

export async function clearSessionSnapshot() {
  await AsyncStorage.removeItem(SESSION_KEY);
}