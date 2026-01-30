import { ElectronAPI } from '@electron-toolkit/preload'
import { ZenFlowAPI } from '../shared/types'

declare global {
  interface Window {
    electron: ElectronAPI
    api: ZenFlowAPI
  }
}
