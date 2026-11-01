import AsyncStorage from '@react-native-async-storage/async-storage';
import { BlurView } from 'expo-blur';
import { CameraView, BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { useKeepAwake } from 'expo-keep-awake';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import PagerView from 'react-native-pager-view';
import { DeckButton, DeckButtonItem } from '../components/DeckButton';
import { ConnectionStatus, websocketService } from '../services/websocketService';
import { checkLocalOrSimulator, scanSubnetForServer } from '../services/discoveryService';
import { useThemeStore } from '../store/themeStore';
import { getSkin } from '../theme/skins';

const STORAGE_WS_URL_KEY = '@streamdesk_ws_url';

export const HomeScreen: React.FC = () => {
  useKeepAwake();
  const { theme, buttons, pages, appearance } = useThemeStore();
  const dynamicPages = pages && pages.length > 0 ? pages : [{ id: 1, name: 'Principal' }];
  const skin = getSkin(theme);

  const [permission, requestPermission] = useCameraPermissions();
  const [wsUrl, setWsUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastAction, setLastAction] = useState<string>('Pronto para tocar');
  const [serverReply, setServerReply] = useState<string>('');
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);
  const [discoveryMessage, setDiscoveryMessage] = useState<string>('');
  const scannedLockRef = useRef<boolean>(false);
  const pagerRef = useRef<PagerView>(null);

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  useEffect(() => {
    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        setIsScanning(false);
        scannedLockRef.current = false;
      } else if (status === 'error') {
        scannedLockRef.current = false;
        setIsScanning(true);
      }
    });

    const unsubscribeMessage = websocketService.onMessage((data) => {
      if (data.message) {
        setServerReply(data.message);
      }
    });

    const unsubscribePageChange = websocketService.onPageChange((pageIndex) => {
      const currentPages = useThemeStore.getState().pages;
      const pagesList =
        currentPages && currentPages.length > 0 ? currentPages : [{ id: 1, name: 'Principal' }];
      const targetIndex = pagesList.findIndex(
        (p, idx) => p.id === pageIndex || idx === pageIndex
      );
      const newPageIdx =
        targetIndex >= 0 ? targetIndex : Math.min(pageIndex, pagesList.length - 1);
      setCurrentPage(newPageIdx);
      pagerRef.current?.setPage(newPageIdx);
      const pageName = pagesList[newPageIdx]?.name || `Página ${newPageIdx + 1}`;
      setLastAction(`Perfil Ativo: ${pageName}`);
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
        console.error('[HomeScreen] Erro ao ler @streamdesk_ws_url:', err);
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
    setLastAction(`Pareado com sucesso`);

    try {
      await AsyncStorage.setItem(STORAGE_WS_URL_KEY, scannedUrl);
    } catch (err) {
      console.error('[HomeScreen] Erro ao salvar URL:', err);
    }

    websocketService.connect(scannedUrl);
  };

  const handleAutoDiscover = async () => {
    setIsDiscovering(true);
    setDiscoveryMessage('Varrendo rede local (Zeroconf / mDNS)...');
    try {
      let found = await checkLocalOrSimulator();

      if (!found) {
        const subnets = ['192.168.1', '192.168.0', '10.0.0'];
        for (const sub of subnets) {
          setDiscoveryMessage(`Buscando em ${sub}.x:8080...`);
          found = await scanSubnetForServer(sub);
          if (found) break;
        }
      }

      if (found) {
        setDiscoveryMessage(`Servidor encontrado em ${found.ip}!`);
        scannedLockRef.current = true;
        setIsScanning(false);
        setWsUrl(found.ws_url);
        setLastAction(`Pareado via Auto-Descoberta`);
        await AsyncStorage.setItem(STORAGE_WS_URL_KEY, found.ws_url);
        websocketService.connect(found.ws_url);
      } else {
        setDiscoveryMessage('Nenhum servidor detectado. Use o QR Code.');
      }
    } catch {
      setDiscoveryMessage('Erro ao varrer rede local.');
    } finally {
      setIsDiscovering(false);
    }
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
    setLastAction(`${item.label}`);
    const sent = websocketService.sendCommand(item.action_name, item.label);
    if (!sent) {
      setServerReply('WebSocket offline');
    }
  };

  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected':
        return '#10b981'; // emerald-500
      case 'connecting':
        return '#f59e0b'; // amber-500
      case 'error':
      case 'disconnected':
      default:
        return '#f43f5e'; // rose-500
    }
  };

  const renderHeader = () => {
    const isGlass = skin.type === 'glass';
    const activePageTitle = dynamicPages[currentPage]?.name || `Pág ${currentPage + 1}`;

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
          <View style={styles.headerLeft}>
            <Text style={[styles.title, isLandscape && styles.titleLandscape, { color: skin.textColor }]}>
              Stream Desk
            </Text>
            <Text style={[styles.pageIndicatorTitle, { color: skin.highlightColor }]}>
              {activePageTitle}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.statusBadge}>
              <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
              <Text style={[styles.statusText, { color: skin.textColor }]}>
                {connectionStatus === 'connected' ? 'LIVE' : connectionStatus.toUpperCase()}
              </Text>
            </View>

            <Pressable
              onPress={handleDisconnect}
              style={[styles.disconnectBtn, isLandscape && styles.disconnectBtnLandscape]}
            >
              <Text style={styles.disconnectBtnText}>Desconectar</Text>
            </Pressable>
          </View>
        </View>

        {!isLandscape && (
          <View style={styles.feedbackRow}>
            <Text style={[styles.subtitle, { color: skin.textColor }]}>{lastAction}</Text>
            {serverReply ? (
              <Text style={[styles.serverReply, { color: skin.highlightColor }]}>
                {serverReply}
              </Text>
            ) : null}
          </View>
        )}
      </View>
    );
  };

  if (isScanning || !wsUrl) {
    return (
      <LinearGradient
        colors={skin.backgroundGradient || ['#09090b', '#121217', '#18181b']}
        style={styles.gradientFill}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: skin.textColor }]}>Parear Stream Desk</Text>
            <Text style={[styles.subtitle, { color: '#a1a1aa' }]}>
              Aponte a câmera para o QR Code no app Desktop
            </Text>
            {connectionStatus === 'error' && wsUrl ? (
              <Text style={styles.errorBanner}>
                Falha ao conectar em {wsUrl}. Escaneie novamente.
              </Text>
            ) : null}
          </View>

          <View style={styles.scannerWrapper}>
            {!permission ? (
              <Text style={[styles.emptyText, { color: skin.textColor }]}>
                Verificando câmera...
              </Text>
            ) : !permission.granted ? (
              <View style={styles.permissionBox}>
                <Text style={[styles.emptyText, { color: skin.textColor }]}>
                  Permita o acesso à câmera para ler o QR Code de conexão.
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

          <View style={{ alignItems: 'center', marginVertical: 12, gap: 6, paddingHorizontal: 20 }}>
            <Pressable
              onPress={handleAutoDiscover}
              disabled={isDiscovering}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isDiscovering ? 'rgba(255, 255, 255, 0.1)' : 'rgba(99, 102, 241, 0.25)',
                  borderWidth: 1,
                  borderColor: skin.highlightColor || '#6366f1',
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  marginTop: 0,
                },
              ]}
            >
              <Text style={[styles.actionBtnText, { color: skin.textColor }]}>
                {isDiscovering ? 'Buscando na Rede...' : 'Buscar Servidor na Rede (mDNS / Zeroconf)'}
              </Text>
            </Pressable>
            {discoveryMessage ? (
              <Text style={{ fontSize: 11, color: '#a1a1aa', textAlign: 'center' }}>
                {discoveryMessage}
              </Text>
            ) : null}
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
                  Reconectar ({wsUrl})
                </Text>
              </Pressable>
            </View>
          ) : null}
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Recalibragem da grade responsiva baseada nas configurações de aparência
  const configuredCols = Math.max(2, Math.min(6, appearance?.grid_columns || 3));
  const COLUMNS = isLandscape ? Math.max(4, configuredCols + 1) : configuredCols;
  const buttonWidth = Math.floor((width - 32) / COLUMNS - 10);
  const maxLandscapeHeight = Math.floor((height - 110) / 2 - 10);
  const buttonHeight = isLandscape
    ? Math.max(50, Math.min(buttonWidth, maxLandscapeHeight))
    : buttonWidth;

  return (
    <LinearGradient
      colors={skin.backgroundGradient || ['#09090b', '#121217', '#18181b']}
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
                        Página "{page.name}" vazia
                      </Text>
                      <Text style={[styles.emptySubText, { color: '#a1a1aa' }]}>
                        Crie novos botões nesta página pelo Desktop Studio
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
          </PagerView>

          {/* Indicadores Visuais de Paginação (Dots) */}
          <View style={[styles.dotsRow, isLandscape && styles.dotsRowLandscape]}>
            {dynamicPages.map((page, pageIndex) => (
              <View
                key={`dot-${page.id}`}
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      currentPage === pageIndex ? skin.highlightColor : 'rgba(255, 255, 255, 0.15)',
                    width: currentPage === pageIndex ? 22 : 6,
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
    paddingTop: 16,
    paddingBottom: 14,
    paddingHorizontal: 18,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'rgba(24, 24, 27, 0.65)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerWrapperLandscape: {
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 14,
    marginTop: 4,
    borderRadius: 14,
  },
  headerBlur: {
    borderRadius: 20,
  },
  headerTopRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  titleLandscape: {
    fontSize: 15,
  },
  pageIndicatorTitle: {
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  disconnectBtnLandscape: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  pageSlideLandscape: {
    padding: 4,
  },
  dotsRowLandscape: {
    paddingVertical: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  feedbackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    opacity: 0.8,
  },
  serverReply: {
    fontSize: 11,
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
    width: 270,
    height: 270,
    borderRadius: 24,
    borderWidth: 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000000',
  },
  qrFrame: {
    width: 180,
    height: 180,
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
    borderRadius: 12,
    marginTop: 12,
  },
  actionBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
  },
  disconnectBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.25)',
  },
  disconnectBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#f43f5e',
  },
  footerBar: {
    paddingVertical: 20,
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
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  emptyPageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 8,
  },
  emptySubText: {
    fontSize: 12,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 8,
  },
  emptyText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
