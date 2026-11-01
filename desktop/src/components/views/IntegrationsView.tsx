import { useState, useEffect } from "react";
import {
  Video,
  Lightbulb,
  Webhook,
  Home,
  Code2,
  Clock,
  Settings,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore, type ObsSettings } from "@/store/useDashboardStore";

interface IntegrationItem {
  id: string;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  isPro?: boolean;
  isConnected: boolean;
  details: string;
}

const OTHER_INTEGRATIONS: Omit<IntegrationItem, "isConnected">[] = [
  {
    id: "lights",
    name: "Luzes Inteligentes",
    icon: Lightbulb,
    isPro: false,
    details: "Ponte Philips Hue / Nanoleaf",
  },
  {
    id: "webhooks",
    name: "Webhooks",
    icon: Webhook,
    isPro: true,
    details: "Disparadores HTTP POST/GET personalizados",
  },
  {
    id: "homeassistant",
    name: "Home Assistant",
    icon: Home,
    isPro: false,
    details: "Entidades e automações IoT via Long-Lived Token",
  },
  {
    id: "scripts",
    name: "Scripts & Macros",
    icon: Code2,
    isPro: false,
    details: "Execução de scripts PowerShell, Python e Batch",
  },
  {
    id: "automation",
    name: "Automações",
    icon: Clock,
    isPro: false,
    details: "Gatilhos por horário ou eventos de janelas",
  },
];

export function IntegrationsView() {
  const { toast } = useToast();
  const obsSettings = useDashboardStore((s) => s.obsSettings);
  const setObsSettings = useDashboardStore((s) => s.setObsSettings);
  const testObsConnection = useDashboardStore((s) => s.testObsConnection);
  const fetchObsSettings = useDashboardStore((s) => s.fetchObsSettings);

  const [isObsSheetOpen, setIsObsSheetOpen] = useState(false);
  const [obsForm, setObsForm] = useState<ObsSettings>({
    host: "localhost",
    port: 4455,
    password: "",
    enabled: false,
  });
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Estados locais para as integrações secundárias (mock / Fase 4)
  const [otherStates, setOtherStates] = useState<Record<string, boolean>>({
    lights: false,
    webhooks: false,
    homeassistant: false,
    scripts: false,
    automation: false,
  });

  useEffect(() => {
    fetchObsSettings();
  }, [fetchObsSettings]);

  useEffect(() => {
    setObsForm(obsSettings);
  }, [obsSettings]);

  const handleOpenObsConfig = () => {
    setObsForm(obsSettings);
    setTestResult(null);
    setIsObsSheetOpen(true);
  };

  const handleToggleObsDirect = async () => {
    const nextEnabled = !obsSettings.enabled;
    await setObsSettings({ enabled: nextEnabled });
    toast({
      title: nextEnabled ? "OBS Studio Ativado" : "OBS Studio Desativado",
      description: nextEnabled
        ? `Conexão configurada em ws://${obsSettings.host}:${obsSettings.port}`
        : "A integração foi pausada com sucesso.",
    });
  };

  const handleTestObs = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const msg = await testObsConnection(obsForm);
      setTestResult({ success: true, message: msg });
      toast({
        title: "OBS Conectado com Sucesso!",
        description: msg,
      });
    } catch (err) {
      const errStr = String(err);
      setTestResult({ success: false, message: errStr });
      toast({
        variant: "destructive",
        title: "Falha na Conexão OBS",
        description: errStr,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSaveObs = async () => {
    await setObsSettings(obsForm);
    setIsObsSheetOpen(false);
    toast({
      title: "Configurações do OBS Salvas",
      description: obsForm.enabled
        ? `Integração ativa em ws://${obsForm.host}:${obsForm.port}`
        : "Configurações salvas (integração desativada).",
    });
  };

  const handleToggleOther = (id: string, name: string) => {
    setOtherStates((prev) => {
      const next = !prev[id];
      toast({
        title: `${name} ${next ? "Ativado" : "Desativado"}`,
        description: `Módulo ${name} operando no modo simulado da Fase 3.`,
      });
      return { ...prev, [id]: next };
    });
  };

  const handleConfigureOther = (name: string) => {
    toast({
      title: `Configurar ${name}`,
      description: `Painel de credenciais e opções para ${name} planejado para a Fase 4.`,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/70 p-8 overflow-y-auto select-none">
      <div className="space-y-6 max-w-4xl">
        {/* Header: Título "Integrações" */}
        <header className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Integrações
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Conecte aplicativos externos e automações para acionar comandos via Stream Desk.
          </p>
        </header>

        {/* Grade 2 Colunas de Integrações */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Principal Real: OBS Studio */}
          <Card className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between h-44 shadow-sm backdrop-blur-sm hover:border-neutral-700/70 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-11 h-11 rounded-2xl bg-neutral-800/60 border border-neutral-700/50 flex items-center justify-center text-neutral-300 shadow-inner">
                <Video className="w-5 h-5 text-neutral-200 stroke-[1.75]" />
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono font-medium px-2 py-0.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400 rounded-md"
                >
                  v5 WebSocket
                </Badge>
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono font-medium px-2 py-0.5 border-indigo-500/30 bg-indigo-500/10 text-indigo-400 rounded-md"
                >
                  Pro
                </Badge>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-neutral-100 tracking-tight">
                OBS Studio
              </h3>
              <p className="text-xs text-neutral-400 truncate mt-0.5">
                {obsSettings.enabled
                  ? `Ativo em ws://${obsSettings.host}:${obsSettings.port}`
                  : "Desativado (clique em Configurar)"}
              </p>
            </div>

            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                size="sm"
                type="button"
                onClick={handleToggleObsDirect}
                className={`h-9 px-4 rounded-xl text-xs font-medium transition-all ${
                  obsSettings.enabled
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm shadow-emerald-600/30"
                    : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60"
                }`}
              >
                {obsSettings.enabled ? "Conectado" : "Ativar"}
              </Button>

              <Button
                variant="outline"
                size="icon"
                type="button"
                onClick={handleOpenObsConfig}
                title="Configurações do OBS Studio"
                className="h-9 w-9 rounded-xl border-neutral-800 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <Settings className="w-4 h-4 stroke-[1.75]" />
              </Button>
            </div>
          </Card>

          {/* Cards Secundários */}
          {OTHER_INTEGRATIONS.map((item) => {
            const Icon = item.icon;
            const isConnected = otherStates[item.id] ?? false;
            return (
              <Card
                key={item.id}
                className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-5 flex flex-col justify-between h-44 shadow-sm backdrop-blur-sm hover:border-neutral-700/70 transition-all"
              >
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

                <div>
                  <h3 className="text-base font-semibold text-neutral-100 tracking-tight">
                    {item.name}
                  </h3>
                  <p className="text-xs text-neutral-400 truncate mt-0.5">
                    {item.details}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    size="sm"
                    type="button"
                    onClick={() => handleToggleOther(item.id, item.name)}
                    className={`h-9 px-4 rounded-xl text-xs font-medium transition-all ${
                      isConnected
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-600/30"
                        : "bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700/60"
                    }`}
                  >
                    {isConnected ? "Conectado" : "Configurar"}
                  </Button>

                  <Button
                    variant="outline"
                    size="icon"
                    type="button"
                    onClick={() => handleConfigureOther(item.name)}
                    title={`Configurações de ${item.name}`}
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

      {/* Drawer / Sheet de Configuração do OBS Studio */}
      <Sheet open={isObsSheetOpen} onOpenChange={setIsObsSheetOpen}>
        <SheetContent side="right" className="bg-neutral-950 border-neutral-800 text-white sm:max-w-md flex flex-col justify-between">
          <div>
            <SheetHeader className="pb-4 border-b border-neutral-800">
              <SheetTitle className="text-xl font-bold text-neutral-100 flex items-center gap-2">
                <Video className="w-5 h-5 text-emerald-400" />
                Configurar OBS Studio
              </SheetTitle>
              <SheetDescription className="text-xs text-neutral-400">
                Conecte-se ao OBS Studio via WebSocket v5 nativo para alternar cenas, mutar microfones e controlar gravações/transmissões.
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-4 py-5">
              {/* Host */}
              <div className="space-y-1.5">
                <Label htmlFor="obs-host" className="text-xs font-medium text-neutral-300">
                  Endereço do Host
                </Label>
                <Input
                  id="obs-host"
                  value={obsForm.host}
                  onChange={(e) => setObsForm({ ...obsForm, host: e.target.value })}
                  placeholder="localhost"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Porta */}
              <div className="space-y-1.5">
                <Label htmlFor="obs-port" className="text-xs font-medium text-neutral-300">
                  Porta do Servidor WebSocket
                </Label>
                <Input
                  id="obs-port"
                  type="number"
                  value={obsForm.port}
                  onChange={(e) =>
                    setObsForm({ ...obsForm, port: parseInt(e.target.value, 10) || 4455 })
                  }
                  placeholder="4455"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Senha */}
              <div className="space-y-1.5">
                <Label htmlFor="obs-password" className="text-xs font-medium text-neutral-300">
                  Senha do WebSocket (opcional)
                </Label>
                <Input
                  id="obs-password"
                  type="password"
                  value={obsForm.password || ""}
                  onChange={(e) => setObsForm({ ...obsForm, password: e.target.value })}
                  placeholder="Deixe vazio se não houver senha"
                  className="bg-neutral-900 border-neutral-800 text-xs text-neutral-100 focus-visible:ring-emerald-500"
                />
              </div>

              {/* Toggle Habilitado */}
              <div className="flex items-center justify-between p-3.5 bg-neutral-900/60 border border-neutral-800 rounded-xl">
                <div>
                  <p className="text-xs font-medium text-neutral-200">
                    Habilitar Integração OBS
                  </p>
                  <p className="text-[11px] text-neutral-400">
                    Permite executar ações OBS através dos botões da grade
                  </p>
                </div>
                <Switch
                  checked={obsForm.enabled}
                  onCheckedChange={(checked) => setObsForm({ ...obsForm, enabled: checked })}
                />
              </div>

              {/* Botão de Testar Conexão */}
              <div className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestObs}
                  disabled={isTesting}
                  className="w-full h-10 border-neutral-700 bg-neutral-900 hover:bg-neutral-800 text-xs font-medium text-neutral-200 flex items-center justify-center gap-2"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      Testando conexão...
                    </>
                  ) : (
                    "Testar Conexão com OBS"
                  )}
                </Button>
              </div>

              {/* Feedback de Teste */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                    testResult.success
                      ? "bg-emerald-950/40 border-emerald-800/80 text-emerald-300"
                      : "bg-rose-950/40 border-rose-800/80 text-rose-300"
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <div className="flex-1 break-words leading-relaxed font-mono text-[11px]">
                    {testResult.message}
                  </div>
                </div>
              )}
            </div>
          </div>

          <SheetFooter className="pt-4 border-t border-neutral-800 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsObsSheetOpen(false)}
              className="flex-1 border-neutral-800 text-xs text-neutral-300 hover:bg-neutral-900"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleSaveObs}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm"
            >
              Salvar Alterações
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default IntegrationsView;
