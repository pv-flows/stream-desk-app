import {
  Video,
  Lightbulb,
  Webhook,
  Home,
  Code2,
  Clock,
  Settings,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface IntegrationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  isPro?: boolean;
  isConnected: boolean;
}

const INTEGRATIONS: IntegrationItem[] = [
  {
    id: "obs",
    name: "OBS Studio",
    icon: Video,
    isPro: true,
    isConnected: true,
  },
  {
    id: "lights",
    name: "Luzes Inteligentes",
    icon: Lightbulb,
    isPro: false,
    isConnected: true,
  },
  {
    id: "webhooks",
    name: "Webhooks",
    icon: Webhook,
    isPro: true,
    isConnected: false,
  },
  {
    id: "homeassistant",
    name: "Home Assistant",
    icon: Home,
    isPro: false,
    isConnected: false,
  },
  {
    id: "scripts",
    name: "Scripts & Macros",
    icon: Code2,
    isPro: false,
    isConnected: false,
  },
  {
    id: "automation",
    name: "Automações",
    icon: Clock,
    isPro: false,
    isConnected: false,
  },
];

export function IntegrationsView() {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/70 p-8 overflow-y-auto select-none">
      <div className="space-y-6 max-w-4xl">
        {/* Header: Título "Integrações" */}
        <header className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Integrações
          </h1>
        </header>

        {/* Grade 2 Colunas de Integrações */}
        <div className="grid grid-cols-2 gap-4">
          {INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.id}
                className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between h-44 shadow-sm backdrop-blur-sm hover:border-neutral-700/70 transition-all"
              >
                {/* Linha Superior: Ícone e Badge Pro opcional */}
                <div className="flex items-center justify-between">
                  <div className="w-11 h-11 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center text-neutral-300 shadow-inner">
                    <Icon className="w-5 h-5 text-neutral-200 stroke-[1.75]" />
                  </div>

                  {item.isPro && (
                    <Badge
                      variant="outline"
                      className="text-[10px] font-mono font-medium px-2 py-0.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 rounded-md"
                    >
                      Pro
                    </Badge>
                  )}
                </div>

                {/* Linha Central: Nome da Integração */}
                <div>
                  <h3 className="text-base font-semibold text-neutral-100 tracking-tight">
                    {item.name}
                  </h3>
                </div>

                {/* Linha Inferior: Botão Conectar/Configurar + Engrenagem */}
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    size="sm"
                    className={`h-9 px-4 rounded-xl text-xs font-medium transition-all ${
                      item.isConnected
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60"
                    }`}
                  >
                    {item.isConnected ? "Conectado" : "Configurar"}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
                  >
                    <Settings className="w-4 h-4 stroke-[1.75]" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default IntegrationsView;
