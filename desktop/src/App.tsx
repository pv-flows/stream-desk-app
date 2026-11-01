import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CentralArea } from "@/components/layout/CentralArea";
import { MobilePreview } from "@/components/layout/MobilePreview";
import { useDashboardStore } from "@/store/useDashboardStore";
import "./App.css";

export function App() {
  const init = useDashboardStore((s) => s.init);

  useEffect(() => {
    init();
  }, [init]);

  return (
    <div className="h-screen w-screen flex bg-neutral-950 text-white overflow-hidden">
      {/* 1. Barra Lateral de Navegação (240px fixa) */}
      <Sidebar />

      {/* 2. Área Central Dinâmica (flex-1) */}
      <CentralArea />

      {/* 3. Painel de Pré-visualização Mobile (320px fixa) */}
      <MobilePreview />
    </div>
  );
}

export default App;
