import { Browser } from "./components/Browser";
import { DetailsPane } from "./components/DetailsPane";
import { FileManagerContextMenu } from "./components/Item";
import { Sidebar } from "./components/Sidebar";
import { FileManagerActionsContext, FileManagerContext, FileManagerStateContext } from "./context";
import { cn } from "./styles";
import type { FileManagerProps } from "./types";
import { useFileManagerController } from "./hooks/useFileManagerController";
import "./theme.css";

export function FileManager(props: FileManagerProps) {
  const value = useFileManagerController(props);
  const { classNames } = value;

  return (
    <FileManagerActionsContext.Provider value={value}>
      <FileManagerStateContext.Provider value={value}>
        <FileManagerContext.Provider value={value}>
          <div
            ref={value.rootRef}
            className={cn("rfm-root", classNames?.root, props.className)}
            style={props.style}
            data-theme={props.theme}
            tabIndex={0}
            aria-label={value.labels.fileManager}
            onKeyDown={value.handleKeyDown}
            onDragEnd={value.onInternalDragEnd}>
            <div className="rfm-live" aria-live="polite" aria-atomic="true">
              {value.liveMessage}
            </div>
            <div className={cn("rfm-layout", classNames?.layout)} data-details={value.showDetails ? undefined : "false"}>
              <Sidebar />
              <Browser />
              {value.showDetails && <DetailsPane />}
            </div>
            <FileManagerContextMenu />
          </div>
        </FileManagerContext.Provider>
      </FileManagerStateContext.Provider>
    </FileManagerActionsContext.Provider>
  );
}
