import { Wifi, Signal } from "lucide-react";
import QRCode from "react-qr-code";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useDashboardStore } from "@/store/useDashboardStore";

export interface ConnectedDevice {
  id: string;
  name: string;
  signalType: "wifi" | "bars" | "dbm";
  dbmValue?: string;
}

const MOCK_CONNECTED_DEVICES: ConnectedDevice[] = [
  { id: "1", name: "iPhone de João", signalType: "bars" },
  { id: "2", name: "Galaxy S21 da Maria", signalType: "wifi" },
  { id: "3", name: "Galaxy S21 da Maria", signalType: "bars" },
  { id: "4", name: "iPhone de João", signalType: "wifi" },
  { id: "5", name: "Galaxy S21 da Maria", signalType: "bars" },
  { id: "6", name: "Galaxy S21 da Maria", signalType: "dbm", dbmValue: "- dbm" },
];

export function ConnectionView() {
  const localIp = useDashboardStore((s) => s.localIp);
  const displayIp = localIp && localIp !== "0.0.0.0" ? localIp : "192.168.1.15";
  const qrValue = `http://${displayIp}:8080/ws`;

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/70 p-8 overflow-y-auto select-none">
      {/* 1. Header com Título e Status "Servidor ativo" */}
      <header className="flex items-center justify-between pb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
          Conexão
        </h1>

        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-neutral-900/90 border border-neutral-800 text-xs font-medium text-neutral-300 shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span>Servidor ativo</span>
        </div>
      </header>

      {/* 2. Conteúdo Central dividido em 2 Colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start max-w-5xl">
        {/* Coluna Esquerda: Card Escuro com QR Code e IP */}
        <Card className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-7 flex flex-col items-center justify-center space-y-5 shadow-xl backdrop-blur-sm">
          <p className="text-sm font-medium text-neutral-300 text-center">
            Escaneie com o celular
          </p>

          {/* Placeholder / QR Code quadrado branco */}
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

        {/* Coluna Direita: Dispositivos conectados */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-neutral-300">
            Dispositivos conectados
          </h2>

          <ScrollArea className="h-[380px] pr-2">
            <div className="space-y-2.5">
              {MOCK_CONNECTED_DEVICES.map((device, idx) => (
                <div
                  key={`${device.id}-${idx}`}
                  className="bg-neutral-900/60 hover:bg-neutral-900/90 border border-neutral-800/70 rounded-xl px-4 py-3 flex items-center justify-between transition-colors shadow-sm"
                >
                  {/* Status e Nome do Dispositivo */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-medium text-neutral-200 truncate">
                      {device.name}
                    </span>
                  </div>

                  {/* Sinal e Ação Desconectar */}
                  <div className="flex items-center gap-3.5 flex-shrink-0">
                    {device.signalType === "wifi" ? (
                      <Wifi className="w-4 h-4 text-neutral-400" />
                    ) : device.signalType === "bars" ? (
                      <Signal className="w-4 h-4 text-neutral-400" />
                    ) : (
                      <span className="text-[11px] font-mono text-neutral-500">
                        {device.dbmValue}
                      </span>
                    )}

                    <button
                      type="button"
                      className="text-xs font-medium text-violet-400 hover:text-violet-300 transition-colors"
                    >
                      Desconectar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}

export default ConnectionView;

