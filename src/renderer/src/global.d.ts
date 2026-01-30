/// <reference types="vite/client" />

import { ApiType } from '../../preload/index'

// Webview HTML element type definition for Electron
declare namespace JSX {
  interface IntrinsicElements {
    webview: React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement> & {
        src: string
        partition?: string
        useragent?: string
        allowpopups?: string
        preload?: string
        nodeintegration?: string
        plugins?: string
        disablewebsecurity?: string
        allowtransparency?: string
      },
      HTMLElement
    >
  }
}

// Extend Window interface with Electron API
declare global {
  interface Window {
    api: ApiType
    electron: any
  }
}
