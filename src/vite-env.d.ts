/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FUNRAISE_MCP_CONFIG_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
