import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import PagerView from 'react-native-pager-view';
import { DeckButton, DeckButtonItem } from '../components/DeckButton';
import { ConnectionStatus, websocketService } from '../services/websocketService';
import { useThemeStore } from '../store/themeStore';
import { getSkin } from '../theme/skins';

const STORAGE_WS_URL_KEY = '@streamdesk_ws_url';

export const HomeScreen: React.FC = () => {
  useKeepAwake();
  const { theme, palette, buttons, pages } = useThemeStore();
  const dynamicPages = pages && pages.length > 0 ? pages : [{ id: 1, name: 'Principal' }];
  const skin = getSkin(theme);

  const [permission, requestPermission] = useCameraPermissions();
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastAction, setLastAction] = useState<string>('Aguardando comando...');
  const [serverReply, setServerReply] = useState<string>('');
  const scannedLockRef = useRef<boolean>(false);
  const pagerRef = useRef<PagerView>(null);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

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

    const unsubscribePageChange = websocketService.onPageChange((pageIndex) => {
      console.log(`[HomeScreen] Auto-Profile: mudando para página ${pageIndex}`);
      const currentPages = useThemeStore.getState().pages;
      const pagesList = currentPages && currentPages.length > 0 ? currentPages : [{ id: 1, name: 'Principal' }];
      const targetIndex = pagesList.findIndex(
        (p, idx) => p.id === pageIndex || idx === pageIndex
      );
      const newPageIdx =
        targetIndex >= 0 ? targetIndex : Math.min(pageIndex, pagesList.length - 1);
      setCurrentPage(newPageIdx);
      pagerRef.current?.setPage(newPageIdx);
      const pageName = pagesList[newPageIdx]?.name || `Página ${newPageIdx + 1}`;
      setLastAction(`Auto-Profile: ${pageName}`);
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
      unsubscribePageChange();
      websocketService.disconnect();
    };
  }, []);

  // Prevenção de índice órfão caso a página ativa seja excluída no Desktop
  useEffect(() => {
    if (dynamicPages.length > 0 && currentPage >= dynamicPages.length) {
      const safeIndex = Math.max(0, dynamicPages.length - 1);
      setCurrentPage(safeIndex);
      pagerRef.current?.setPage(safeIndex);
    }
  }, [dynamicPages.length, currentPage]);

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

  const renderHeader = () => {
    const isGlass = skin.type === 'glass';

    return (
      <View style={[styles.headerWrapper, isLandscape && styles.headerWrapperLandscape]}>
        {isGlass ? (
          <BlurView
            intensity={skin.blurIntensity}
            tint={skin.blurTint}
            style={[StyleSheet.absoluteFill, styles.headerBlur]}
          />
        ) : null}

        <View style={styles.headerTopRow}>
          <Text style={[styles.title, isLandscape && styles.titleLandscape, { color: skin.textColor }]}>
            Stream Desk
          </Text>
          <View style={[styles.statusBadge, isLandscape && styles.statusBadgeLandscape]}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
            <Text style={[styles.statusText, { color: skin.textColor }]}>
              {connectionStatus.toUpperCase()} • {theme.toUpperCase()} • {dynamicPages[currentPage]?.name || `Pág ${currentPage + 1}`} ({currentPage + 1}/{dynamicPages.length})
            </Text>
          </View>
          <Pressable
            onPress={handleDisconnect}
            style={[styles.disconnectBtn, isLandscape && styles.disconnectBtnLandscape, { borderColor: skin.borderColor }]}
          >
            <Text style={[styles.disconnectBtnText, { color: '#f87171' }]}>Desconectar</Text>
          </Pressable>
        </View>

        {!isLandscape && (
          <>
            <Text style={[styles.subtitle, { color: skin.highlightColor }]}>{lastAction}</Text>
            {serverReply ? (
              <Text style={[styles.serverReply, { color: skin.highlightColor }]}>{serverReply}</Text>
            ) : null}
          </>
        )}
      </View>
    );
  };

  if (isScanning || !wsUrl) {
    return (
      <LinearGradient
        colors={skin.backgroundGradient || ['#0f172a', '#1e293b']}
        style={styles.gradientFill}
      >
        <SafeAreaView style={styles.container}>
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
      </LinearGradient>
    );
  }

  // Recalibragem geométrica da grade responsiva
  const COLUMNS = isLandscape ? 4 : 3;
  // Descontando padding horizontal do slide e margem de cada botão (margin: 6px => 12px por botão)
  const buttonWidth = Math.floor((width - 32) / COLUMNS - 12);

  // No modo retrato, mantém altura quadrada. No landscape, respeita estritamente o limite de 2 linhas
  const maxLandscapeHeight = Math.floor((height - 100) / 2 - 12);
  const buttonHeight = isLandscape
    ? Math.max(50, Math.min(buttonWidth, maxLandscapeHeight))
    : buttonWidth;

  return (
    <LinearGradient
      colors={skin.backgroundGradient || ['#0f172a', '#1e293b']}
      style={styles.gradientFill}
    >
      <SafeAreaView style={styles.container}>
        {renderHeader()}

        <View style={styles.pagerContainer}>
          <PagerView
            ref={pagerRef}
            style={styles.pagerView}
            initialPage={0}
            onPageSelected={(e) => setCurrentPage(e.nativeEvent.position)}
          >
            {dynamicPages.map((page, index) => {
              const pageButtons = buttons
                .filter(
                  (b) =>
                    b.page_index === page.id ||
                    (b.page_index === index && !dynamicPages.some((p) => p.id === b.page_index))
                )
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

              return (
                <View
                  key={String(page.id)}
                  style={[styles.pageSlide, isLandscape && styles.pageSlideLandscape]}
                >
                  {pageButtons.length > 0 ? (
                    <View style={styles.grid}>
                      {pageButtons.map((item) => (
                        <DeckButton
                          key={String(item.id)}
                          item={item}
                          onPress={handleButtonPress}
                          buttonWidth={buttonWidth}
                          buttonHeight={buttonHeight}
                        />
                      ))}
                    </View>
                  ) : (
                    <View style={styles.emptyPageContainer}>
                      <Text style={[styles.emptyText, { color: skin.textColor }]}>
                        Página "{page.name}" vazia.
                      </Text>
                      <Text style={[styles.emptySubText, { color: skin.highlightColor }]}>
                        Adicione botões nesta página pelo painel Desktop!
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </PagerView>

          <View style={[styles.dotsRow, isLandscape && styles.dotsRowLandscape]}>
            {dynamicPages.map((page, pageIndex) => (
              <View
                key={`dot-${page.id}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      currentPage === pageIndex ? skin.highlightColor : skin.borderColor,
                    width: currentPage === pageIndex ? 20 : 8,
                  },
                ]}
              />
            ))}
          </View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientFill: {
    flex: 1,
  },
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
  headerWrapper: {
    paddingTop: 32,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  headerWrapperLandscape: {
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 16,
    marginTop: 4,
    borderRadius: 12,
  },
  headerBlur: {
    borderRadius: 20,
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
  titleLandscape: {
    fontSize: 16,
  },
  statusBadgeLandscape: {
    marginVertical: 0,
    paddingVertical: 2,
  },
  disconnectBtnLandscape: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  pageSlideLandscape: {
    padding: 6,
  },
  gridLandscape: {
    paddingHorizontal: 6,
  },
  dotsRowLandscape: {
    paddingVertical: 6,
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
  pagerContainer: {
    flex: 1,
  },
  pagerView: {
    flex: 1,
  },
  pageSlide: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  emptyPageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptySubText: {
    fontSize: 12,
    opacity: 0.8,
    textAlign: 'center',
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
