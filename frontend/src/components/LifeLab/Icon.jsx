import React from 'react';

export default function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 1.8 }) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const icons = {
    signal: () => (
      <svg {...props} stroke="none" fill={color}>
        <rect x="2" y="9" width="3" height="6" rx=".5" />
        <rect x="7" y="6" width="3" height="9" rx=".5" />
        <rect x="12" y="3" width="3" height="12" rx=".5" />
      </svg>
    ),
    wifi: () => (
      <svg {...props}>
        <path d="M2 8.5C5 5.5 9 4 12 4s7 1.5 10 4.5" />
        <path d="M5 12c2-2 4.5-3 7-3s5 1 7 3" />
        <path d="M8.5 15.5c1-1 2.2-1.5 3.5-1.5s2.5.5 3.5 1.5" />
        <circle cx="12" cy="18.5" r=".5" fill={color} />
      </svg>
    ),
    search: () => (
      <svg {...props}>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" />
      </svg>
    ),
    bell: () => (
      <svg {...props}>
        <path d="M6 9a6 6 0 0 1 12 0v5l2 3H4l2-3V9Z" />
        <path d="M10 20a2 2 0 0 0 4 0" />
      </svg>
    ),
    home: () => (
      <svg {...props}>
        <path d="M4 11 12 4l8 7v9a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1v-9Z" />
      </svg>
    ),
    compass: () => (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="m15 9-2 6-6 2 2-6 6-2Z" />
      </svg>
    ),
    sparkle: () => (
      <svg {...props}>
        <path d="M12 3v6M12 15v6M3 12h6M15 12h6" />
        <path d="M6 6l3 3M15 15l3 3M6 18l3-3M15 9l3-3" />
      </svg>
    ),
    chat: () => (
      <svg {...props}>
        <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2V6Z" />
      </svg>
    ),
    user: () => (
      <svg {...props}>
        <circle cx="12" cy="9" r="3.5" />
        <path d="M5 20c1-3.5 4-5.5 7-5.5s6 2 7 5.5" />
      </svg>
    ),
    arrow_left: () => (
      <svg {...props}>
        <path d="M15 6l-6 6 6 6" />
      </svg>
    ),
    check: () => (
      <svg {...props}>
        <path d="M5 12.5 10 17l9-10" />
      </svg>
    ),
    camera: () => (
      <svg {...props}>
        <path d="M4 8h3l2-2h6l2 2h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
        <circle cx="12" cy="13" r="3.5" />
      </svg>
    ),
    upload: () => (
      <svg {...props}>
        <path d="M12 16V4M7 9l5-5 5 5M4 20h16" />
      </svg>
    ),
    cart: () => (
      <svg {...props}>
        <path d="M3 4h2l2 12h12l2-9H7" />
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
      </svg>
    ),
    leaf: () => (
      <svg {...props}>
        <path d="M5 19c0-7 5-13 14-13 0 9-6 14-13 14a1 1 0 0 1-1-1Z" />
        <path d="M5 19c2-3 5-5 9-7" />
      </svg>
    ),
    sprout: () => (
      <svg {...props}>
        <path d="M12 21v-9" />
        <path d="M12 12c0-3 2-6 6-6 0 4-2 7-6 7" />
        <path d="M12 12c0-3-2-5-5-5 0 3 2 6 5 6" />
      </svg>
    ),
    sun: () => (
      <svg {...props}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M5.5 18.5l1.4-1.4M17.1 6.9l1.4-1.4" />
      </svg>
    ),
    drop: () => (
      <svg {...props}>
        <path d="M12 3s7 7.5 7 12a7 7 0 1 1-14 0c0-4.5 7-12 7-12Z" />
      </svg>
    ),
    flask: () => (
      <svg {...props}>
        <path d="M9 3h6M10 3v6L5 19a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 19l-5-10V3" />
        <path d="M7.5 14h9" />
      </svg>
    ),
    force: () => (
      <svg {...props}>
        <path d="M3 12h14M14 8l4 4-4 4" />
        <circle cx="20" cy="12" r="1.5" fill={color} />
      </svg>
    ),
    book: () => (
      <svg {...props}>
        <path d="M4 5a1 1 0 0 1 1-1h6v16H5a1 1 0 0 1-1-1V5Z" />
        <path d="M20 5a1 1 0 0 0-1-1h-6v16h6a1 1 0 0 0 1-1V5Z" />
      </svg>
    ),
    menu: () => (
      <svg {...props} stroke="none" fill={color}>
        <circle cx="6" cy="12" r="1.5" />
        <circle cx="12" cy="12" r="1.5" />
        <circle cx="18" cy="12" r="1.5" />
      </svg>
    ),
    check_circle: () => (
      <svg {...props}>
        <circle cx="12" cy="12" r="9" />
        <path d="m8 12 3 3 5-6" />
      </svg>
    ),
  };

  const IconComponent = icons[name];
  return IconComponent ? <IconComponent /> : null;
}
