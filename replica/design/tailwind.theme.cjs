// Correspondance Tailwind (si Tailwind est adopté un jour) : classes bg-surface, text-text-muted, etc.
module.exports = { theme: { extend: {
  "colors": {
    "bg": "var(--color-bg)",
    "surface": "var(--color-surface)",
    "surface-sand": "var(--color-surface-sand)",
    "surface-blush": "var(--color-surface-blush)",
    "surface-beige": "var(--color-surface-beige)",
    "border": "var(--color-border)",
    "border-strong": "var(--color-border-strong)",
    "border-input": "var(--color-border-input)",
    "text": "var(--color-text)",
    "text-muted": "var(--color-text-muted)",
    "inverse": "var(--color-inverse)",
    "on-inverse": "var(--color-on-inverse)",
    "on-inverse-muted": "var(--color-on-inverse-muted)",
    "accent": "var(--color-accent)",
    "accent-hover": "var(--color-accent-hover)",
    "on-accent": "var(--color-on-accent)",
    "danger": "var(--color-danger)",
    "success": "var(--color-success)",
    "brass": "var(--color-brass)"
  },
  "fontFamily": {
    "display": "var(--font-display)",
    "sans": "var(--font-sans)"
  },
  "fontSize": {
    "eyebrow": [
      "var(--text-eyebrow)",
      {
        "lineHeight": "var(--leading-eyebrow)"
      }
    ],
    "sm": [
      "var(--text-sm)",
      {
        "lineHeight": "var(--leading-sm)"
      }
    ],
    "body": [
      "var(--text-body)",
      {
        "lineHeight": "var(--leading-body)"
      }
    ],
    "base": [
      "var(--text-base)",
      {
        "lineHeight": "var(--leading-base)"
      }
    ],
    "lead": [
      "var(--text-lead)",
      {
        "lineHeight": "var(--leading-lead)"
      }
    ],
    "button": [
      "var(--text-button)",
      {
        "lineHeight": "var(--leading-button)"
      }
    ],
    "h3": [
      "var(--text-h3)",
      {
        "lineHeight": "var(--leading-h3)"
      }
    ],
    "h2": [
      "var(--text-h2)",
      {
        "lineHeight": "var(--leading-h2)"
      }
    ],
    "h2-lg": [
      "var(--text-h2-lg)",
      {
        "lineHeight": "var(--leading-h2-lg)"
      }
    ],
    "h1": [
      "var(--text-h1)",
      {
        "lineHeight": "var(--leading-h1)"
      }
    ]
  },
  "borderRadius": {
    "sm": "var(--radius-sm)",
    "md": "var(--radius-md)",
    "lg": "var(--radius-lg)",
    "xl": "var(--radius-xl)",
    "2xl": "var(--radius-2xl)",
    "pill": "var(--radius-pill)",
    "round": "var(--radius-round)"
  },
  "boxShadow": {
    "pop": "var(--shadow-pop)",
    "card": "var(--shadow-card)",
    "hero": "var(--shadow-hero)",
    "sticky": "var(--shadow-sticky)"
  },
  "maxWidth": {
    "layout": "var(--layout-max)"
  }
} } };
