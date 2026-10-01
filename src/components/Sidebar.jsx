'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  [
    '/products',
    'Product Catalogue',
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>,
  ],

  [
    '/coverage',
    'Coverage',
    <path
      key="shield"
      d="M12 3 20 6v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"
    />,
  ],

  [
    '/class-of-business',
    'Class of Business',
    <>
      <path d="m12 3 9 5-9 5-9-5 9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="M3 16l9 5 9-5" />
    </>,
  ],

  [
    '/distribution',
    'Distribution',
    <>
      <path d="M3 7h18" />
      <path d="m16 2 5 5-5 5" />
      <path d="M21 17H3" />
      <path d="m8 12-5 5 5 5" />
    </>,
  ],

  [
    '/acord',
    'Acord',
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M14 3v5h5" />
      <path d="M9 13h7" />
      <path d="M9 17h7" />
    </>,
  ],
];

// These pages are plain HTML pages served by server.js.
// They should NOT use Next.js <Link>.
const plainPages = new Set([
  '/coverage',
  '/class-of-business',
  '/distribution',
  '/acord',
]);

export default function Sidebar({
  open,
  collapsed,
  onNavigate,
  onCollapse,
}) {
  const pathname = usePathname();

  return (
    <aside
      id="sidebar"
      className={
        'sidebar' +
        (open ? ' open' : '') +
        (collapsed ? ' collapsed' : '')
      }
    >
      {/* Heading */}
      <div className="nav-heading">
        Product Studio
      </div>

      {/* Navigation */}
      <nav aria-label="Product Studio">
        {items.map(([href, label, icon]) => {
          const active =
            pathname === href ||
            pathname.startsWith(href + '/');

          const isPlainPage = plainPages.has(href);

          /*
           * Next.js pages:
           *     /products
           *
           * Plain HTML pages:
           *     /coverage
           *     /class-of-business
           *     /distribution
           *     /acord
           */
          const Item = isPlainPage ? 'a' : Link;

          return (
            <Item
              key={href}
              href={href}
              className={
                'nav-item' +
                (active ? ' selected' : '')
              }
              aria-current={
                active ? 'page' : undefined
              }
              title={label}
              onClick={onNavigate}
            >
              {/* Icon */}
              <span
                className="nav-icon"
                aria-hidden="true"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  focusable="false"
                  style={{
                    display: 'block',
                  }}
                >
                  {icon}
                </svg>
              </span>

              {/* Label */}
              <span className="nav-label">
                {label}
              </span>
            </Item>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        type="button"
        className="collapse-btn"
        onClick={onCollapse}
        aria-label={
          collapsed
            ? 'Expand sidebar'
            : 'Collapse sidebar'
        }
        aria-expanded={!collapsed}
      >
        {!collapsed && (
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m15 6-6 6 6 6" />
          </svg>
        )}

        <span>Collapse</span>
      </button>
    </aside>
  );
}