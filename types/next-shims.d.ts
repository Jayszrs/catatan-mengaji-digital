declare module "next/navigation" {
  export interface AppRouterInstance {
    push(href: string): void;
    replace(href: string): void;
    back(): void;
    forward(): void;
    refresh(): void;
    prefetch(href: string): void;
  }

  export function useRouter(): AppRouterInstance;
  export function usePathname(): string;
  export function useParams<T extends Record<string, string | string[]> = Record<string, string | string[]>>(): T;
  export function useSearchParams(): URLSearchParams;
}

declare module "next/link" {
  import type { AnchorHTMLAttributes, ReactNode } from "react";

  export interface LinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> {
    href: string;
    children?: ReactNode;
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean | null;
  }

  export default function Link(props: LinkProps): ReactNode;
}

declare module "next/server" {
  export class NextRequest extends Request {}

  export class NextResponse extends Response {
    static json(body: unknown, init?: ResponseInit): NextResponse;
  }
}

declare module "next" {
  export interface Metadata {
    title?: string;
    description?: string;
    [key: string]: unknown;
  }

  export interface NextConfig {
    [key: string]: unknown;
  }
}

declare module "next/font/google" {
  export interface NextFont {
    className: string;
    variable: string;
    style: { fontFamily: string };
  }

  export function Geist(options: Record<string, unknown>): NextFont;
  export function Geist_Mono(options: Record<string, unknown>): NextFont;
}
