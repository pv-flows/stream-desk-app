import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CentralArea } from "@/components/layout/CentralArea";
import { MobilePreview } from "@/components/layout/MobilePreview";
import { Toaster } from "@/components/ui/toaster";
import { useDashboardStore } from "@/store/useDashboardStore";
import "./App.css";

export function App() {
  const init = useDashboardStore((s) => s.init);
  const [activeTab, setActiveTab] = useState("connection");

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="h-screen w-screen flex bg-neutral-950 text-white overflow-hidden">
      {/* 1. Barra Lateral de Navegação (240px fixa) */}
      <Sidebar activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* 2. Área Central Dinâmica (1440x900 fluid) */}
      <CentralArea activeTab={activeTab} />

      {/* 3. Painel de Pré-visualização Mobile (320px fixa) */}
      <MobilePreview />

      {/* Notificações Toaster Global */}
      <Toaster />
    </div>
  );
}

export default App;
