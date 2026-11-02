import { useEffect } from "react";
import { Wifi, Copy, Smartphone } from "lucide-react";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore, type ConnectedDevice } from "@/store/useDashboardStore";
import { getAccentColor } from "@/lib/buttonUtils";

export function ConnectionView() {
  const { toast } = useToast();
  const localIp = useDashboardStore((s) => s.localIp);
  const connectedDevices = useDashboardStore((s) => s.connectedDevices);
  const fetchConnectedDevices = useDashboardStore((s) => s.fetchConnectedDevices);
  const disconnectDevice = useDashboardStore((s) => s.disconnectDevice);

  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);
  const normalizedTheme = (appearance?.theme || theme || "escuro").toLowerCase();
  const isLight = normalizedTheme === "claro" || normalizedTheme === "light";
  const isAmoled = normalizedTheme === "amoled";
  const accent = getAccentColor(appearance);

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

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(qrValue);
    toast({
      title: "Endereço Copiado",
      description: `${qrValue} copiado para a área de transferência.`,
    });
  };

  const cardBgClass = isLight
    ? "bg-white border-slate-200/90 shadow-sm"
    : isAmoled
    ? "bg-neutral-950 border-neutral-900 shadow-sm"
    : "bg-neutral-900/50 border-neutral-800/80 shadow-xl backdrop-blur-sm";

  const textPrimaryClass = isLight ? "text-slate-800" : isAmoled ? "text-white" : "text-neutral-100";
  const textSecondaryClass = isLight ? "text-slate-500" : "text-neutral-400";

  return (
    <div
      className={`flex-1 flex flex-col min-w-0 p-6 md:p-8 overflow-y-auto select-none transition-colors duration-200 ${
        isLight
          ? "bg-slate-50/90 text-slate-900"
          : isAmoled
          ? "bg-black text-white"
          : "bg-neutral-950/70 text-neutral-100"
      }`}
    >
      <div className="w-full max-w-lg mx-auto flex flex-col space-y-6">
        {/* 1. Header com Título e Status "Servidor ativo" */}
        <header className="flex items-center justify-between gap-3 pb-2">
          <div className="min-w-0">
            <h1 className={`text-2xl font-bold tracking-tight ${textPrimaryClass}`}>
              Conexão
            </h1>
            <p className={`text-xs mt-0.5 truncate sm:whitespace-normal ${textSecondaryClass}`}>
              Pareie seu smartphone para transformar em um Stream Desk físico
            </p>
          </div>

          <button
            type="button"
            onClick={handleServerStatusClick}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-medium shadow-sm transition-colors flex-shrink-0 ${
              isLight
                ? "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                : "bg-neutral-900/90 border-neutral-800 text-neutral-300 hover:border-neutral-700"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>Servidor ativo</span>
          </button>
        </header>

        {/* 2. Coluna Única Vertical - Card Superior: QR Code e Endereço */}
        <Card className={`rounded-2xl p-6 flex flex-col items-center justify-center space-y-4 border ${cardBgClass}`}>
          <div className="text-center space-y-1">
            <div
              style={{
                backgroundColor: `${accent.hex}18`,
                borderColor: `${accent.hex}33`,
                color: accent.hex,
              }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-medium"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Escaneie com o celular</span>
            </div>
            <p className={`text-xs ${textSecondaryClass}`}>
              Aponte a câmera no app Stream Desk para conectar via Wi-Fi
            </p>
          </div>

          {/* QR Code */}
          <div className="bg-white p-3.5 rounded-2xl shadow-xl flex items-center justify-center border border-slate-100">
            <QRCode
              value={qrValue}
              size={170}
              bgColor="#ffffff"
              fgColor="#000000"
              level="M"
            />
          </div>

          {/* IP & WebSocket URL com ação de copiar */}
          <div
            className={`w-full max-w-sm flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${
              isLight
                ? "bg-slate-100 border-slate-200 text-slate-700"
                : "bg-neutral-950/80 border-neutral-800 text-neutral-300"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <Wifi style={{ color: accent.hex }} className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="font-mono text-[11px] truncate">{qrValue}</span>
            </div>
            <button
              type="button"
              onClick={handleCopyAddress}
              title="Copiar endereço do WebSocket"
              className={`p-1 rounded transition-colors flex-shrink-0 ${
                isLight
                  ? "text-slate-500 hover:text-slate-800 hover:bg-slate-200"
                  : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800"
              }`}
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </Card>

        {/* 3. Coluna Única Vertical - Seção Inferior: Dispositivos Conectados */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className={`text-sm font-semibold truncate ${textPrimaryClass}`}>
                Dispositivos conectados
              </h2>
              <Badge
                variant="secondary"
                className={`text-[10px] font-mono px-2 py-0 border flex-shrink-0 ${
                  isLight
                    ? "bg-slate-100 text-slate-600 border-slate-200"
                    : "bg-neutral-800 text-neutral-400 border-neutral-700/60"
                }`}
              >
                {connectedDevices.length} ativo{connectedDevices.length === 1 ? "" : "s"}
              </Badge>
            </div>
            <span className={`text-[11px] font-mono flex-shrink-0 ${textSecondaryClass}`}>
              LAN {displayIp}
            </span>
          </div>

          <div className="space-y-2">
            {connectedDevices.length > 0 ? (
              <ScrollArea className="max-h-[260px] pr-2">
                <div className="space-y-2.5">
                  {connectedDevices.map((device) => (
                    <div
                      key={device.id}
                      className={`border rounded-xl px-4 py-3 flex items-center justify-between transition-colors shadow-sm ${
                        isLight
                          ? "bg-white hover:bg-slate-50 border-slate-200"
                          : "bg-neutral-900/60 hover:bg-neutral-900/90 border-neutral-800/70"
                      }`}
                    >
                      {/* Status e Nome do Dispositivo */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse" />
                        <div className="flex flex-col min-w-0">
                          <span className={`text-xs font-medium truncate ${textPrimaryClass}`}>
                            {device.name}
                          </span>
                          <span className={`text-[10px] font-mono truncate ${textSecondaryClass}`}>
                            {device.ip}
                          </span>
                        </div>
                      </div>

                      {/* Sinal e Ação Desconectar */}
                      <div className="flex items-center gap-3.5 flex-shrink-0">
                        <Wifi className="w-4 h-4 text-emerald-400" />
                        <button
                          type="button"
                          onClick={() => handleDisconnectDevice(device)}
                          className="text-xs font-medium text-rose-500 hover:text-rose-400 hover:underline transition-colors"
                        >
                          Desconectar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div
                className={`text-center py-7 px-4 border border-dashed rounded-2xl text-xs space-y-1 ${
                  isLight
                    ? "border-slate-300 bg-slate-100/60 text-slate-500"
                    : "border-neutral-800/80 bg-neutral-900/20 text-neutral-400"
                }`}
              >
                <p className={`font-medium ${textPrimaryClass}`}>
                  Nenhum dispositivo conectado no momento
                </p>
                <p className={`text-[11px] ${textSecondaryClass}`}>
                  Escaneie o código QR acima no aplicativo móvel conectado na mesma rede Wi-Fi.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ConnectionView;
