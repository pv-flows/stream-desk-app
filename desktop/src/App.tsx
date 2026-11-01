import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { CentralArea } from "@/components/layout/CentralArea";
import { MobilePreview } from "@/components/layout/MobilePreview";
import "./App.css";

export function App() {
  const [activeTab, setActiveTab] = useState("buttons");
  const [activePage, setActivePage] = useState("Principal");
  const [previewOrientation, setPreviewOrientation] = useState<"portrait" | "landscape">("portrait");

  const toggleOrientation = () => {
    setPreviewOrientation((prev) => (prev === "portrait" ? "landscape" : "portrait"));
  };

  return (
    <div className="h-screen w-screen flex bg-neutral-950 text-white overflow-hidden">
      {/* 1. Barra Lateral de Navegação (240px fixa) */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        activePage={activePage}
        onSelectPage={setActivePage}
      />

      {/* 2. Área Central Dinâmica (flex-1) */}
      <CentralArea activePage={activePage} />

      {/* 3. Painel de Pré-visualização Mobile (320px fixa) */}
      <MobilePreview
        activePage={activePage}
        previewOrientation={previewOrientation}
        onToggleOrientation={toggleOrientation}
      />
    </div>
  );
}

export default App;
