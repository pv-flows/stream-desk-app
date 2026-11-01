import { ConnectionView } from "@/components/views/ConnectionView";
import { AutoProfileView } from "@/components/views/AutoProfileView";
import { AppearanceView } from "@/components/views/AppearanceView";
import { SystemView } from "@/components/views/SystemView";
import { ButtonEditorView } from "@/components/views/ButtonEditorView";

export interface CentralAreaProps {
  activeTab?: string;
  activePage?: string;
}

export function CentralArea({ activeTab = "connection" }: CentralAreaProps) {
  if (activeTab === "connection") {
    return <ConnectionView />;
  }

  if (activeTab === "auto-profile") {
    return <AutoProfileView />;
  }

  if (activeTab === "themes") {
    return <AppearanceView />;
  }

  if (activeTab === "system" || activeTab === "about") {
    return <SystemView />;
  }

  // Padrão para "buttons" ("Páginas e botões") ou demais abas: exibe o Editor de Botões conceitual
  return <ButtonEditorView />;
}

export default CentralArea;
