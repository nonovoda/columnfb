// ui/core/tokens.js
// Единые дизайн-токены для всех FB bookmarklet tools.

export const FB_TOOL_TOKENS = {
  zIndex: 2147483647,

  colors: {
    bg: "#0f1715",
    bgDeep: "#0b1210",
    surface: "#121f1b",

    border: "#2b433a",
    borderSoft: "#22372f",
    borderInput: "#2f4a40",

    text: "#e8fff0",
    textSoft: "#c7e0d2",
    textMuted: "#99b3a6",

    accent: "#4dff8f",
    accentText: "#052012",

    success: "#9bff7d",
    error: "#ff8f8f",
    close: "#d3e8dc"
  },

  radius: {
    control: "9px",
    log: "10px",
    modal: "14px"
  },

  shadow: {
    modal: "0 24px 60px rgba(0,0,0,.45)"
  },

  size: {
    modalWidth: "min(420px, calc(100vw - 24px))",
    modalMaxHeight: "calc(100vh - 40px)",
    modalPadding: "14px",
    controlPadding: "9px",
    gap: "8px",
    logMaxHeight: "180px",
    multiSelectMinHeight: "110px"
  },

  font: {
    family: 'Inter, "Segoe UI", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    base: "13px",
    small: "12px",
    tiny: "11px",
    lineHeight: "1.4",
    title: "32px"
  },

  transition: {
    fast: "160ms ease"
  }
};

// Для bookmarklet-скриптов без сборщика можно использовать эту функцию,
// чтобы быстро получить CSS-переменные в строковом виде.
export function getFbToolCssVars() {
  const c = FB_TOOL_TOKENS.colors;
  const r = FB_TOOL_TOKENS.radius;
  const s = FB_TOOL_TOKENS.size;
  const f = FB_TOOL_TOKENS.font;

  return `
    --fbtool-bg:${c.bg};
    --fbtool-bg-deep:${c.bgDeep};
    --fbtool-surface:${c.surface};
    --fbtool-border:${c.border};
    --fbtool-border-soft:${c.borderSoft};
    --fbtool-border-input:${c.borderInput};
    --fbtool-text:${c.text};
    --fbtool-text-soft:${c.textSoft};
    --fbtool-text-muted:${c.textMuted};
    --fbtool-accent:${c.accent};
    --fbtool-accent-text:${c.accentText};
    --fbtool-success:${c.success};
    --fbtool-error:${c.error};
    --fbtool-close:${c.close};
    --fbtool-radius:${r.control};
    --fbtool-radius-log:${r.log};
    --fbtool-radius-modal:${r.modal};
    --fbtool-modal-width:${s.modalWidth};
    --fbtool-modal-max-height:${s.modalMaxHeight};
    --fbtool-modal-padding:${s.modalPadding};
    --fbtool-control-padding:${s.controlPadding};
    --fbtool-gap:${s.gap};
    --fbtool-log-max-height:${s.logMaxHeight};
    --fbtool-select-multiple-height:${s.multiSelectMinHeight};
    --fbtool-font:${f.family};
    --fbtool-font-mono:${f.mono};
    --fbtool-font-size:${f.base};
    --fbtool-line-height:${f.lineHeight};
    --fbtool-title-size:${f.title};
  `;
}
