import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function iconProps({ size = 16, className, ...rest }: IconProps) {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    width: size,
    height: size,
    className,
    "aria-hidden": true as const,
    ...rest,
  };
}

export function FolderIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M3 7.5A1.5 1.5 0 0 1 4.5 6h4.2l1.8 1.8H19.5A1.5 1.5 0 0 1 21 9.3v7.2A1.5 1.5 0 0 1 19.5 18h-15A1.5 1.5 0 0 1 3 16.5z' />
    </svg>
  );
}

export function FileIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M7 3.5h7l5 5V20a1.5 1.5 0 0 1-1.5 1.5h-10.5A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z' />
      <path d='M14 3.5V9h5.5' />
    </svg>
  );
}

export function HomeIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M4 11.5 12 4.5l8 7' />
      <path d='M6.5 10.5V19h11v-8.5' />
    </svg>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='m9 6 6 6-6 6' />
    </svg>
  );
}

export function ListIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M8 7h12M8 12h12M8 17h12' />
      <path d='M4 7h.01M4 12h.01M4 17h.01' />
    </svg>
  );
}

export function CardsIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M4 5h7v7H4zM13 5h7v7h-7zM4 14h7v6H4zM13 14h7v6h-7z' />
    </svg>
  );
}

export function CollapseIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M8 4H4v4M16 4h4v4M8 20H4v-4M16 20h4v-4' />
      <path d='m14 10-4 4m0-4 4 4' />
    </svg>
  );
}

export function SearchIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx='11' cy='11' r='6.5' />
      <path d='m16 16 4 4' />
    </svg>
  );
}

export function UploadIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M12 16V5' />
      <path d='m8 9 4-4 4 4' />
      <path d='M5 19h14' />
    </svg>
  );
}

export function StarIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='m12 3.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8z' />
    </svg>
  );
}

export function StarSolidIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)} fill='currentColor' stroke='currentColor' strokeWidth={1}>
      <path d='m12 3.5 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 15.8 7.2 18.4l.9-5.4L4.2 9.2l5.4-.8z' />
    </svg>
  );
}

export function MoreIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <circle cx='5' cy='12' r='1.2' fill='currentColor' stroke='none' />
      <circle cx='12' cy='12' r='1.2' fill='currentColor' stroke='none' />
      <circle cx='19' cy='12' r='1.2' fill='currentColor' stroke='none' />
    </svg>
  );
}

export function DownloadIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M12 4v10' />
      <path d='m8 10 4 4 4-4' />
      <path d='M5 19h14' />
    </svg>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M12 5v14' />
      <path d='M5 12h14' />
    </svg>
  );
}

export function PencilIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M12 20h9' />
      <path d='m16.5 3.5 4 4L7 21H3v-4z' />
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M4 7h16' />
      <path d='M10 11v6M14 11v6' />
      <path d='M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12' />
      <path d='M9 7V4h6v3' />
    </svg>
  );
}

export function EyeIcon(props: IconProps) {
  return (
    <svg {...iconProps(props)}>
      <path d='M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z' />
      <circle cx='12' cy='12' r='3' />
    </svg>
  );
}
