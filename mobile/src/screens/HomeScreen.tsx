import AsyncStorage from '@react-native-async-storage/async-storage';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DeckButton, DeckButtonItem } from '../components/DeckButton';
import { ConnectionStatus, websocketService } from '../services/websocketService';
import { useThemeStore } from '../store/themeStore';
import { getSkin } from '../theme/skins';

const STORAGE_WS_URL_KEY = '@streamdesk_ws_url';

export const HomeScreen: React.FC = () => {
  const { theme, palette, buttons } = useThemeStore();
  const skin = getSkin(theme);

  const [permission, requestPermission] = useCameraPermissions();
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastAction, setLastAction] = useState<string>('Aguardando comando...');
  const [serverReply, setServerReply] = useState<string>('');
  const scannedLockRef = useRef<boolean>(false);

  useEffect(() => {
    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        console.log('[HomeScreen] WebSocket conectado ao servidor desktop!');
        setIsScanning(false);
        scannedLockRef.current = false;
      } else if (status === 'error') {
        console.warn('[HomeScreen] Falha crítica na conexão WebSocket. Abrindo scanner QR...');
        scannedLockRef.current = false;
        setIsScanning(true);
      }
    });

    const unsubscribeMessage = websocketService.onMessage((data) => {
      if (data.message) {
        setServerReply(`Resposta PC: ${data.message}`);
      }
    });

    const initializeConnection = async () => {
      try {
        const storedUrl = await AsyncStorage.getItem(STORAGE_WS_URL_KEY);
        if (storedUrl) {
          setWsUrl(storedUrl);
          setIsScanning(false);
          websocketService.connect(storedUrl);
        } else {
          setIsScanning(true);
        }
      } catch (err) {
        console.error('[HomeScreen] Erro ao ler @streamdesk_ws_url do AsyncStorage:', err);
        setIsScanning(true);
      }
    };

    initializeConnection();

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      websocketService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (isScanning && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [isScanning, permission, requestPermission]);

  const handleBarcodeScanned = async (result: BarcodeScanningResult) => {
    if (scannedLockRef.current) return;
    const scannedUrl = result.data?.trim();
    if (!scannedUrl) return;

    scannedLockRef.current = true;
    setIsScanning(false);
    setWsUrl(scannedUrl);
    setLastAction(`Pareado com ${scannedUrl}`);

    try {
      await AsyncStorage.setItem(STORAGE_WS_URL_KEY, scannedUrl);
    } catch (err) {
      console.error('[HomeScreen] Erro ao salvar URL no AsyncStorage:', err);
    }

    websocketService.connect(scannedUrl);
  };

  const handleDisconnect = async () => {
    websocketService.disconnect();
    try {
      await AsyncStorage.removeItem(STORAGE_WS_URL_KEY);
    } catch (err) {
      console.error('[HomeScreen] Erro ao limpar AsyncStorage:', err);
    }
    setWsUrl(null);
    setServerReply('');
    setLastAction('Aguardando pareamento...');
    scannedLockRef.current = false;
    setIsScanning(true);
  };

  const handleButtonPress = (item: DeckButtonItem) => {
    setLastAction(`Comando: ${item.label} (${item.action_name})`);

    const sent = websocketService.sendCommand(item.action_name, item.label);
    if (!sent) {
      setServerReply('Aviso: WebSocket desconectado');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#22c55e';
      case 'connecting':
        return '#eab308';
      case 'error':
      case 'disconnected':
      default:
        return '#ef4444';
    }
  };

  if (isScanning || !wsUrl) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: skin.screenBackground || palette.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: skin.textColor }]}>Parear Stream Desk</Text>
          <Text style={[styles.subtitle, { color: skin.highlightColor }]}>
            Aponte a câmera para o QR Code exibido no aplicativo Desktop
          </Text>
          {connectionStatus === 'error' && wsUrl ? (
            <Text style={styles.errorBanner}>
              Falha ao conectar em {wsUrl}. Escaneie o QR Code novamente.
            </Text>
          ) : null}
        </View>

        <View style={styles.scannerWrapper}>
          {!permission ? (
            <Text style={[styles.emptyText, { color: skin.textColor }]}>
              Verificando permissões da câmera...
            </Text>
          ) : !permission.granted ? (
            <View style={styles.permissionBox}>
              <Text style={[styles.emptyText, { color: skin.textColor }]}>
                Precisamos de acesso à câmera para ler o QR Code de conexão do PC.
              </Text>
              <Pressable
                onPress={requestPermission}
                style={[styles.actionBtn, { backgroundColor: skin.highlightColor }]}
              >
                <Text style={styles.actionBtnText}>Permitir Câmera</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.cameraContainer, { borderColor: skin.highlightColor }]}>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={handleBarcodeScanned}
              />
              <View style={[styles.qrFrame, { borderColor: skin.highlightColor }]} />
            </View>
          )}
        </View>

        {wsUrl ? (
          <View style={styles.footerBar}>
            <Pressable
              onPress={() => {
                scannedLockRef.current = false;
                setIsScanning(false);
                websocketService.connect(wsUrl);
              }}
              style={[styles.disconnectBtn, { borderColor: skin.borderColor }]}
            >
              <Text style={[styles.disconnectBtnText, { color: skin.textColor }]}>
                Tentar Reconectar ({wsUrl})
              </Text>
            </Pressable>
          </View>
        ) : null}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: skin.screenBackground || palette.background }]}
    >
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <Text style={[styles.title, { color: skin.textColor }]}>Stream Desk</Text>
          <Pressable
            onPress={handleDisconnect}
            style={[styles.disconnectBtn, { borderColor: skin.borderColor }]}
          >
            <Text style={[styles.disconnectBtnText, { color: '#f87171' }]}>Desconectar</Text>
          </Pressable>
        </View>

        <View style={styles.statusBadge}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: skin.textColor }]}>
            Status: {connectionStatus.toUpperCase()} • Skin: {theme.toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: skin.highlightColor }]}>{lastAction}</Text>
        {serverReply ? (
          <Text style={[styles.serverReply, { color: skin.highlightColor }]}>{serverReply}</Text>
        ) : null}
      </View>

      <View style={styles.gridContainer}>
        {buttons.length > 0 ? (
          <View style={styles.grid}>
            {buttons.map((item) => (
              <DeckButton key={String(item.id)} item={item} onPress={handleButtonPress} />
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: skin.textColor }]}>
            Sincronizando layout de botões com o PC...
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 32,
    paddingBottom: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    fontWeight: '500',
    textAlign: 'center',
  },
  serverReply: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  errorBanner: {
    marginTop: 8,
    fontSize: 12,
    color: '#f87171',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  scannerWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cameraContainer: {
    width: 280,
    height: 280,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrFrame: {
    width: 190,
    height: 190,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  permissionBox: {
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 20,
  },
  actionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 12,
  },
  actionBtnText: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 14,
  },
  disconnectBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  disconnectBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  footerBar: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 12,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
