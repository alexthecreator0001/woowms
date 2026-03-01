declare module 'bwip-js' {
  interface ToCanvasOptions {
    bcid: string;
    text: string;
    scale?: number;
    height?: number;
    width?: number;
    includetext?: boolean;
    textxalign?: string;
    textsize?: number;
  }

  function toCanvas(canvas: HTMLCanvasElement, options: ToCanvasOptions): HTMLCanvasElement;

  export default { toCanvas };
}
