// ui/core/tokens.js
// Unified design-tokens extracted from clmnPresetsManager.js baseline.

export const FB_TOOL_TOKENS = {
  zIndex: 2147483647,

  colors: {
    panelBg: "#0f1715",
    panelText: "#e8fff0",
    panelBorder: "#2b433a",
    panelShadow: "0 24px 60px rgba(0,0,0,.45)",

    accent: "#4dff8f",
    accentMuted: "#99b3a6",
    accentText: "#052012",

    label: "#c7e0d2",

    controlBg: "#121f1b",
    controlBorder: "#2f4a40",
    controlText: "#e8fff0",

    inputBg: "#121f1b",
    inputBorder: "#2f4a40",
    inputText: "#e8fff0",

    logBg: "#0b1210",
    logBorder: "#22372f",
    logText: "#e8fff0",

    success: "#9bff7d",
    warning: "#ffd27d",
    error: "#ff8f8f"
  },

  radius: {
    control: "9px",
    log: "10px",
    modal: "14px"
  },

  spacing: {
    panelPadding: "14px",
    controlPadding: "9px",
    gap: "8px",
    section: "10px"
  },

  size: {
    modalWidth: "min(420px, calc(100vw - 24px))",
    modalMaxHeight: "calc(100vh - 40px)",
    logMinHeight: "120px",
    logMaxHeight: "320px"
  },

  font: {
    family: 'Inter, "Segoe UI", Arial, sans-serif',
    mono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
    title: "32px",
    base: "13px",
    label: "12px",
    tiny: "11px",
    lineHeight: "1.4",
    titleLineHeight: "1.05"
  },

  motion: {
    fast: "160ms ease"
  },

  state: {
    loadingOpacity: "0.72",
    disabledOpacity: "0.5"
  }
};

export function getFbToolCssVars() {
  const t = FB_TOOL_TOKENS;
  const c = t.colors;

  return `
    --fbtool-z:${t.zIndex};
    --fbtool-panel-bg:${c.panelBg};
    --fbtool-panel-text:${c.panelText};
    --fbtool-panel-border:${c.panelBorder};
    --fbtool-panel-shadow:${c.panelShadow};

    --fbtool-accent:${c.accent};
    --fbtool-accent-muted:${c.accentMuted};
    --fbtool-accent-text:${c.accentText};

    --fbtool-label:${c.label};

    --fbtool-control-bg:${c.controlBg};
    --fbtool-control-border:${c.controlBorder};
    --fbtool-control-text:${c.controlText};

    --fbtool-input-bg:${c.inputBg};
    --fbtool-input-border:${c.inputBorder};
    --fbtool-input-text:${c.inputText};

    --fbtool-log-bg:${c.logBg};
    --fbtool-log-border:${c.logBorder};
    --fbtool-log-text:${c.logText};

    --fbtool-success:${c.success};
    --fbtool-warning:${c.warning};
    --fbtool-error:${c.error};

    --fbtool-radius-control:${t.radius.control};
    --fbtool-radius-log:${t.radius.log};
    --fbtool-radius-modal:${t.radius.modal};

    --fbtool-space-panel:${t.spacing.panelPadding};
    --fbtool-space-control:${t.spacing.controlPadding};
    --fbtool-gap:${t.spacing.gap};
    --fbtool-section:${t.spacing.section};

    --fbtool-width:${t.size.modalWidth};
    --fbtool-maxh:${t.size.modalMaxHeight};
    --fbtool-log-minh:${t.size.logMinHeight};
    --fbtool-log-maxh:${t.size.logMaxHeight};

    --fbtool-font:${t.font.family};
    --fbtool-font-mono:${t.font.mono};
    --fbtool-fs-title:${t.font.title};
    --fbtool-fs-base:${t.font.base};
    --fbtool-fs-label:${t.font.label};
    --fbtool-fs-tiny:${t.font.tiny};
    --fbtool-lh-base:${t.font.lineHeight};
    --fbtool-lh-title:${t.font.titleLineHeight};

    --fbtool-fast:${t.motion.fast};
    --fbtool-loading-opacity:${t.state.loadingOpacity};
    --fbtool-disabled-opacity:${t.state.disabledOpacity};
  `;
}
