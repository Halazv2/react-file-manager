import { Browser } from "./components/Browser";
import { DetailsPane } from "./components/DetailsPane";
import { FileManagerContextMenu } from "./components/Item";
import { Sidebar } from "./components/Sidebar";
import { FileManagerContext } from "./context";
import { cn } from "./styles";
import type { FileManagerProps } from "./types";
import { useFileManagerController } from "./useFileManagerController";
import "./theme.css";

export function FileManager(props: FileManagerProps) {
  const value = useFileManagerController(props);
  const columns = value.showDetails ? "grid-cols-[216px_minmax(0,1fr)_280px]" : "grid-cols-[216px_minmax(0,1fr)]";

  return (
    <FileManagerContext.Provider value={value}>
      <div
        className={cn("rfm-root relative grid h-full min-h-0 overflow-hidden outline-none", columns, props.className)}
        tabIndex={0}
        aria-label='File manager'
        onKeyDown={value.handleKeyDown}
        onDragEnd={value.onInternalDragEnd}>
        <Sidebar />
        <Browser />
        {value.showDetails && <DetailsPane />}
        <FileManagerContextMenu />
      </div>
    </FileManagerContext.Provider>
  );
}
