import React, { useEffect, useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DeckButtonItem } from '../components/DeckButton';
import { DeckGrid } from '../components/DeckGrid';
import { ConnectionStatus, websocketService } from '../services/websocketService';
import { useThemeStore } from '../store/themeStore';
import { ThemeName } from '../theme/colors';

const INITIAL_BUTTONS: DeckButtonItem[] = [
  { id: '1', label: 'Ping Desktop', action: 'teste_ping', icon: '📡' },
  { id: '2', label: 'Play / Pause', action: 'MEDIA_PLAY_PAUSE', icon: '⏯️' },
  { id: '3', label: 'Next Track', action: 'MEDIA_NEXT', icon: '⏭️' },
  { id: '4', label: 'OBS Scene 1', action: 'OBS_SCENE_1', icon: '🎬' },
  { id: '5', label: 'Screenshot', action: 'SYSTEM_SCREENSHOT', icon: '📸' },
  { id: '6', label: 'Open Browser', action: 'APP_OPEN_BROWSER', icon: '🌐' },
  { id: '7', label: 'Volume +', action: 'AUDIO_VOL_UP', icon: '🔊' },
  { id: '8', label: 'Volume -', action: 'AUDIO_VOL_DOWN', icon: '🔉' },
  { id: '9', label: 'Lock PC', action: 'SYSTEM_LOCK', icon: '🔒' },
];

const THEME_OPTIONS: ThemeName[] = ['default', 'ios', 'windows', 'gamer'];

export const HomeScreen: React.FC = () => {
  const { theme, palette, setTheme } = useThemeStore();
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastAction, setLastAction] = useState<string>('Aguardando comando...');
  const [serverReply, setServerReply] = useState<string>('');

  useEffect(() => {
    // Inicia conexão WebSocket com o host Desktop na LAN
    websocketService.connect();

    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        console.log('[HomeScreen] WebSocket conectado ao servidor desktop!');
      }
    });

    const unsubscribeMessage = websocketService.onMessage((data) => {
      setServerReply(`Resposta PC: ${data.message}`);
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      websocketService.disconnect();
    };
  }, []);

  const handleButtonPress = (item: DeckButtonItem) => {
    setLastAction(`Comando: ${item.label} (${item.action})`);

    // Envia o comando via WebSocket para o servidor Desktop
    const sent = websocketService.sendCommand(item.action, item.label);
    if (!sent) {
      setServerReply('Aviso: WebSocket desconectado (ajuste o IP em websocketService.ts)');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: palette.textColor }]}>Stream Desk</Text>

        <View style={styles.statusBadge}>
          <View style={[styles.statusIndicator, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: palette.textColor }]}>
            Status: {connectionStatus.toUpperCase()}
          </Text>
        </View>

        <Text style={[styles.subtitle, { color: palette.highlight }]}>{lastAction}</Text>
        {serverReply ? (
          <Text style={[styles.serverReply, { color: palette.highlight }]}>{serverReply}</Text>
        ) : null}
      </View>

      <View style={styles.gridContainer}>
        <DeckGrid buttons={INITIAL_BUTTONS} onButtonPress={handleButtonPress} />
      </View>

      <View style={[styles.footer, { borderTopColor: palette.borderColor }]}>
        <Text style={[styles.footerLabel, { color: palette.textColor }]}>Tema:</Text>
        <View style={styles.themeRow}>
          {THEME_OPTIONS.map((option) => {
            const isSelected = theme === option;
            return (
              <Pressable
                key={option}
                onPress={() => setTheme(option)}
                style={[
                  styles.themeButton,
                  {
                    backgroundColor: isSelected ? palette.highlight : palette.buttonBackground,
                    borderColor: palette.borderColor,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.themeButtonText,
                    { color: isSelected ? '#000000' : palette.textColor },
                  ]}
                >
                  {option.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
    marginTop: 2,
    fontWeight: '500',
  },
  serverReply: {
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  gridContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  themeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  themeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  themeButtonText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
