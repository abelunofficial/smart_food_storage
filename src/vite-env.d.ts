/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BLYNK_SERVER?: string;
  readonly VITE_BLYNK_AUTH_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

