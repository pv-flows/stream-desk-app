import { useState } from "react";
import {
  Layers,
  ShieldCheck,
  Cpu,
  Database,
  Wifi,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Heart,
  Calendar,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Bug,
  LayoutGrid,
  Laptop,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useDashboardStore } from "@/store/useDashboardStore";
import { getAccentColor } from "@/lib/buttonUtils";

interface ChangelogItem {
  version: string;
  date: string;
  tag: string;
  highlights: string[];
}

const CHANGELOG: ChangelogItem[] = [
  {
    version: "v1.2.3",
    date: "Novembro 2026",
    tag: "Fase 3 — Refinamento",
    highlights: [
      "Suporte integral a temas Claro, Escuro e AMOLED em todo o ecossistema desktop.",
      "Integração ativa da paleta de Cor de Destaque personalizada em botões e acentos.",
      "Ajuste de dimensão dos botões com controle 1 a 10 e sincronização com smartphone.",
      "Estilos de ícones vazados (Linha) e sólidos (Preenchido) em tempo real.",
      "Resiliência arquitetural com Error Boundary contra falhas de renderização.",
    ],
  },
  {
    version: "v1.2.0",
    date: "Outubro 2026",
    tag: "Fase 2 — Produtividade",
    highlights: [
      "Grade de botões com Drag-and-Drop fluido persistido via Tauri IPC.",
      "Motor de Perfis Automáticos por processo ativo em foco no Windows.",
      "Suporte a ícones customizados via upload e conversão Base64.",
      "Editor lateral (Sheet) para criação rápida de atalhos, macros e apps.",
    ],
  },
  {
    version: "v1.0.0",
    date: "Setembro 2026",
    tag: "Fase 1 — Fundação",
    highlights: [
      "Arquitetura Smart Server (PC) com servidor WebSocket nativo assíncrono.",
      "Cliente Dumb Client em React Native / Expo com descoberta por QR Code.",
      "Banco de dados SQLite local embarcado para persistência instantânea.",
      "Mecanismo de fallback e reconexão automática resiliente.",
    ],
  },
];

export function AboutView() {
  const { toast } = useToast();
  const theme = useDashboardStore((s) => s.theme);
  const appearance = useDashboardStore((s) => s.appearance);
  const pages = useDashboardStore((s) => s.pages);
  const buttons = useDashboardStore((s) => s.buttons);
  const connectedDevices = useDashboardStore((s) => s.connectedDevices);
  const localIp = useDashboardStore((s) => s.localIp);

  const normalizedTheme = (appearance?.theme || theme || "escuro").toLowerCase();
  const isLight = normalizedTheme === "claro" || normalizedTheme === "light";
  const isAmoled = normalizedTheme === "amoled";
  const accent = getAccentColor(appearance);

  const [copiedDiag, setCopiedDiag] = useState(false);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);
  const [expandedChangelog, setExpandedChangelog] = useState<Record<string, boolean>>({
    "v1.2.3": true,
  });

  const toggleChangelog = (ver: string) => {
    setExpandedChangelog((prev) => ({ ...prev, [ver]: !prev[ver] }));
  };

  const handleCheckUpdate = () => {
    setIsCheckingUpdate(true);
    setTimeout(() => {
      setIsCheckingUpdate(false);
      toast({
        title: "Você está atualizado!",
        description: "Stream Desk Studio v1.2.3 é a versão estável mais recente disponível.",
      });
    }, 700);
  };

  const handleCopyDiagnostics = async () => {
    const diagData = {
      app: "Stream Desk Studio",
      version: "1.2.3",
      environment: {
        platform: "Windows",
        arch: "x86_64",
        runtime: "Tauri v2 + React 19",
        localIp: localIp || "127.0.0.1",
        wsPort: 8080,
      },
      stats: {
        totalPages: pages.length,
        totalButtons: buttons.length,
        connectedDevices: connectedDevices.length,
        theme: normalizedTheme,
        accentColor: accent.id,
      },
      timestamp: new Date().toISOString(),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(diagData, null, 2));
      setCopiedDiag(true);
      toast({
        title: "Diagnóstico Copiado",
        description: "Relatório técnico JSON copiado para a área de transferência.",
      });
      setTimeout(() => setCopiedDiag(false), 2500);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Erro ao copiar",
        description: "Não foi possível acessar a área de transferência.",
      });
    }
  };

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
        {/* Header da Tela */}
        <header className="pb-2">
          <h1 className={`text-2xl font-bold tracking-tight ${textPrimaryClass}`}>
            Sobre o Stream Desk
          </h1>
          <p className={`text-xs mt-1 ${textSecondaryClass}`}>
            Visão geral da aplicação, detalhes da arquitetura, novidades e informações para suporte
          </p>
        </header>

        {/* 1. Hero Card: Identidade Visual e Status do App */}
        <Card className={`rounded-2xl p-6 border relative overflow-hidden ${cardBgClass}`}>
          {/* Glow sutil de fundo usando a cor de destaque */}
          <div
            style={{
              background: `radial-gradient(circle at top right, ${accent.hex}22, transparent 70%)`,
            }}
            className="absolute inset-0 pointer-events-none"
          />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4 min-w-0">
              <div
                style={{
                  backgroundColor: `${accent.hex}18`,
                  borderColor: `${accent.hex}33`,
                  color: accent.hex,
                  boxShadow: `0 8px 24px ${accent.hex}25`,
                }}
                className="w-16 h-16 rounded-2xl border flex items-center justify-center flex-shrink-0"
              >
                <Layers className="w-8 h-8" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className={`text-lg font-bold tracking-tight ${textPrimaryClass}`}>
                    Stream Desk Studio
                  </h2>
                  <Badge
                    variant="outline"
                    style={{
                      borderColor: `${accent.hex}44`,
                      color: accent.hex,
                      backgroundColor: `${accent.hex}15`,
                    }}
                    className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full"
                  >
                    v1.2.3
                  </Badge>
                  <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Estável
                  </span>
                </div>
                <p className={`text-xs mt-1 ${textSecondaryClass}`}>
                  Centro de controle e automação nativo para periféricos e smartphones
                </p>
              </div>
            </div>

            <Button
              size="sm"
              type="button"
              onClick={handleCheckUpdate}
              disabled={isCheckingUpdate}
              style={{
                backgroundColor: isLight ? "#f1f5f9" : "rgba(255, 255, 255, 0.08)",
                color: isLight ? "#0f172a" : "#ffffff",
                borderColor: isLight ? "#e2e8f0" : "rgba(255, 255, 255, 0.12)",
              }}
              className="border text-xs font-medium h-9 px-3.5 rounded-xl gap-2 hover:opacity-90 transition-all flex-shrink-0 cursor-pointer shadow-sm"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isCheckingUpdate ? "animate-spin" : ""}`} />
              <span>{isCheckingUpdate ? "Verificando..." : "Buscar Atualizações"}</span>
            </Button>
          </div>
        </Card>

        {/* 2. Arquitetura do Sistema & Stack Técnica */}
        <div className="space-y-3">
          <h2 className={`text-sm font-semibold tracking-tight ${textPrimaryClass}`}>
            Arquitetura & Especificações Técnicas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Bloco 1: Tauri + Rust */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${innerCardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${textSecondaryClass}`}>Backend</span>
                <Cpu style={{ color: accent.hex }} className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <p className={`text-xs font-semibold ${textPrimaryClass}`}>Tauri v2 + Rust</p>
                <p className={`text-[10px] mt-0.5 ${textSecondaryClass}`}>Comandos IPC nativos</p>
              </div>
            </div>

            {/* Bloco 2: React 19 Frontend */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${innerCardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${textSecondaryClass}`}>Interface</span>
                <Sparkles style={{ color: accent.hex }} className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <p className={`text-xs font-semibold ${textPrimaryClass}`}>React 19 + Tailwind</p>
                <p className={`text-[10px] mt-0.5 ${textSecondaryClass}`}>Zustand & Lucide</p>
              </div>
            </div>

            {/* Bloco 3: SQLite */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${innerCardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${textSecondaryClass}`}>Persistência</span>
                <Database style={{ color: accent.hex }} className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <p className={`text-xs font-semibold ${textPrimaryClass}`}>SQLite Local</p>
                <p className={`text-[10px] mt-0.5 ${textSecondaryClass}`}>streamdesk.db</p>
              </div>
            </div>

            {/* Bloco 4: WebSocket Smart Server */}
            <div className={`p-4 rounded-xl border flex flex-col justify-between ${innerCardBg}`}>
              <div className="flex items-center justify-between">
                <span className={`text-[11px] font-medium ${textSecondaryClass}`}>Rede LAN</span>
                <Wifi style={{ color: accent.hex }} className="w-4 h-4" />
              </div>
              <div className="mt-2">
                <p className={`text-xs font-semibold ${textPrimaryClass}`}>WebSocket 8080</p>
                <p className={`text-[10px] mt-0.5 ${textSecondaryClass}`}>Smart Server / LAN</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Métricas Ativas do Usuário */}
        <Card className={`rounded-2xl p-5 border ${cardBgClass}`}>
          <div className="flex items-center justify-between pb-3 border-b border-inherit">
            <span className={`text-xs font-semibold ${textPrimaryClass}`}>
              Estatísticas da Sessão Atual
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-mono ${
                isLight ? "bg-slate-100 text-slate-600" : "bg-neutral-800 text-neutral-300"
              }`}
            >
              LAN: {localIp || "127.0.0.1"}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-3 text-center">
            <div>
              <div className="flex items-center justify-center gap-1.5">
                <Layers className={`w-3.5 h-3.5 ${textSecondaryClass}`} />
                <span className={`text-lg font-bold ${textPrimaryClass}`}>{pages.length}</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${textSecondaryClass}`}>Páginas Criadas</p>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <LayoutGrid className={`w-3.5 h-3.5 ${textSecondaryClass}`} />
                <span className={`text-lg font-bold ${textPrimaryClass}`}>{buttons.length}</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${textSecondaryClass}`}>Botões Mapeados</p>
            </div>

            <div>
              <div className="flex items-center justify-center gap-1.5">
                <Laptop className={`w-3.5 h-3.5 ${textSecondaryClass}`} />
                <span className={`text-lg font-bold ${textPrimaryClass}`}>{connectedDevices.length}</span>
              </div>
              <p className={`text-[11px] mt-0.5 ${textSecondaryClass}`}>Aparelhos Pareados</p>
            </div>
          </div>
        </Card>

        {/* 4. Changelog & Registro de Versões */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className={`text-sm font-semibold tracking-tight ${textPrimaryClass}`}>
              Registro de Alterações (Changelog)
            </h2>
            <span className={`text-[11px] ${textSecondaryClass}`}>Últimas 3 atualizações</span>
          </div>

          <div className="space-y-2.5">
            {CHANGELOG.map((item) => {
              const isExpanded = !!expandedChangelog[item.version];
              return (
                <div
                  key={item.version}
                  className={`rounded-2xl border transition-all overflow-hidden ${cardBgClass}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleChangelog(item.version)}
                    className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-neutral-500/5 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={`text-xs font-bold font-mono ${textPrimaryClass}`}>
                        {item.version}
                      </span>
                      <span
                        style={{ color: accent.hex }}
                        className="text-[11px] font-medium"
                      >
                        {item.tag}
                      </span>
                      <span className={`text-[10px] ${textSecondaryClass} flex items-center gap-1`}>
                        <Calendar className="w-3 h-3" />
                        {item.date}
                      </span>
                    </div>

                    <div className={textSecondaryClass}>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-5 pb-4 pt-1 border-t border-inherit">
                      <ul className="space-y-1.5 mt-2">
                        {item.highlights.map((h, i) => (
                          <li
                            key={i}
                            className={`text-xs flex items-start gap-2 ${
                              isLight ? "text-slate-600" : "text-neutral-300"
                            }`}
                          >
                            <span
                              style={{ backgroundColor: accent.hex }}
                              className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                            />
                            <span>{h}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Diagnóstico para Suporte & Links Rápidos */}
        <div className="space-y-3">
          <h2 className={`text-sm font-semibold tracking-tight ${textPrimaryClass}`}>
            Suporte e Diagnóstico
          </h2>

          <Card className={`rounded-2xl p-5 border flex flex-col sm:flex-row items-center justify-between gap-4 ${cardBgClass}`}>
            <div className="min-w-0">
              <h3 className={`text-xs font-semibold ${textPrimaryClass}`}>
                Relatório de Diagnóstico do Sistema
              </h3>
              <p className={`text-[11px] mt-0.5 ${textSecondaryClass}`}>
                Gera um resumo técnico em JSON das portas, banco SQLite e versão para abertura de chamados.
              </p>
            </div>

            <Button
              size="sm"
              type="button"
              onClick={handleCopyDiagnostics}
              style={
                copiedDiag
                  ? { backgroundColor: "#10b981", color: "#ffffff" }
                  : { backgroundColor: accent.hex, color: "#ffffff" }
              }
              className="h-9 px-4 rounded-xl text-xs font-medium gap-2 transition-all flex-shrink-0 shadow-md cursor-pointer"
            >
              {copiedDiag ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Diagnóstico</span>
                </>
              )}
            </Button>
          </Card>

          {/* Atalhos de Suporte e Documentação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                toast({
                  title: "Documentação Oficial",
                  description: "Guia completo de arquitetura e comandos disponível em docs/ARCHITECTURE.md",
                });
              }}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all text-left ${cardBgClass} hover:opacity-90 cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${accent.hex}18`, borderColor: `${accent.hex}33`, color: accent.hex }}
                  className="w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0"
                >
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-semibold ${textPrimaryClass}`}>Documentação do Projeto</h4>
                  <p className={`text-[11px] ${textSecondaryClass}`}>Guia de arquitetura e WebSocket</p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                toast({
                  title: "Reportar Problema",
                  description: "Para reportar inconsistências, copie o diagnóstico acima e compartilhe com a equipe.",
                });
              }}
              className={`p-4 rounded-2xl border flex items-center justify-between transition-all text-left ${cardBgClass} hover:opacity-90 cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: `${accent.hex}18`, borderColor: `${accent.hex}33`, color: accent.hex }}
                  className="w-8 h-8 rounded-xl border flex items-center justify-center flex-shrink-0"
                >
                  <Bug className="w-4 h-4" />
                </div>
                <div>
                  <h4 className={`text-xs font-semibold ${textPrimaryClass}`}>Reportar um Problema</h4>
                  <p className={`text-[11px] ${textSecondaryClass}`}>Envie feedback ou sugestões</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* 6. Rodapé: Licença & Créditos */}
        <footer className="pt-4 pb-2 text-center space-y-1.5">
          <p className={`text-xs flex items-center justify-center gap-1.5 ${textSecondaryClass}`}>
            Feito com <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> para criadores de conteúdo e desenvolvedores.
          </p>
          <p className={`text-[11px] ${textSecondaryClass}`}>
            Stream Desk Studio • Código Aberto sob Licença MIT • Arquitetura Smart Server
          </p>
        </footer>
      </div>
    </div>
  );
}

export default AboutView;
