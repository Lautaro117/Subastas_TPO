import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator,
  Appbar,
  Button,
  Chip,
  Dialog,
  IconButton,
  Portal,
  Snackbar,
  Surface,
  Text,
  useTheme,
} from 'react-native-paper';
import Svg, { Circle } from 'react-native-svg';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Client } from '@stomp/stompjs';
import { useAppSession } from '../../navigation/AppSessionContext';
import { API_BASE_URL } from '../../config/api';
import {
  getAuctionCatalog,
  getAuctionLive,
  joinAuction,
  leaveAuction,
  sendBid,
} from '../../services/auctionsApi';

const WARMUP_SECONDS = 10;

// ─── Countdown circular ───────────────────────────────────────────────────────
function CountdownCircle({ seconds, total, size = 180 }) {
  const theme = useTheme();
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - seconds / total);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={theme.colors.surfaceContainerHigh}
          strokeWidth={strokeWidth} fill="none"
        />
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={theme.colors.primary}
          strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90" originX={size / 2} originY={size / 2}
        />
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[styles.countdownTime, { color: theme.colors.primary, fontSize: size < 120 ? 18 : 32 }]}>
          {String(Math.floor(seconds / 60)).padStart(2, '0')}:
          {String(seconds % 60).padStart(2, '0')}
        </Text>
      </View>
    </View>
  );
}

// ─── Fila de puja en historial ────────────────────────────────────────────────
function BidRow({ bid, isTop }) {
  const theme = useTheme();
  return (
    <View style={styles.bidRow}>
      <View style={styles.bidLeft}>
        <Text style={[styles.bidPostor, { color: theme.colors.onSurface }]}>
          {bid.postor ?? 'Postor'}
        </Text>
        <Text style={[styles.bidTime, { color: theme.colors.onSurfaceVariant }]}>
          {bid.hace ?? ''}
        </Text>
      </View>
      <Text style={[styles.bidMonto, { color: isTop ? theme.colors.primary : theme.colors.onSurface }]}>
        {bid.moneda} {bid.importe?.toLocaleString('es-AR')}
      </Text>
    </View>
  );
}

// ─── Fila de ítem del catálogo ────────────────────────────────────────────────
function CatalogoRow({ item, isActivo, notificado, onBellPress, onPress }) {
  const theme = useTheme();
  // 'si' = adjudicado con ganador · 'deshabilitado' = venció sin postores
  const subastado = item.subastado === 'si' || item.subastado === 'deshabilitado';
  const sinPostores = item.subastado === 'deshabilitado';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
    <Surface
      elevation={0}
      style={[
        styles.catalogoRow,
        {
          backgroundColor: isActivo
            ? theme.colors.primaryContainer
            : subastado
            ? theme.colors.surfaceContainerHigh
            : theme.colors.surfaceContainerLowest,
          borderColor: isActivo ? theme.colors.primary : theme.colors.outline,
          opacity: subastado && !isActivo ? 0.55 : 1,
        },
      ]}
    >
      {/* Thumb: foto o emoji */}
      <View style={[styles.catalogoThumb, { backgroundColor: theme.colors.surfaceContainerHigh }]}>
        {item.fotoPrincipal ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${item.fotoPrincipal}` }}
            style={{ width: 48, height: 48, borderRadius: 10 }}
            resizeMode="cover"
          />
        ) : (
          <Text style={{ fontSize: 18 }}>📦</Text>
        )}
      </View>

      <View style={styles.catalogoRowText}>
        <Text
          style={[styles.catalogoRowTitle, {
            color: isActivo ? theme.colors.onPrimaryContainer : theme.colors.onSurface,
          }]}
          numberOfLines={1}
        >
          {item.descripcionCatalogo ?? `Producto #${item.productoId}`}
        </Text>
        {item.precioBase != null && (
          <Text style={[styles.catalogoRowSub, {
            color: isActivo ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant,
          }]}>
            Base: {item.precioBase?.toLocaleString('es-AR')}
          </Text>
        )}
      </View>
      {isActivo ? (
        <Text style={[styles.ahoraLabel, { color: theme.colors.primary }]}>AHORA</Text>
      ) : sinPostores ? (
        <Text style={[styles.ahoraLabel, { color: theme.colors.onSurfaceVariant }]}>SIN POSTOR</Text>
      ) : !subastado ? (
        <IconButton
          icon={notificado ? 'bell' : 'bell-outline'}
          iconColor={notificado ? theme.colors.primary : theme.colors.onSurfaceVariant}
          size={18}
          onPress={() => onBellPress(item.itemId)}
        />
      ) : null}
    </Surface>
    </TouchableOpacity>
  );
}

// ─── Decodifica el payload del JWT ────────────────────────────────────────────
function decodeJwtPayload(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return {};
  }
}

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function SalaSubastaScreen({ navigation, route }) {
  const { auctionId, auction: auctionParam } = route.params ?? {};
  const theme = useTheme();
  const { session } = useAppSession();
  const token = session.token;
  const userEstado = decodeJwtPayload(token ?? '').estado; // 'E1' | 'E2' | 'E3' | 'E4'

  const [auction] = useState(auctionParam ?? null);
  const [catalogo, setCatalogo] = useState([]);
  const [salaData, setSalaData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [fase, setFase] = useState('preview'); // 'preview' | 'warmup' | 'sala'
  const [joining, setJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [montoInput, setMontoInput] = useState('');
  const [pujando, setPujando] = useState(false);
  const [countdown, setCountdown] = useState(WARMUP_SECONDS);
  const [notificadosIds, setNotificadosIds] = useState(new Set());

  const STORAGE_KEY = `@subastas:notificados:${auctionId}`;

  // Cargar IDs notificados desde AsyncStorage al montar
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored) setNotificadosIds(new Set(JSON.parse(stored)));
      })
      .catch(() => {});
  }, [STORAGE_KEY]);

  // Persistir en AsyncStorage cada vez que cambia notificadosIds
  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([...notificadosIds])).catch(() => {});
  }, [notificadosIds, STORAGE_KEY]);

  const [modalSalir, setModalSalir] = useState(false);
  const [modalSinMedioPago, setModalSinMedioPago] = useState(false);
  const [modalCategoriaInsuficiente, setModalCategoriaInsuficiente] = useState(false);
  const [modalNotificar, setModalNotificar] = useState(null);
  const [snackbar, setSnackbar] = useState(null);

  const stompClientRef = useRef(null);
  const countdownRef = useRef(null);
  const pollingRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const autoJoinHandled = useRef(false);
  // Ref al handler de eventos WS para evitar closures stale
  const wsEventHandlerRef = useRef(null);

  // Countdown del ítem actual sincronizado con el deadline del backend
  const [tiempoRestante, setTiempoRestante] = useState(null);
  const [timerTotal, setTimerTotal] = useState(300);

  // ─── Carga inicial ──────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cat, live] = await Promise.all([
        getAuctionCatalog(token, auctionId),
        getAuctionLive(token, auctionId).catch(() => null),
      ]);
      // El catálogo devuelve array directo: [{itemId, productoId, precioBase, comision, subastado}]
      setCatalogo(Array.isArray(cat) ? cat : []);
      if (live) setSalaData(live);
    } catch {
      setSnackbar('No se pudo cargar la subasta.');
    } finally {
      setIsLoading(false);
    }
  }, [token, auctionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Limpiar intervalos y WebSocket solo al desmontar
  useEffect(() => {
    return () => {
      clearInterval(countdownRef.current);
      clearInterval(pollingRef.current);
      clearInterval(timerIntervalRef.current);
      stompClientRef.current?.deactivate?.();
    };
  }, []);

  // Sincronizar la cuenta regresiva local con el deadline que manda el backend.
  // El backend incluye tiempoLimite (epoch millis) en cada SalaResponse.
  // El frontend calcula el tiempo restante localmente sin necesidad de ticks WS.
  useEffect(() => {
    clearInterval(timerIntervalRef.current);

    const deadline = salaData?.tiempoLimite;
    if (!deadline) {
      setTiempoRestante(null);
      return;
    }

    const total = salaData?.timerTotalSegundos ?? 300;
    setTimerTotal(total);

    const calcRemaining = () => Math.max(0, Math.ceil((deadline - Date.now()) / 1000));

    setTiempoRestante(calcRemaining());

    timerIntervalRef.current = setInterval(() => {
      const r = calcRemaining();
      setTiempoRestante(r);
      if (r <= 0) clearInterval(timerIntervalRef.current);
    }, 1000);

    return () => clearInterval(timerIntervalRef.current);
  }, [salaData?.tiempoLimite, salaData?.timerTotalSegundos]);

  // Salir de la sala cuando joined cambia a false (o al desmontar si joined es true)
  useEffect(() => {
    if (!joined) return;
    return () => {
      leaveAuction(token, auctionId).catch(() => {});
    };
  }, [joined, token, auctionId]);

  // Auto-join cuando se navega desde DetalleProductoSubasta con autoJoin=true
  useEffect(() => {
    if (route.params?.autoJoin && !autoJoinHandled.current && fase === 'preview' && !joined && !joining && !isLoading) {
      autoJoinHandled.current = true;
      handleJoin();
    }
  }, [route.params?.autoJoin, fase, joined, joining, isLoading, handleJoin]);

  // ─── Join ───────────────────────────────────────────────────────────────────
  const handleJoin = useCallback(async () => {
    if (userEstado === 'E2' || userEstado === 'E3') {
      setModalSinMedioPago(true);
      return;
    }
    setJoining(true);
    try {
      const salaResponse = await joinAuction(token, auctionId);
      if (salaResponse) setSalaData(salaResponse);
      setJoined(true);
      setFase('sala');

      // Polling arranca inmediatamente al unirse, sin depender del WebSocket.
      // Esto garantiza que todos los postores vean las pujas nuevas incluso si
      // el WebSocket falla o tarda en conectarse.
      clearInterval(pollingRef.current);
      pollingRef.current = setInterval(() => {
        getAuctionLive(token, auctionId)
          .then((live) => { if (live) setSalaData(live); })
          .catch(() => {});
      }, 1500);

      connectWebSocket();
    } catch (err) {
      const msg = (err.message ?? '').toLowerCase();
      if (err.status === 409) {
        if (msg.includes('activa') || msg.includes('finaliz')) {
          setSnackbar('La subasta aún no está activa.');
        } else {
          setSnackbar('Ya estás en otra sala. Salí primero.');
        }
      } else if (err.status === 403) {
        if (msg.includes('categor')) {
          setModalCategoriaInsuficiente(true);
        } else if (msg.includes('otra subasta')) {
          setSnackbar('Ya estás en otra subasta activa. Salí primero.');
        } else {
          setModalCategoriaInsuficiente(true);
        }
      } else {
        setSnackbar('No se pudo unir a la sala.');
      }
    } finally {
      setJoining(false);
    }
  }, [token, auctionId, userEstado]);

  // ─── Warmup (solo entre ítems, no al ingresar) ──────────────────────────────
  function startWarmup() {
    setFase('warmup');
    setCountdown(WARMUP_SECONDS);
    clearInterval(countdownRef.current);
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          setFase('sala');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  // ─── WebSocket STOMP ─────────────────────────────────────────────────────────
  function connectWebSocket() {
    const wsUrl = API_BASE_URL.replace(/^http/, 'ws') + '/ws';

    const client = new Client({
      // webSocketFactory explícito: mejor compatibilidad en React Native
      webSocketFactory: () => new WebSocket(wsUrl),
      connectHeaders: { Authorization: `Bearer ${token}` },
      reconnectDelay: 3000,
      onConnect: () => {
        client.subscribe(`/topic/auction/${auctionId}`, (msg) => {
          try {
            const event = JSON.parse(msg.body);
            // Siempre llamar al handler más reciente via ref (evita stale closures)
            wsEventHandlerRef.current?.(event);
          } catch {}
        });
        // Sincronizar estado al (re)conectar el WebSocket
        getAuctionLive(token, auctionId)
          .then((live) => { if (live) setSalaData(live); })
          .catch(() => {});
        // El polling ya fue iniciado en handleJoin; no se duplica aquí
      },
      onStompError: () => {
        // El polling sigue corriendo aunque el WS falle
      },
    });

    client.activate();
    stompClientRef.current = client;
  }

  // ─── Manejo de eventos WebSocket ─────────────────────────────────────────────
  // Se actualiza el ref en cada render para que el subscriber siempre use la
  // versión más fresca del handler (con los closures correctos).
  wsEventHandlerRef.current = handleWebSocketEvent;
  function handleWebSocketEvent(event) {
    switch (event.tipo) {
      case 'bid.new':
        // El payload ES el SalaResponse completo — usarlo directo, sin REST extra
        if (event.payload?.itemActual !== undefined) {
          setSalaData(event.payload);
        } else {
          // Fallback por compatibilidad
          getAuctionLive(token, auctionId)
            .then((live) => { if (live) setSalaData(live); })
            .catch(() => {});
        }
        break;

      case 'item.next':
        // Actualizar datos del nuevo ítem (incluye el nuevo tiempoLimite → el círculo se resetea)
        if (event.payload?.itemActual !== undefined) {
          setSalaData(event.payload);
        }
        // Refrescar catálogo para mostrar el ítem previo como adjudicado/deshabilitado
        getAuctionCatalog(token, auctionId)
          .then((cat) => { if (cat) setCatalogo(Array.isArray(cat) ? cat : []); })
          .catch(() => {});
        break;

      case 'auction.closed':
        stompClientRef.current?.deactivate?.();
        clearInterval(countdownRef.current);
        clearInterval(pollingRef.current);
        navigation.replace('ResultadoSubasta', { auctionId });
        break;

      default:
        break;
    }
  }

  // ─── Salir ──────────────────────────────────────────────────────────────────
  const handleLeave = useCallback(async () => {
    setModalSalir(false);
    try { await leaveAuction(token, auctionId); } catch {}
    setJoined(false);
    clearInterval(countdownRef.current);
    clearInterval(pollingRef.current);
    stompClientRef.current?.deactivate?.();
    navigation.goBack();
  }, [token, auctionId, navigation]);

  // ─── Pujar ──────────────────────────────────────────────────────────────────
  const handlePujar = useCallback(async () => {
    const monto = parseFloat(montoInput);
    if (!monto || isNaN(monto)) { setSnackbar('Ingresá un monto válido.'); return; }

    const itemActual = salaData?.itemActual;
    if (!itemActual) { setSnackbar('No hay ítem activo para pujar.'); return; }

    setPujando(true);
    try {
      await sendBid(token, auctionId, {
        item_id: itemActual.itemId,
        monto,
        moneda: salaData?.moneda ?? 'ARS',
        payment_method_id: null,
      });
      setMontoInput('');
      setSnackbar('¡Puja enviada!');
      // El backend emite bid.new por WebSocket al aceptar la puja.
      // Ese evento actualiza la sala para TODOS (incluyendo quien pujó).
      // No hace falta un REST adicional acá; el polling/WS ya cubren la sync.
    } catch (err) {
      setSnackbar(err.message ?? 'Error al enviar la puja.');
    } finally {
      setPujando(false);
    }
  }, [token, auctionId, montoInput, salaData]);

  // ─── Derivados ──────────────────────────────────────────────────────────────
  const itemActual = salaData?.itemActual ?? null;
  const mejorOferta = salaData?.mejorOferta ?? null;
  const historialPujas = salaData?.pujas ?? [];
  const moneda = salaData?.moneda ?? 'USD';
  const precioBase = itemActual?.precioBase ?? null;
  const auctionTitle = auction?.ubicacion ?? `Subasta #${auctionId}`;

  const catalogoPreview = catalogo.slice(0, 4);

  // ─── Modales ────────────────────────────────────────────────────────────────
  function renderModals() {
    return (
      <Portal>
        <Dialog
          visible={modalSalir}
          onDismiss={() => setModalSalir(false)}
          style={{ backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 24 }}
        >
          <Dialog.Icon icon="exit-to-app" color={theme.colors.primary} />
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.onSurface }}>
            Salir de la Subasta
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              ¿Estás seguro que deseas salir de la subasta? Podrás ingresar nuevamente si lo deseas.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', gap: 16 }}>
            <Button onPress={() => setModalSalir(false)} textColor={theme.colors.onSurfaceVariant}>Cancelar</Button>
            <Button onPress={handleLeave} textColor={theme.colors.primary}>Salir</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={modalSinMedioPago}
          onDismiss={() => setModalSinMedioPago(false)}
          style={{ backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 24 }}
        >
          <Dialog.Icon icon="cancel" color={theme.colors.error} />
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.onSurface }}>
            Necesitas Registrarte
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Para acceder es necesario estar registrado y tener un medio de pago configurado.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', gap: 16 }}>
            <Button onPress={() => setModalSinMedioPago(false)} textColor={theme.colors.onSurfaceVariant}>Cancelar</Button>
            <Button
              onPress={() => { setModalSinMedioPago(false); navigation.navigate('HomePerfil', { screen: 'PaymentMethods' }); }}
              textColor={theme.colors.primary}
            >
              Registrarse
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={modalCategoriaInsuficiente}
          onDismiss={() => setModalCategoriaInsuficiente(false)}
          style={{ backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 24 }}
        >
          <Dialog.Icon icon="lock-outline" color={theme.colors.error} />
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.onSurface }}>
            Categoría Insuficiente
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              Tu categoría de usuario no cumple el requisito mínimo para participar en esta subasta.
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center' }}>
            <Button onPress={() => setModalCategoriaInsuficiente(false)} textColor={theme.colors.primary}>Entendido</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={modalNotificar !== null}
          onDismiss={() => setModalNotificar(null)}
          style={{ backgroundColor: theme.colors.surfaceContainerHigh, borderRadius: 24 }}
        >
          <Dialog.Icon icon="bell-outline" color={theme.colors.primary} />
          <Dialog.Title style={{ textAlign: 'center', color: theme.colors.onSurface }}>
            Notificar producto
          </Dialog.Title>
          <Dialog.Content>
            <Text style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
              ¿Estás seguro que querés recibir una notificación cuando esté por comenzar la subasta de este producto?
            </Text>
          </Dialog.Content>
          <Dialog.Actions style={{ justifyContent: 'center', gap: 16 }}>
            <Button onPress={() => setModalNotificar(null)} textColor={theme.colors.onSurfaceVariant}>Cancelar</Button>
            <Button
              onPress={() => {
                setNotificadosIds((prev) => new Set([...prev, modalNotificar]));
                setModalNotificar(null);
                setSnackbar('Te notificaremos cuando comience.');
              }}
              textColor={theme.colors.primary}
            >
              Confirmar
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    );
  }

  // ─── Loading ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
          <Appbar.BackAction onPress={() => navigation.goBack()} />
          <Appbar.Content title={auctionTitle} />
        </Appbar.Header>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // ─── WARMUP ─────────────────────────────────────────────────────────────────
  if (fase === 'warmup') {
    const proximasItems = catalogo.filter((i) => i.subastado !== 'si' && i.itemId !== itemActual?.itemId);
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
          <Appbar.BackAction onPress={() => setModalSalir(true)} />
          <Appbar.Content title={auctionTitle} />
          <Chip compact style={{ backgroundColor: theme.colors.primaryContainer, marginRight: 12 }}
            textStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 11 }}>EN VIVO</Chip>
        </Appbar.Header>

        <ScrollView contentContainerStyle={styles.warmupContent}>
          <View style={{ marginBottom: 32 }}>
            <CountdownCircle seconds={countdown} total={WARMUP_SECONDS} size={180} />
          </View>
          <View style={styles.proximasHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Próximas subastas →</Text>
          </View>
          {proximasItems.map((item, idx) => (
            <CatalogoRow
              key={item.itemId}
              item={item}
              isActivo={idx === 0}
              notificado={notificadosIds.has(item.itemId)}
              onBellPress={setModalNotificar}
              onPress={() => navigation.navigate('DetalleProductoSubasta', { auctionId, itemId: item.itemId, item })}
            />
          ))}
        </ScrollView>

        {renderModals()}
        <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>{snackbar}</Snackbar>
      </SafeAreaView>
    );
  }

  // ─── SALA ACTIVA ─────────────────────────────────────────────────────────────
  if (fase === 'sala') {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
          <Appbar.BackAction onPress={() => setModalSalir(true)} />
          <Appbar.Content title={auctionTitle} titleStyle={styles.appbarTitle} />
          <Chip compact style={{ backgroundColor: theme.colors.primaryContainer, marginRight: 12 }}
            textStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 11 }}>EN VIVO</Chip>
        </Appbar.Header>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={90}>
          <ScrollView contentContainerStyle={styles.salaContent} keyboardShouldPersistTaps="handled">
            {/* Foto ítem */}
            <View style={styles.fotoWrap}>
              {itemActual?.fotoPrincipal ? (
                <Image
                  source={{ uri: `data:image/jpeg;base64,${itemActual.fotoPrincipal}` }}
                  style={styles.fotoProducto}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.fotoPlaceholder, { backgroundColor: theme.colors.surfaceContainerLow }]}>
                  <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 40 }}>📦</Text>
                </View>
              )}
              <View style={styles.fotoChips}>
                <Chip compact style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} textStyle={{ color: '#fff', fontSize: 11 }}>
                  {itemActual?.descripcionCatalogo ?? `Producto #${itemActual?.productoId ?? '—'}`}
                </Chip>
                {precioBase != null && (
                  <Chip compact style={{ backgroundColor: 'rgba(0,0,0,0.55)' }} textStyle={{ color: '#fff', fontSize: 11 }}>
                    Base {moneda} {Number(precioBase).toLocaleString('es-AR')}
                  </Chip>
                )}
              </View>
            </View>

            {/* Cuenta regresiva del ítem actual */}
            {tiempoRestante !== null && (
              <View style={styles.timerRow}>
                <CountdownCircle seconds={tiempoRestante} total={timerTotal} size={96} />
                <View style={styles.timerLabels}>
                  <Text style={[styles.timerLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {timerTotal === 300 ? 'Sin postores aún' : '¡Última oportunidad!'}
                  </Text>
                  <Text style={[styles.timerSub, { color: theme.colors.onSurfaceVariant }]}>
                    {timerTotal === 300
                      ? 'Primero en pujar inicia 1 min final'
                      : 'Sin nueva puja, se adjudica el ítem'}
                  </Text>
                </View>
              </View>
            )}

            {/* Mejor oferta */}
            <Surface elevation={0} style={[styles.mejorOfertaCard, { backgroundColor: theme.colors.surfaceContainerLow }]}>
              <Text style={[styles.mejorOfertaLabel, { color: theme.colors.onSurfaceVariant }]}>MEJOR OFERTA</Text>
              {mejorOferta ? (
                <>
                  <Text style={[styles.mejorOfertaMonto, { color: theme.colors.onSurface }]}>
                    {moneda} {mejorOferta.importe?.toLocaleString('es-AR')}
                  </Text>
                  <Text style={[styles.mejorOfertaSub, { color: theme.colors.onSurfaceVariant }]}>
                    Postor: {mejorOferta.postor}  ·  {mejorOferta.hace}
                  </Text>
                </>
              ) : (
                <Text style={[styles.mejorOfertaMonto, { color: theme.colors.onSurfaceVariant }]}>Sin ofertas aún</Text>
              )}
            </Surface>

            {/* Historial */}
            {historialPujas.map((bid, idx) => (
              <BidRow key={`bid-${idx}`} bid={bid} isTop={idx === 0} />
            ))}

            <View style={{ height: 120 }} />
          </ScrollView>

          {/* Barra puja */}
          <View style={[styles.pujaBar, { backgroundColor: theme.colors.background, borderTopColor: theme.colors.outlineVariant }]}>
            <View style={[styles.pujaInputWrap, { borderColor: theme.colors.outline, backgroundColor: theme.colors.surfaceContainerLow }]}>
              <Text style={[styles.pujaMoneda, { color: theme.colors.onSurfaceVariant }]}>{moneda}</Text>
              <TextInput
                style={[styles.pujaInput, { color: theme.colors.onSurface }]}
                placeholder="0"
                placeholderTextColor={theme.colors.onSurfaceVariant}
                keyboardType="numeric"
                value={montoInput}
                onChangeText={setMontoInput}
              />
            </View>
            <Button mode="contained" onPress={handlePujar} loading={pujando} disabled={pujando}
              style={styles.pujaButton} contentStyle={styles.pujaButtonContent}>
              Pujar
            </Button>
          </View>
          <View style={[styles.pujaHint, { backgroundColor: theme.colors.background }]}>
            {salaData?.minPuja != null && (
              <Text style={[styles.pujaHintText, { color: theme.colors.onSurfaceVariant }]}>
                Mín: {moneda} {Number(salaData.minPuja).toLocaleString('es-AR')}
                {'  '}
                Máx: {moneda} {Number(salaData.maxPuja).toLocaleString('es-AR')}
              </Text>
            )}
          </View>
        </KeyboardAvoidingView>

        {renderModals()}
        <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3000}>{snackbar}</Snackbar>
      </SafeAreaView>
    );
  }

  // ─── PREVIEW ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <Appbar.Header style={{ backgroundColor: theme.colors.background }}>
        <Appbar.BackAction onPress={() => navigation.goBack()} />
        <Appbar.Content title={auctionTitle} titleStyle={styles.appbarTitle} />
        {auction?.estado === 'abierta' && (
          <Chip compact style={{ backgroundColor: theme.colors.primaryContainer, marginRight: 12 }}
            textStyle={{ color: theme.colors.onPrimaryContainer, fontSize: 11 }}>EN VIVO</Chip>
        )}
      </Appbar.Header>

      <ScrollView contentContainerStyle={styles.previewContent}>
        {/* Foto del primer ítem del catálogo */}
        {catalogo[0]?.fotoPrincipal ? (
          <Image
            source={{ uri: `data:image/jpeg;base64,${catalogo[0].fotoPrincipal}` }}
            style={styles.fotoProducto}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.fotoPlaceholder, { backgroundColor: theme.colors.surfaceContainerLow }]}>
            <Text style={{ color: theme.colors.onSurfaceVariant, fontSize: 40 }}>📦</Text>
          </View>
        )}

        {/* Header catálogo */}
        <View style={styles.catalogoHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Catálogo →</Text>
          <TouchableOpacity onPress={() => navigation.navigate('CatalogoExtendido', { auctionId, catalogo })}>
            <Text style={[styles.verTodos, { color: theme.colors.primary }]}>
              Ver todos ({catalogo.length})
            </Text>
          </TouchableOpacity>
        </View>

        {catalogoPreview.map((item) => (
          <CatalogoRow
            key={item.itemId}
            item={item}
            isActivo={itemActual?.itemId === item.itemId}
            notificado={notificadosIds.has(item.itemId)}
            onBellPress={setModalNotificar}
            onPress={() => navigation.navigate('DetalleProductoSubasta', { auctionId, itemId: item.itemId, item })}
          />
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Botón flotante */}
      {auction?.estado === 'abierta' && (
        <View style={styles.joinFloating}>
          <Button mode="contained" onPress={handleJoin} loading={joining} disabled={joining}
            style={styles.joinButton} contentStyle={styles.joinButtonContent}>
            Ingresar a la Subasta
          </Button>
        </View>
      )}

      {renderModals()}
      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar(null)} duration={3500}>{snackbar}</Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appbarTitle: { fontSize: 16, fontWeight: '600' },

  previewContent: { paddingBottom: 32 },
  fotoWrap: { position: 'relative' },
  fotoProducto: { width: '100%', height: 240 },
  fotoPlaceholder: { width: '100%', height: 240, alignItems: 'center', justifyContent: 'center' },
  fotoChips: { position: 'absolute', bottom: 12, left: 16, flexDirection: 'row', gap: 8 },

  catalogoHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, marginTop: 24, marginBottom: 12,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  verTodos: { fontSize: 13 },

  catalogoRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12,
    padding: 12, marginHorizontal: 20, marginBottom: 10, gap: 12,
  },
  catalogoThumb: { width: 48, height: 48, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  catalogoRowText: { flex: 1 },
  catalogoRowTitle: { fontSize: 14, fontWeight: '500', lineHeight: 20 },
  catalogoRowSub: { fontSize: 12, lineHeight: 18 },
  ahoraLabel: { fontSize: 12, fontWeight: '700' },

  joinFloating: { position: 'absolute', bottom: 24, left: 24, right: 24 },
  joinButton: { borderRadius: 28 },
  joinButtonContent: { paddingVertical: 6 },

  salaContent: { paddingBottom: 16 },
  mejorOfertaCard: { marginHorizontal: 20, marginTop: 16, borderRadius: 12, padding: 16 },
  mejorOfertaLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  mejorOfertaMonto: { fontSize: 28, fontWeight: '700', lineHeight: 34 },
  mejorOfertaSub: { fontSize: 13, marginTop: 2 },

  bidRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  bidLeft: { flex: 1 },
  bidPostor: { fontSize: 14, fontWeight: '500' },
  bidTime: { fontSize: 12 },
  bidMonto: { fontSize: 14, fontWeight: '600' },

  pujaBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: 1, gap: 12 },
  pujaInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, height: 48, gap: 8 },
  pujaMoneda: { fontSize: 14, fontWeight: '500' },
  pujaInput: { flex: 1, fontSize: 16, padding: 0 },
  pujaButton: { borderRadius: 12 },
  pujaButtonContent: { paddingHorizontal: 8, height: 48 },
  pujaHint: { paddingHorizontal: 20, paddingBottom: 8 },
  pujaHintText: { fontSize: 11, lineHeight: 16 },

  warmupContent: { alignItems: 'center', paddingTop: 32, paddingBottom: 32 },
  countdownTime: { fontWeight: '700', fontVariant: ['tabular-nums'] },
  proximasHeader: { alignSelf: 'stretch', paddingHorizontal: 20, marginBottom: 12 },

  timerRow: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    marginHorizontal: 20, marginTop: 16, marginBottom: 4,
  },
  timerLabels: { flex: 1 },
  timerLabel: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  timerSub: { fontSize: 11, lineHeight: 16, marginTop: 2 },
});