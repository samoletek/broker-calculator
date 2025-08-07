declare module 'iframe-resizer' {
  export interface IFrameOptions {
    log?: boolean;
    checkOrigin?: boolean | string[];
    inPageLinks?: boolean;
    heightCalculationMethod?: string;
    scrolling?: boolean;
    tolerance?: number;
    warningTimeout?: number;
    onInit?: (iframe: HTMLIFrameElement) => void;
    onResized?: (messageData: any) => void;
  }
  
  export function iframeResizer(options?: IFrameOptions, target?: string | HTMLElement): void;
  
  export const iframeResize: (options?: IFrameOptions, target?: string | HTMLElement) => void;
}