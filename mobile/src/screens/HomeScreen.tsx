import React, { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { DeckButton, DeckButtonItem } from '../components/DeckButton';
import { ConnectionStatus, websocketService } from '../services/websocketService';
import { useThemeStore } from '../store/themeStore';
import { getSkin } from '../theme/skins';

export const HomeScreen: React.FC = () => {
  const { theme, palette, buttons } = useThemeStore();
  const skin = getSkin(theme);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastAction, setLastAction] = useState<string>('Aguardando comando...');
  const [serverReply, setServerReply] = useState<string>('');

  useEffect(() => {
    // Inicia conexão WebSocket com o host Desktop na LAN (ao abrir, dispara get_layout)
    websocketService.connect();

    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
      if (status === 'connected') {
        console.log('[HomeScreen] WebSocket conectado ao servidor desktop!');
      }
    });

    const unsubscribeMessage = websocketService.onMessage((data) => {
      if (data.message) {
        setServerReply(`Resposta PC: ${data.message}`);
      }
    });

    return () => {
      unsubscribeStatus();
      unsubscribeMessage();
      websocketService.disconnect();
    };
  }, []);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: skin.screenBackground || palette.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: skin.textColor }]}>Stream Desk</Text>

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
