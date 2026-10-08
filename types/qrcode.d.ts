declare module "qrcode" {
  export interface QRCodeToDataURLOptions {
    version?: number;
    errorCorrectionLevel?: "L" | "M" | "Q" | "H" | "low" | "medium" | "quartile" | "high";
    margin?: number;
    scale?: number;
    width?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    type?: string;
    rendererOpts?: {
      quality?: number;
    };
  }

  export function toDataURL(
    text: string | Buffer,
    options?: QRCodeToDataURLOptions
  ): Promise<string>;

  export function toDataURL(
    text: string | Buffer,
    callback: (error: Error | null, url: string) => void
  ): void;

  export function toString(
    text: string | Buffer,
    options?: any
  ): Promise<string>;
}
