import { ChevronRightIcon } from "../icons";
import { useFileManagerContext } from "../context";

export function Breadcrumbs() {
  const { breadcrumbs, dropTargetId, rootLabel, openFolder, folderDropHandlers } = useFileManagerContext();

  return (
    <nav className="rfm-breadcrumbs" aria-label="Breadcrumb">
      <button
        type="button"
        className="rfm-crumb"
        data-drop-target={dropTargetId === "root" || undefined}
        onClick={() => openFolder(null)}
        {...folderDropHandlers("root")}>
        {rootLabel}
      </button>
      {breadcrumbs.map((folder) => (
        <span key={folder.id} className="rfm-crumb-group">
          <ChevronRightIcon size={14} />
          <button
            type="button"
            className="rfm-crumb"
            data-drop-target={dropTargetId === folder.id || undefined}
            onClick={() => openFolder(folder.id)}
            {...folderDropHandlers(folder.id)}>
            {folder.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
