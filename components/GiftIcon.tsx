export default function GiftIcon({ name, size = 40 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  } as const;
  switch (name) {
    case "letter":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2.5" />
          <path d="M3.5 7.5L12 13l8.5-5.5" />
        </svg>
      );
    case "wheel":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <circle cx="12" cy="12" r="2" />
          <path d="M12 3.5v6.5M12 14.5v6.5M3.5 12h6.5M14.5 12h6.5" />
        </svg>
      );
    case "game":
      return (
        <svg {...common}>
          <path d="M7 8h10a5 5 0 0 1 5 5c0 3-2.5 5-5.5 5-1.5 0-2.8-.7-3.7-1.7L12 15.5l-.8.8c-.9 1-2.2 1.7-3.7 1.7C4.5 18 2 16 2 13a5 5 0 0 1 5-5z" />
          <path d="M7 12h4M9 10v4" />
          <circle cx="15.5" cy="11.5" r="0.6" fill="currentColor" />
          <circle cx="17.5" cy="13.5" r="0.6" fill="currentColor" />
        </svg>
      );
    case "heart":
      return (
        <svg {...common}>
          <path d="M12 20.5C7 16.5 3.5 13.3 3.5 9.6 3.5 7.2 5.4 5.5 7.7 5.5c1.7 0 3.2.9 4.3 2.4 1.1-1.5 2.6-2.4 4.3-2.4 2.3 0 4.2 1.7 4.2 4.1 0 3.7-3.5 6.9-8.5 10.9z" />
        </svg>
      );
    case "moon":
      return (
        <svg {...common}>
          <path d="M20 13.5A8 8 0 1 1 10.5 4a6.5 6.5 0 0 0 9.5 9.5z" />
        </svg>
      );
    case "rose":
      return (
        <svg {...common}>
          <circle cx="12" cy="9" r="4.5" />
          <path d="M12 13.5V21M12 17c-2 0-3.5-1-4.5-2M12 16c2 0 3.5-1 4.5-2" />
        </svg>
      );
    case "star":
      return (
        <svg {...common}>
          <path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z" />
        </svg>
      );
    case "crown":
      return (
        <svg {...common}>
          <path d="M4 17h16M4 17l-1-9 5 3.5L12 5l4 6.5L21 8l-1 9" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...common}>
          <path d="M5 19C5 9 13 5 20 5c0 8-4 14-13 14" />
          <path d="M5 19c3-5 7-9 12-11" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M2 9c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2M2 15c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
        </svg>
      );
    case "flower":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.2" />
          <path d="M12 3.5c1.5 2 1.5 4.5 0 6.5-1.5-2-1.5-4.5 0-6.5zM12 20.5c-1.5-2-1.5-4.5 0-6.5 1.5 2 1.5 4.5 0 6.5zM3.5 12c2-1.5 4.5-1.5 6.5 0-2 1.5-4.5 1.5-6.5 0zM20.5 12c-2 1.5-4.5 1.5-6.5 0 2-1.5 4.5-1.5 6.5 0z" />
        </svg>
      );
    case "bolt":
      return (
        <svg {...common}>
          <path d="M13 2L5 13.5h5L10 22l8-11.5h-5z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 8v5M12 16.5v.01" />
        </svg>
      );
  }
}
