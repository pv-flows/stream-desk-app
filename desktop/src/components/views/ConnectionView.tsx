import { useEffect } from "react";
import { Wifi } from "lucide-react";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore, type ConnectedDevice } from "@/store/useDashboardStore";

export function ConnectionView() {
  const { toast } = useToast();
  const localIp = useDashboardStore((s) => s.localIp);
  const connectedDevices = useDashboardStore((s) => s.connectedDevices);
  const fetchConnectedDevices = useDashboardStore((s) => s.fetchConnectedDevices);
  const disconnectDevice = useDashboardStore((s) => s.disconnectDevice);

  const displayIp = localIp && localIp !== "0.0.0.0" ? localIp : "192.168.1.15";
  const qrValue = `ws://${displayIp}:8080/ws`;

  useEffect(() => {
    fetchConnectedDevices();
    const interval = setInterval(() => {
      fetchConnectedDevices();
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchConnectedDevices]);

  const handleDisconnectDevice = async (device: ConnectedDevice) => {
    await disconnectDevice(device.id);
    toast({
      title: "Dispositivo Desconectado",
      description: `A conexão com ${device.name} (${device.ip}) foi finalizada.`,
    });
  };

  const handleServerStatusClick = () => {
    toast({
      title: "Status do Servidor",
      description: `Servidor WebSocket ativo e ouvindo conexões em ws://${displayIp}:8080/ws`,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/70 p-8 overflow-y-auto select-none">
      {/* 1. Header com Título e Status "Servidor ativo" */}
      <header className="flex items-center justify-between pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
          Conexão
        </h1>

        <button
          type="button"
          onClick={handleServerStatusClick}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-medium text-neutral-300 shadow-sm hover:border-neutral-700 transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Servidor ativo</span>
        </button>
      </header>

      {/* 2. Conteúdo Central dividido em 2 Colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-5xl">
        {/* Coluna Esquerda: Card Escuro com QR Code e IP */}
        <Card className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-7 flex flex-col items-center justify-center space-y-5 shadow-xl backdrop-blur-sm">
          <p className="text-sm font-medium text-neutral-300 text-center">
            Escaneie com o celular
          </p>

          {/* QR Code */}
          <div className="bg-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-center">
            <QRCode
              value={qrValue}
              size={180}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          </div>

          <p className="text-xs font-mono text-neutral-400 tracking-wide text-center">
            IP Local: {displayIp}
          </p>
        </Card>

        {/* Coluna Direita: Dispositivos conectados reais */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-neutral-300">
              Dispositivos conectados
            </h2>
            <span className="text-xs font-mono text-neutral-500">
              {connectedDevices.length} ativo{connectedDevices.length === 1 ? "" : "s"}
            </span>
          </div>

          <ScrollArea className="h-[380px] pr-2">
            <div className="space-y-2.5">
              {connectedDevices.length > 0 ? (
                connectedDevices.map((device) => (
                  <div
                    key={device.id}
                    className="bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800/70 rounded-xl px-4 py-3 flex items-center justify-between transition-colors shadow-sm"
                  >
                    {/* Status e Nome do Dispositivo */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-medium text-neutral-200 truncate">
                          {device.name}
                        </span>
                        <span className="text-[10px] font-mono text-neutral-500 truncate">
                          {device.ip}
                        </span>
                      </div>
                    </div>

                    {/* Sinal e Ação Desconectar */}
                    <div className="flex items-center gap-3.5 flex-shrink-0">
                      <Wifi className="w-4 h-4 text-neutral-400" />
                      <button
                        type="button"
                        onClick={() => handleDisconnectDevice(device)}
                        className="text-xs font-medium text-rose-400 hover:text-rose-300 hover:underline transition-colors"
                      >
                        Desconectar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
                  Nenhum dispositivo conectado no momento.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default ConnectionView;
