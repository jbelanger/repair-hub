/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REPAIR_REQUEST_CONTRACT: string;
  readonly VITE_WORK_ORDER_CONTRACT: string;
  readonly VITE_GOOGLE_MAPS_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
