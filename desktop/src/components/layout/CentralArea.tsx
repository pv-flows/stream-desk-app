import { useState } from "react";
import {
  Sparkles,
  Plus,
  Search,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { DeckButton, useDashboardStore } from "@/store/useDashboardStore";
import { getLucideIcon, getButtonColorStyles, isBase64Icon, getBase64Src } from "@/lib/buttonUtils";
import { ButtonEditorSheet } from "@/components/ButtonEditorSheet";
import { ConnectionView } from "@/components/views/ConnectionView";

export interface CentralAreaProps {
  activeTab?: string;
  activePage?: string;
}

export function CentralArea({
  activeTab = "connection",
  activePage: controlledPage,
}: CentralAreaProps) {
  const [filterCategory, setFilterCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [buttonToEdit, setButtonToEdit] = useState<DeckButton | null>(null);

  const buttons = useDashboardStore((s) => s.buttons);
  const pages = useDashboardStore((s) => s.pages);
  const activePageIndex = useDashboardStore((s) => s.activePageIndex);

  // Se o usuário estiver na visualização "Conexão", renderiza diretamente a ConnectionView visual
  if (activeTab === "connection") {
    return <ConnectionView />;
  }

  const activePageObject = pages.find((p) => p.id === activePageIndex);
  const currentPageTitle = controlledPage ?? (activePageObject ? activePageObject.name : "Página Principal");

  // Filtra estritamente os botões da página ativa
  const pageButtons = buttons.filter((btn) => btn.page_index === activePageIndex);

  // Aplica busca por texto sobre os botões da página atual
  const filteredButtons = pageButtons.filter((btn) => {
    const matchesSearch =
      btn.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      btn.action_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterCategory === "apps") {
      return btn.action_name.startsWith("open_app") || btn.action_name.startsWith("app");
    }
    if (filterCategory === "media") {
      return btn.action_name.startsWith("vol") || btn.action_name.includes("play") || btn.action_name.includes("media");
    }
    if (filterCategory === "macros") {
      return btn.action_name.startsWith("macro") || btn.action_name.startsWith("key") || btn.action_name.startsWith("hotkey");
    }

    return true;
  });

  const handleOpenCreate = () => {
    setButtonToEdit(null);
    setEditorOpen(true);
  };

  const handleOpenEdit = (btn: DeckButton) => {
    setButtonToEdit(btn);
    setEditorOpen(true);
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-neutral-950/60 overflow-hidden select-none">
      {/* Top Header Dinâmico */}
      <header className="h-14 border-b border-neutral-800/80 px-6 flex items-center justify-between bg-neutral-900/40 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-neutral-100 tracking-tight">
            {currentPageTitle}
          </h2>
          <Badge
            variant="secondary"
            className="text-[11px] font-mono px-2 py-0.5 bg-neutral-800 text-neutral-400 font-normal border-neutral-700/60"
          >
            {pageButtons.length} slots configurados
          </Badge>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar atalho ou app..."
              className="w-52 h-8 pl-8 pr-3 text-xs bg-neutral-900/80 border-neutral-800 text-neutral-200 placeholder:text-neutral-500 focus-visible:ring-1 focus-visible:ring-sky-500/50"
            />
          </div>
          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-8 gap-1.5 px-3 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white shadow-sm shadow-indigo-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Botão</span>
          </Button>
        </div>
      </header>

      {/* Content View Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Quick Notice Banner */}
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-gradient-to-r from-indigo-950/30 to-purple-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-indigo-300">
                Grade Interativa de Botões
              </h3>
              <p className="text-[11px] text-neutral-400">
                Adicione atalhos, controle de volume ou inicialize aplicativos com um toque.
              </p>
            </div>
          </div>
          <Badge className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-mono text-[10px]">
            Ready
          </Badge>
        </div>

        {/* Abas e Filtros de Categoria */}
        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-3">
          <Tabs
            value={filterCategory}
            onValueChange={setFilterCategory}
            className="w-auto"
          >
            <TabsList className="bg-neutral-900/80 border border-neutral-800 h-8 p-0.5">
              <TabsTrigger
                value="all"
                className="text-xs px-3 py-1 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300"
              >
                Todos ({pageButtons.length})
              </TabsTrigger>
              <TabsTrigger
                value="apps"
                className="text-xs px-3 py-1 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300"
              >
                Aplicativos
              </TabsTrigger>
              <TabsTrigger
                value="media"
                className="text-xs px-3 py-1 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300"
              >
                Mídia & Som
              </TabsTrigger>
              <TabsTrigger
                value="macros"
                className="text-xs px-3 py-1 data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-300"
              >
                Macros
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <span className="text-[11px] text-neutral-400 font-mono">
            Página ID: #{activePageIndex}
          </span>
        </div>

        {/* Grade de Botões Reais */}
        <div>
          <div className="grid grid-cols-3 gap-3.5">
            {filteredButtons.map((btn) => {
              const Icon = getLucideIcon(btn.icon);
              const colorStyle = getButtonColorStyles(btn.color);
              const hasBase64 = isBase64Icon(btn.icon);

              return (
                <Card
                  key={btn.id}
                  style={colorStyle.style}
                  onClick={() => handleOpenEdit(btn)}
                  className={`group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between min-h-[110px] select-none ${colorStyle.className}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="h-9 w-9 rounded-lg bg-neutral-900/80 border border-neutral-700/60 flex items-center justify-center text-neutral-200 group-hover:scale-105 transition-transform">
                      {hasBase64 ? (
                        <img
                          src={getBase64Src(btn.icon)}
                          alt=""
                          className="w-5 h-5 object-contain rounded"
                        />
                      ) : (
                        <Icon className="w-4 h-4 text-sky-400" />
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-neutral-400">
                        #{btn.id}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(btn);
                        }}
                        title="Editar Botão"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-indigo-300 transition-opacity"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-neutral-100 tracking-tight">
                      {btn.label}
                    </h4>
                    <code className="text-[10px] text-neutral-400 font-mono truncate block mt-0.5">
                      {btn.action_name}
                    </code>
                  </div>
                </Card>
              );
            })}

            {/* Slot Vazio / Novo Botão */}
            <button
              type="button"
              onClick={handleOpenCreate}
              className="border-2 border-dashed border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900/30 rounded-xl flex flex-col items-center justify-center gap-1.5 p-4 text-neutral-400 hover:text-neutral-300 transition-colors min-h-[110px]"
            >
              <Plus className="w-5 h-5 text-neutral-500" />
              <span className="text-xs font-medium">Novo Botão</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sheet de Edição e Criação */}
      <ButtonEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        buttonToEdit={buttonToEdit}
      />
    </main>
  );
}

export default CentralArea;
