/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_TIME_TRAVEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*.module.css" {
  const classes: { readonly [key: string]: string };
  export default classes;
}
