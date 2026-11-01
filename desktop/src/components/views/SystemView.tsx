import { useState, useRef } from "react";
import {
  Plug,
  Inbox,
  Smartphone,
  Upload,
  Download,
  Bookmark,
  Star,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/store/useDashboardStore";
import { backupPayloadSchema } from "@/lib/backupSchema";

export function SystemView() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pages = useDashboardStore((s) => s.pages);
  const buttons = useDashboardStore((s) => s.buttons);
  const windowRules = useDashboardStore((s) => s.windowRules);
  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);
  const importBackup = useDashboardStore((s) => s.importBackup);

  const [startWithWindows, setStartWithWindows] = useState(true);
  const [minimizeToTray, setMinimizeToTray] = useState(false);
  const [keepPhoneAwake, setKeepPhoneAwake] = useState(true);

  const handleToggleStartWithWindows = (checked: boolean) => {
    setStartWithWindows(checked);
    toast({
      title: "Iniciar com o Windows",
      description: checked
        ? "Inicialização automática ativada (integração do Registro do Windows em breve)."
        : "Inicialização automática desativada.",
    });
  };

  const handleToggleMinimizeToTray = (checked: boolean) => {
    setMinimizeToTray(checked);
    toast({
      title: "Minimizar para a bandeja",
      description: checked
        ? "Minimização para bandeja do sistema ativada (integração de Tray em breve)."
        : "Minimização normal de janela mantida.",
    });
  };

  const handleToggleKeepPhoneAwake = (checked: boolean) => {
    setKeepPhoneAwake(checked);
    toast({
      title: "Manter tela do celular ligada",
      description: checked
        ? "Sinal de Wake Lock mantido ativo para dispositivos móveis conectados."
        : "Tela do dispositivo seguirá as regras padrão de repouso.",
    });
  };

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

      const validData = parseResult.data;
      await importBackup(validData);

      toast({
        title: "Backup Restaurado com Sucesso!",
        description: `Restauradas ${validData.pages.length} páginas e ${validData.buttons.length} botões no SQLite e sincronizado via WebSocket.`,
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

  const handleUpgrade = () => {
    toast({
      title: "Stream Desk Pro",
      description: "Em breve: suporte a múltiplos decks físicos e sincronização em nuvem.",
    });
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-neutral-950/70 p-8 overflow-y-auto select-none">
      <div className="space-y-6 max-w-4xl">
        {/* Header: Título "Sistema" */}
        <header className="pb-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
            Sistema
          </h1>
        </header>

        {/* 1. Agrupamento Superior (Geral) em Card Escuro */}
        <Card className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-6 space-y-6 shadow-sm backdrop-blur-sm">
          {/* Linha 1: Iniciar com o Windows */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Plug className="w-4 h-4 text-neutral-400 stroke-[2]" />
              <span className="text-sm font-medium text-neutral-200">
                Iniciar com o Windows
              </span>
            </div>
            <Switch
              checked={startWithWindows}
              onCheckedChange={handleToggleStartWithWindows}
              className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-neutral-700/80 border-neutral-700"
            />
          </div>

          {/* Linha 2: Minimizar para a bandeja */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Inbox className="w-4 h-4 text-neutral-400 stroke-[2]" />
              <span className="text-sm font-medium text-neutral-200">
                Minimizar para a bandeja
              </span>
            </div>
            <Switch
              checked={minimizeToTray}
              onCheckedChange={handleToggleMinimizeToTray}
              className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-neutral-700/80 border-neutral-700"
            />
          </div>

          {/* Linha 3: Manter tela do celular ligada */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <Smartphone className="w-4 h-4 text-neutral-400 stroke-[2]" />
              <span className="text-sm font-medium text-neutral-200">
                Manter tela do celular ligada
              </span>
            </div>
            <Switch
              checked={keepPhoneAwake}
              onCheckedChange={handleToggleKeepPhoneAwake}
              className="data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-neutral-700/80 border-neutral-700"
            />
          </div>
        </Card>

        {/* 2. Agrupamento "Backup" */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-neutral-200 tracking-tight">
            Backup
          </h2>

          <Card className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm">
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleExportBackup}
                className="h-11 rounded-xl border border-indigo-500/30 bg-neutral-950/60 hover:bg-indigo-950/20 text-indigo-300 hover:text-indigo-200 font-medium text-xs gap-2 transition-all shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-400" />
                <span>Exportar</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={handleImportBackup}
                className="h-11 rounded-xl border border-indigo-500/30 bg-neutral-950/60 hover:bg-indigo-950/20 text-indigo-300 hover:text-indigo-200 font-medium text-xs gap-2 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-indigo-400" />
                <span>Importar</span>
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

        {/* 3. Agrupamento "Sobre" */}
        <div className="space-y-3 pt-2">
          <h2 className="text-sm font-semibold text-neutral-200 tracking-tight">
            Sobre
          </h2>

          <Card className="bg-neutral-900/50 border-neutral-800/80 rounded-2xl p-5 flex items-center justify-between shadow-sm backdrop-blur-sm">
            <div className="space-y-0.5">
              <p className="text-xs text-neutral-400 font-medium">
                Versão do App
              </p>
              <p className="text-sm font-mono font-medium text-neutral-200">
                v1.2.3
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="h-8 px-3 rounded-lg border-neutral-700/80 bg-neutral-800/60 text-neutral-300 text-xs font-medium gap-1.5"
              >
                <Bookmark className="w-3 h-3 text-neutral-400" />
                <span>Free</span>
              </Badge>

              <Button
                size="sm"
                onClick={handleUpgrade}
                className="h-8 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 gap-1.5 transition-all"
              >
                <Star className="w-3.5 h-3.5 fill-white text-white" />
                <span>Fazer upgrade</span>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default SystemView;
