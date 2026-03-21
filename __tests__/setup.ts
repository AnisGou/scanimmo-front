/**
 * __tests__/setup.ts — Global test setup
 * Mocks for Next.js navigation and mapbox-gl
 */
import { vi } from "vitest";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

// Mock mapbox-gl (heavy native dep)
vi.mock("mapbox-gl", () => ({
  default: {
    Map: vi.fn(),
    Marker: vi.fn(),
    NavigationControl: vi.fn(),
    accessToken: "",
  },
}));
