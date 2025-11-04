/// <reference types="vite/client" />

// Vite raw imports - allows importing CSS as strings
declare module '*.css?raw' {
  const content: string;
  export default content;
}
