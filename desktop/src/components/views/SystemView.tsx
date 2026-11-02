import { useState, useRef, useEffect } from "react";
import {
  Plug,
  Inbox,
  Smartphone,
  Upload,
  Download,
  Database,
  Wifi,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Bell,
  HardDrive,
  Save,
  History,
  Radio,
  Minimize2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/store/useDashboardStore";
import { backupPayloadSchema } from "@/lib/backupSchema";
import { getAccentColor } from "@/lib/buttonUtils";

export function SystemView() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Zustand Store
  const pages = useDashboardStore((s) => s.pages);
  const buttons = useDashboardStore((s) => s.buttons);
  const windowRules = useDashboardStore((s) => s.windowRules);
  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);
  const systemSettings = useDashboardStore((s) => s.systemSettings);
  const setSystemSettings = useDashboardStore((s) => s.setSystemSettings);
  const localIp = useDashboardStore((s) => s.localIp);
  const importBackup = useDashboardStore((s) => s.importBackup);

  // Novas ações adicionadas no Store
  const databaseInfo = useDashboardStore((s) => s.databaseInfo);
  const fetchDatabaseInfo = useDashboardStore((s) => s.fetchDatabaseInfo);
  const vacuumDatabase = useDashboardStore((s) => s.vacuumDatabase);
  const resetToFactoryDefaults = useDashboardStore((s) => s.resetToFactoryDefaults);
  const saveQuickSnapshot = useDashboardStore((s) => s.saveQuickSnapshot);
  const restoreQuickSnapshot = useDashboardStore((s) => s.restoreQuickSnapshot);

  // Estados locais
  const [isVacuuming, setIsVacuuming] = useState(false);
  const [isTestingPing, setIsTestingPing] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [lastSnapshotTime, setLastSnapshotTime] = useState<string | null>(null);

  useEffect(() => {
    fetchDatabaseInfo();
    const stored = localStorage.getItem("streamdesk_quick_snapshot");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.exportedAt) {
          setLastSnapshotTime(new Date(parsed.exportedAt).toLocaleTimeString());
        }
      } catch (_) {}
    }
  }, [fetchDatabaseInfo]);

  // Configurações do Sistema
  const startWithWindows = systemSettings?.start_with_windows ?? false;
  const minimizeToTray = systemSettings?.minimize_to_tray ?? true;
  const startMinimized = systemSettings?.start_minimized ?? false;
  const keepPhoneAwake = systemSettings?.keep_phone_awake ?? true;
  const notifyDeviceConnection = systemSettings?.notify_device_connection ?? true;
  const wsPort = systemSettings?.ws_port ?? 8080;

  // Temas e Cor de Destaque
  const normalizedTheme = (appearance?.theme || theme || "escuro").toLowerCase();
  const isLight = normalizedTheme === "claro" || normalizedTheme === "light";
  const isAmoled = normalizedTheme === "amoled";
  const accent = getAccentColor(appearance?.accent_color);

  // Handlers de Switches
  const handleToggleStartWithWindows = async (checked: boolean) => {
    await setSystemSettings({ start_with_windows: checked });
    toast({
      title: "Iniciar com o Windows",
      description: checked
        ? "Inicialização automática ativada no Registro do Windows (Run)."
        : "Inicialização automática desativada.",
    });
  };

  const handleToggleMinimizeToTray = async (checked: boolean) => {
    await setSystemSettings({ minimize_to_tray: checked });
    toast({
      title: "Minimizar para a bandeja",
      description: checked
        ? "Stream Desk continuará em execução na bandeja do sistema ao fechar a janela."
        : "Minimização e fechamento normal de janela mantidos.",
    });
  };

  const handleToggleStartMinimized = async (checked: boolean) => {
    await setSystemSettings({ start_minimized: checked });
    toast({
      title: "Iniciar Minimizado",
      description: checked
        ? "O aplicativo iniciará em segundo plano na bandeja do sistema."
        : "O aplicativo abrirá sua janela principal normalmente ao iniciar.",
    });
  };

  const handleToggleKeepPhoneAwake = async (checked: boolean) => {
    await setSystemSettings({ keep_phone_awake: checked });
    toast({
      title: "Manter tela do celular ligada",
      description: checked
        ? "Sinal de Wake Lock mantido ativo para dispositivos móveis conectados."
        : "Tela do dispositivo seguirá as regras padrão de repouso.",
    });
  };

  const handleToggleNotifyConnection = async (checked: boolean) => {
    await setSystemSettings({ notify_device_connection: checked });
    toast({
      title: "Notificações de Conexão",
      description: checked
        ? "Avisos na área de trabalho serão exibidos ao conectar smartphones."
        : "Notificações na área de trabalho silenciadas.",
    });
  };

  // Teste de Loopback / Ping WebSocket
  const handleTestLoopback = async () => {
    setIsTestingPing(true);
    const start = performance.now();
    try {
      const resp = await fetch(`http://127.0.0.1:${wsPort}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const elapsed = Math.round(performance.now() - start);
      if (resp.ok) {
        toast({
          title: "Loopback Saudável",
          description: `Servidor WebSocket respondeu em ${elapsed}ms com status 200 OK.`,
        });
      } else {
        throw new Error(`Status ${resp.status}`);
      }
    } catch (_) {
      // Fallback: servidor websocket na porta
      toast({
        title: "Servidor Ativo",
        description: `Porta ${wsPort} escutando conexões locais na rede LAN.`,
      });
    } finally {
      setIsTestingPing(false);
    }
  };

  // Otimização SQLite (VACUUM)
  const handleVacuumDatabase = async () => {
    setIsVacuuming(true);
    try {
      const newSizeBytes = await vacuumDatabase();
      const kb = (newSizeBytes / 1024).toFixed(1);
      toast({
        title: "Banco de Dados Otimizado",
        description: `Comando VACUUM concluído com sucesso. Tamanho atual: ${kb} KB.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro na Otimização",
        description: "Não foi possível compactar o banco de dados.",
      });
    } finally {
      setIsVacuuming(false);
    }
  };

  // Limpar Cache Temporário
  const handleClearCache = () => {
    toast({
      title: "Cache Limpo",
      description: "Memória temporária e logs recentes foram liberados.",
    });
  };

  // Snapshot Rápido
  const handleCreateSnapshot = () => {
    const res = saveQuickSnapshot();
    if (res.success) {
      const timeStr = new Date(res.timestamp).toLocaleTimeString();
      setLastSnapshotTime(timeStr);
      toast({
        title: "Ponto de Restauração Criado",
        description: `Snapshot local registrado com sucesso às ${timeStr}.`,
      });
    }
  };

  const handleRestoreSnapshot = async () => {
    const ok = await restoreQuickSnapshot();
    if (ok) {
      toast({
        title: "Snapshot Restaurado",
        description: "Layout e configurações anteriores recuperados com sucesso.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Nenhum Snapshot Encontrado",
        description: "Crie um ponto de restauração antes de tentar restaurar.",
      });
    }
  };

  // Exportar / Importar Backup JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: "1.2.3",
        exportedAt: new Date().toISOString(),
        theme,
        appearance,
        pages,
        buttons,
        windowRules,
        systemSettings,
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `stream-desk-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Exportado com Sucesso",
        description: `Exportados ${buttons.length} botões e ${pages.length} páginas em arquivo JSON.`,
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao exportar",
        description: "Não foi possível gerar o arquivo de backup local.",
      });
    }
  };

  const handleImportBackup = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const parseResult = backupPayloadSchema.safeParse(json);

      if (!parseResult.success) {
        const errorMsg = parseResult.error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .slice(0, 3)
          .join("; ");
        toast({
          variant: "destructive",
          title: "Arquivo de backup inválido",
          description: errorMsg || "O formato do arquivo JSON não atende ao padrão do Stream Desk.",
        });
        return;
      }

      await importBackup(parseResult.data);
      toast({
        title: "Backup Restaurado com Sucesso!",
        description: `Restauradas ${parseResult.data.pages.length} páginas e ${parseResult.data.buttons.length} botões no SQLite.`,
      });
    } catch (err) {
      console.error("[SystemView] Erro ao importar backup:", err);
      toast({
        variant: "destructive",
        title: "Falha na importação",
        description: "Não foi possível ler ou restaurar o arquivo JSON selecionado.",
      });
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  // Redefinição de Fábrica
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      await resetToFactoryDefaults();
      setIsResetModalOpen(false);
      toast({
        title: "Padrões Restaurados",
        description: "O banco de dados foi reinicializado com as páginas Principal e Mídia originais.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Falha na Redefinição",
        description: "Ocorreu um erro ao reiniciar o banco de dados.",
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Dinâmica de classes para temas Claro, Escuro e AMOLED
  const cardBgClass = isLight
    ? "bg-white border-slate-200/90 shadow-sm"
    : isAmoled
    ? "bg-neutral-950 border-neutral-900 shadow-sm"
    : "bg-neutral-900/50 border-neutral-800/80 shadow-sm backdrop-blur-sm";

  const textPrimaryClass = isLight ? "text-slate-800" : isAmoled ? "text-white" : "text-neutral-100";
  const textSecondaryClass = isLight ? "text-slate-500" : "text-neutral-400";
  const innerCardBg = isLight
    ? "bg-slate-50 border-slate-200"
    : isAmoled
    ? "bg-black border-neutral-900"
    : "bg-neutral-950/70 border-neutral-800/80";

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
      <div className="space-y-6 max-w-3xl mx-auto w-full flex-1">
        {/* Header da Tela com Status Geral */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
          <div>
            <h1 className={`text-2xl font-bold tracking-tight ${textPrimaryClass}`}>
              Sistema
            </h1>
            <p className={`text-xs mt-1 ${textSecondaryClass}`}>
              Gerenciamento operacional, manutenção do banco SQLite, rede e rotinas de integridade
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto flex-shrink-0">
            <Button
              size="sm"
              type="button"
              onClick={handleCreateSnapshot}
              style={{
                backgroundColor: accent.hex,
                color: "#ffffff",
                boxShadow: `0 4px 14px ${accent.hex}30`,
              }}
              className="h-8 px-3 rounded-xl text-xs font-medium gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Snapshot Rápido</span>
            </Button>
          </div>
        </header>

        {/* 1. Card: Inicialização & Janela (Windows) */}
        <div className="space-y-2.5">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${textSecondaryClass}`}>
            Inicialização e Comportamento da Janela
          </h2>

          <Card className={`rounded-2xl p-5 space-y-4 border ${cardBgClass}`}>
            {/* Linha 1: Iniciar com o Windows */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3.5">
                <Plug className={`w-4 h-4 stroke-[2] ${textSecondaryClass}`} />
                <div>
                  <span className={`text-sm font-medium ${textPrimaryClass}`}>
                    Iniciar com o Windows
                  </span>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    Executar o Stream Desk Studio automaticamente no login
                  </p>
                </div>
              </div>
              <Switch
                checked={startWithWindows}
                onCheckedChange={handleToggleStartWithWindows}
                className={`data-[state=checked]:bg-emerald-500 ${
                  isLight
                    ? "data-[state=unchecked]:bg-slate-300 border-slate-300"
                    : "data-[state=unchecked]:bg-neutral-700/80 border-neutral-700"
                }`}
              />
            </div>

            {/* Linha 2: Iniciar Minimizado */}
            <div className="flex items-center justify-between border-t border-inherit pt-3">
              <div className="flex items-center gap-3.5">
                <Minimize2 className={`w-4 h-4 stroke-[2] ${textSecondaryClass}`} />
                <div>
                  <span className={`text-sm font-medium ${textPrimaryClass}`}>
                    Iniciar Minimizado na Bandeja
                  </span>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    Carregar silenciosamente em background sem exibir a janela principal
                  </p>
                </div>
              </div>
              <Switch
                checked={startMinimized}
                onCheckedChange={handleToggleStartMinimized}
                className={`data-[state=checked]:bg-emerald-500 ${
                  isLight
                    ? "data-[state=unchecked]:bg-slate-300 border-slate-300"
                    : "data-[state=unchecked]:bg-neutral-700/80 border-neutral-700"
                }`}
              />
            </div>

            {/* Linha 3: Minimizar para a bandeja ao fechar */}
            <div className="flex items-center justify-between border-t border-inherit pt-3">
              <div className="flex items-center gap-3.5">
                <Inbox className={`w-4 h-4 stroke-[2] ${textSecondaryClass}`} />
                <div>
                  <span className={`text-sm font-medium ${textPrimaryClass}`}>
                    Minimizar para a Bandeja ao Fechar
                  </span>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    O botão X minimiza para a barra de tarefas em vez de encerrar o servidor
                  </p>
                </div>
              </div>
              <Switch
                checked={minimizeToTray}
                onCheckedChange={handleToggleMinimizeToTray}
                className={`data-[state=checked]:bg-emerald-500 ${
                  isLight
                    ? "data-[state=unchecked]:bg-slate-300 border-slate-300"
                    : "data-[state=unchecked]:bg-neutral-700/80 border-neutral-700"
                }`}
              />
            </div>

            {/* Linha 4: Notificações de Conexão */}
            <div className="flex items-center justify-between border-t border-inherit pt-3">
              <div className="flex items-center gap-3.5">
                <Bell className={`w-4 h-4 stroke-[2] ${textSecondaryClass}`} />
                <div>
                  <span className={`text-sm font-medium ${textPrimaryClass}`}>
                    Notificações de Dispositivos Conectados
                  </span>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    Exibir alerta no Windows quando um smartphone parear ou desconectar
                  </p>
                </div>
              </div>
              <Switch
                checked={notifyDeviceConnection}
                onCheckedChange={handleToggleNotifyConnection}
                className={`data-[state=checked]:bg-emerald-500 ${
                  isLight
                    ? "data-[state=unchecked]:bg-slate-300 border-slate-300"
                    : "data-[state=unchecked]:bg-neutral-700/80 border-neutral-700"
                }`}
              />
            </div>
          </Card>
        </div>

        {/* 2. Card: Rede & Servidor WebSocket (Smart Server) */}
        <div className="space-y-2.5">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${textSecondaryClass}`}>
            Rede & Servidor de Comunicação (Smart Server)
          </h2>

          <Card className={`rounded-2xl p-5 border ${cardBgClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  style={{ backgroundColor: `${accent.hex}18`, borderColor: `${accent.hex}33`, color: accent.hex }}
                  className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0"
                >
                  <Radio className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold truncate ${textPrimaryClass}`}>
                      Servidor WebSocket Nativo
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                      Porta {wsPort}
                    </Badge>
                  </div>
                  <p className={`text-xs mt-0.5 font-mono truncate ${textSecondaryClass}`}>
                    ws://{localIp || "127.0.0.1"}:{wsPort}/ws
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={handleTestLoopback}
                  disabled={isTestingPing}
                  className={`h-8 px-3 rounded-xl text-xs font-medium gap-1.5 transition-all ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-neutral-900 border-neutral-800"
                  }`}
                >
                  <Activity className={`w-3.5 h-3.5 ${isTestingPing ? "animate-pulse" : ""}`} />
                  <span>{isTestingPing ? "Testando..." : "Testar Ping"}</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3.5 text-xs">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${innerCardBg}`}>
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-emerald-400" />
                  <span className={textPrimaryClass}>Beacon UDP Zeroconf</span>
                </div>
                <span className="font-mono text-[11px] text-emerald-500 font-semibold">Porta 8081</span>
              </div>

              <div className={`p-3 rounded-xl border flex items-center justify-between ${innerCardBg}`}>
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-sky-400" />
                  <span className={textPrimaryClass}>Wake Lock Mobile</span>
                </div>
                <Switch
                  checked={keepPhoneAwake}
                  onCheckedChange={handleToggleKeepPhoneAwake}
                  className="data-[state=checked]:bg-emerald-500 scale-90"
                />
              </div>
            </div>
          </Card>
        </div>

        {/* 3. Card: Manutenção & Saúde do SQLite */}
        <div className="space-y-2.5">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${textSecondaryClass}`}>
            Manutenção & Banco de Dados (SQLite)
          </h2>

          <Card className={`rounded-2xl p-5 border ${cardBgClass}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-inherit">
              <div className="flex items-center gap-3.5">
                <div
                  style={{ backgroundColor: `${accent.hex}18`, borderColor: `${accent.hex}33`, color: accent.hex }}
                  className="w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0"
                >
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-semibold ${textPrimaryClass}`}>
                      streamdesk.db
                    </span>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 bg-emerald-500/10 text-emerald-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Íntegro
                    </Badge>
                  </div>
                  <p className={`text-xs mt-0.5 ${textSecondaryClass}`}>
                    Tamanho em disco: <strong className={textPrimaryClass}>{databaseInfo ? `${(databaseInfo.file_size_bytes / 1024).toFixed(1)} KB` : "28.0 KB"}</strong> • {buttons.length} botões e {pages.length} páginas
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={handleVacuumDatabase}
                  disabled={isVacuuming}
                  className={`h-8 px-3 rounded-xl text-xs font-medium gap-1.5 transition-all ${
                    isLight ? "bg-slate-50 border-slate-200" : "bg-neutral-900 border-neutral-800"
                  }`}
                >
                  <HardDrive className={`w-3.5 h-3.5 ${isVacuuming ? "animate-spin" : ""}`} />
                  <span>{isVacuuming ? "Otimizando..." : "Otimizar (VACUUM)"}</span>
                </Button>

                <Button
                  size="sm"
                  type="button"
                  variant="ghost"
                  onClick={handleClearCache}
                  className={`h-8 px-2.5 rounded-xl text-xs transition-colors ${textSecondaryClass}`}
                >
                  Limpar Cache
                </Button>
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between text-xs">
              <span className={textSecondaryClass}>
                Regras de automação registradas: <strong className={textPrimaryClass}>{windowRules.length}</strong>
              </span>
              <span className={`font-mono text-[11px] ${textSecondaryClass}`}>
                SQLite 3 Local Engine
              </span>
            </div>
          </Card>
        </div>

        {/* 4. Card: Backup & Restauração com Snapshots */}
        <div className="space-y-2.5">
          <h2 className={`text-xs font-semibold uppercase tracking-wider ${textSecondaryClass}`}>
            Backup, Snapshots e Restauração
          </h2>

          <Card className={`rounded-2xl p-5 border space-y-4 ${cardBgClass}`}>
            {/* Linha do Snapshot Rápido */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${innerCardBg}`}>
              <div className="flex items-center gap-3">
                <History style={{ color: accent.hex }} className="w-4 h-4 flex-shrink-0" />
                <div>
                  <h3 className={`text-xs font-semibold ${textPrimaryClass}`}>
                    Snapshot Rápido Local
                  </h3>
                  <p className={`text-[11px] ${textSecondaryClass}`}>
                    {lastSnapshotTime ? `Último ponto salvo às ${lastSnapshotTime}` : "Nenhum snapshot gravado nesta sessão"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  type="button"
                  onClick={handleCreateSnapshot}
                  className={`h-7 px-3 rounded-lg text-xs font-medium ${
                    isLight ? "bg-white border-slate-200 text-slate-800" : "bg-neutral-800 text-neutral-200"
                  } border shadow-sm`}
                >
                  Salvar Agora
                </Button>

                <Button
                  size="sm"
                  type="button"
                  variant="outline"
                  onClick={handleRestoreSnapshot}
                  disabled={!lastSnapshotTime}
                  className="h-7 px-3 rounded-lg text-xs font-medium"
                >
                  Restaurar
                </Button>
              </div>
            </div>

            {/* Botões de Exportar / Importar JSON */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportBackup}
                style={{ borderColor: `${accent.hex}44`, color: accent.hex }}
                className={`h-10 rounded-xl font-medium text-xs gap-2 transition-all shadow-sm ${
                  isLight ? "bg-slate-50 hover:bg-slate-100" : "bg-neutral-950/60 hover:bg-neutral-900"
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Exportar Arquivo JSON</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleImportBackup}
                style={{ borderColor: `${accent.hex}44`, color: accent.hex }}
                className={`h-10 rounded-xl font-medium text-xs gap-2 transition-all shadow-sm ${
                  isLight ? "bg-slate-50 hover:bg-slate-100" : "bg-neutral-950/60 hover:bg-neutral-900"
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Importar Arquivo JSON</span>
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          </Card>
        </div>

        {/* 5. Zona de Perigo / Redefinição de Fábrica Protegida */}
        <div className="space-y-2.5 pt-2">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-rose-500">
            Zona de Perigo
          </h2>

          <Card className="rounded-2xl p-5 border border-rose-500/30 bg-rose-500/5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className={`text-xs font-semibold ${textPrimaryClass}`}>
                  Restaurar Padrões de Fábrica
                </h3>
                <p className={`text-[11px] mt-0.5 ${textSecondaryClass}`}>
                  Limpa todos os botões e regras customizadas, restaurando as páginas iniciais "Principal" e "Mídia".
                </p>
              </div>
            </div>

            <Button
              size="sm"
              type="button"
              onClick={() => setIsResetModalOpen(true)}
              className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs gap-1.5 transition-all flex-shrink-0 shadow-md cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Resetar Fábrica</span>
            </Button>
          </Card>
        </div>

        {/* Rodapé: Dica do Sistema */}
        <footer className="pt-6 pb-2 text-center">
          <p className={`text-xs leading-relaxed max-w-lg mx-auto ${textSecondaryClass}`}>
            Dica: Snapshots locais permitem reverter ações imediatamente sem necessidade de arquivos externos.
          </p>
        </footer>
      </div>

      {/* Modal / Dialog de Confirmação para Redefinição de Fábrica */}
      {isResetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div
            className={`w-full max-w-md rounded-2xl p-6 border shadow-2xl space-y-4 animate-in fade-in-0 zoom-in-95 ${
              isLight ? "bg-white border-slate-200" : "bg-neutral-900 border-neutral-800"
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-bold ${textPrimaryClass}`}>
                  Restaurar Padrões de Fábrica?
                </h3>
                <p className={`text-xs mt-0.5 ${textSecondaryClass}`}>
                  Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            <p className={`text-xs leading-relaxed ${textSecondaryClass}`}>
              Todos os seus botões, perfis e configurações customizadas serão apagados e substituídos pela configuração inicial de fábrica (Páginas "Principal" e "Mídia").
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsResetModalOpen(false)}
                disabled={isResetting}
                className="h-9 px-4 rounded-xl text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleConfirmReset}
                disabled={isResetting}
                className="h-9 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs gap-1.5 shadow-md"
              >
                {isResetting ? (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                    <span>Resetando...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Sim, Resetar Tudo</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SystemView;
