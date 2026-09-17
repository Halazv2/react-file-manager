import { ChevronRightIcon } from "../icons";
import { useFileManagerContext } from "../context";
import { cn, DROP_TARGET_CLASS } from "../styles";

export function Breadcrumbs() {
  const { breadcrumbs, dropTargetId, rootLabel, openFolder, folderDropHandlers } = useFileManagerContext();

  return (
    <nav
      className='flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto overflow-y-hidden text-[13px] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'
      aria-label='Breadcrumb'>
      <button
        type='button'
        className={cn(
          "cursor-pointer whitespace-nowrap rounded-sm border-0 bg-transparent p-0 text-gray-700 hover:text-rfm-primary",
          dropTargetId === "root" ? DROP_TARGET_CLASS : "",
        )}
        onClick={() => openFolder(null)}
        {...folderDropHandlers("root")}>
        {rootLabel}
      </button>
      {breadcrumbs.map((folder) => (
        <span key={folder.id} className='inline-flex items-center gap-1'>
          <ChevronRightIcon className='text-gray-400' size={14} />
          <button
            type='button'
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-sm border-0 bg-transparent p-0 text-gray-700 hover:text-rfm-primary",
              dropTargetId === folder.id ? DROP_TARGET_CLASS : "",
            )}
            onClick={() => openFolder(folder.id)}
            {...folderDropHandlers(folder.id)}>
            {folder.name}
          </button>
        </span>
      ))}
    </nav>
  );
}
