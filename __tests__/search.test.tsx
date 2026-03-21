/**
 * __tests__/search.test.tsx — Tests SearchInput component
 *
 * TC-SRC-001: Search input renders and accepts text
 * TC-SRC-002: Autocomplete triggers after 3+ chars with 250ms debounce
 * TC-SRC-003: Suggestion selection navigates to preview
 * TC-SRC-004: Short query (< 3 chars) shows error
 * TC-SRC-005: RPC error handled gracefully
 * TC-SRC-006: HighlightMatch marks matched substring
 *
 * NOTE: Tests that verify DOM updates from async operations (RPC -> render)
 * use real timers + waitFor. Tests that verify debounce timing use fake timers.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";

// ── Mocks ──────────────────────────────────────────────────────────────

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
}));

const mockRpc = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: (...args: unknown[]) => mockRpc(...args),
  },
}));

// Must import after mocks
import { SearchInput } from "@/components/SearchInput";


// ── Helpers ────────────────────────────────────────────────────────────

function mockFetch(response: object, ok = true) {
  global.fetch = vi.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(response),
  }) as unknown as typeof fetch;
}

const SAMPLE_SUGGESTIONS = [
  {
    property_id: "uuid-1",
    adresse: "2860 RUE GABRIEL-LE PREVOST",
    nom_municipalite: "Quebec",
    latitude: 46.77,
    longitude: -71.29,
  },
  {
    property_id: "uuid-2",
    adresse: "123 RUE DES PINS",
    nom_municipalite: "Montreal",
    latitude: 45.50,
    longitude: -73.56,
  },
];


describe("SearchInput", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockPush.mockReset();
    // Default: RPC returns empty suggestions
    mockRpc.mockResolvedValue({ data: [], error: null });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ── TC-SRC-001: Render & input ─────────────────────────────────────

  describe("TC-SRC-001: Render", () => {
    it("renders input with placeholder", () => {
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);
      expect(input).toBeInTheDocument();
    });

    it("renders submit button 'Analyser'", () => {
      render(<SearchInput />);
      expect(screen.getByRole("button", { name: /analyser/i })).toBeInTheDocument();
    });

    it("accepts text input", () => {
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);
      fireEvent.change(input, { target: { value: "2860" } });
      expect(input).toHaveValue("2860");
    });

    it("has autocomplete off to prevent browser suggestions", () => {
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);
      expect(input).toHaveAttribute("autoComplete", "off");
    });
  });

  // ── TC-SRC-002: Autocomplete debounce & threshold ──────────────────

  describe("TC-SRC-002: Autocomplete", () => {
    it("does NOT call RPC for fewer than 3 chars", async () => {
      vi.useFakeTimers();
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "ab" } });
      await act(async () => { vi.advanceTimersByTime(300); });

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it("calls RPC after 250ms debounce with 3+ chars", async () => {
      vi.useFakeTimers();
      mockRpc.mockResolvedValue({ data: SAMPLE_SUGGESTIONS, error: null });
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "2860" } });

      // Before debounce — should not have called yet
      await act(async () => { vi.advanceTimersByTime(200); });
      expect(mockRpc).not.toHaveBeenCalled();

      // After debounce — should call RPC
      await act(async () => { vi.advanceTimersByTime(100); });
      expect(mockRpc).toHaveBeenCalledWith(
        "search_properties_autocomplete",
        expect.objectContaining({ q: "2860", limit_n: 6 })
      );
    });

    it("displays suggestion list when RPC returns results", async () => {
      // Real timers: need DOM update from async RPC chain
      mockRpc.mockResolvedValue({ data: SAMPLE_SUGGESTIONS, error: null });
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "2860" } });

      // Wait for debounce (250ms) + RPC resolution + React re-render
      await waitFor(() => {
        expect(screen.getByText(/GABRIEL/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });

    it("limits suggestions to limit_n=6", async () => {
      // Real timers: verify the RPC parameter after debounce
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "rue" } });

      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalledWith(
          "search_properties_autocomplete",
          expect.objectContaining({ limit_n: 6 })
        );
      }, { timeout: 2000 });
    });
  });

  // ── TC-SRC-003: Selection & navigation ─────────────────────────────

  describe("TC-SRC-003: Selection", () => {
    it("navigates to preview on suggestion click via resolve API", async () => {
      mockRpc.mockResolvedValue({ data: SAMPLE_SUGGESTIONS, error: null });
      mockFetch({ matricule: "438188918610000000" });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "2860" } });

      // Wait for suggestions to appear (real timers)
      await waitFor(() => {
        expect(screen.getByText(/GABRIEL/)).toBeInTheDocument();
      }, { timeout: 2000 });

      // Click the suggestion — use mouseDown (component uses onMouseDown)
      const sugItem = screen.getByText(/GABRIEL/).closest("li");
      await act(async () => {
        fireEvent.mouseDown(sugItem!);
      });

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/resolve",
          expect.objectContaining({ method: "POST" })
        );
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/preview/438188918610000000");
      });
    });

    it("navigates to first result when API returns results array", async () => {
      mockFetch({ results: [{ matricule: "AAA" }, { matricule: "BBB" }] });

      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "test address long enough" } });

      const form = input.closest("form")!;
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/preview/AAA");
      });
    });
  });

  // ── TC-SRC-004: Short query validation ─────────────────────────────

  describe("TC-SRC-004: Validation", () => {
    it("shows error for query shorter than 3 chars on submit", async () => {
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "ab" } });
      await act(async () => {
        fireEvent.submit(form);
      });

      expect(screen.getByText(/minimum 3 caract/i)).toBeInTheDocument();
    });

    it("does not show error for valid length query", async () => {
      mockFetch({ matricule: "TEST" });
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "2860 Gabriel" } });
      await act(async () => {
        fireEvent.submit(form);
      });

      expect(screen.queryByText(/minimum 3 caract/i)).not.toBeInTheDocument();
    });
  });

  // ── TC-SRC-005: Error handling ─────────────────────────────────────

  describe("TC-SRC-005: Error handling", () => {
    it("displays error when resolve API returns non-ok", async () => {
      mockFetch({ error: "Propriete non trouvee" }, false);
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "adresse inexistante" } });
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText(/non trouv/i)).toBeInTheDocument();
      });
    });

    it("displays generic error on fetch exception", async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error("Network error")) as unknown as typeof fetch;
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);
      const form = input.closest("form")!;

      fireEvent.change(input, { target: { value: "any search query" } });
      await act(async () => {
        fireEvent.submit(form);
      });

      await waitFor(() => {
        expect(screen.getByText(/erreur de recherche/i)).toBeInTheDocument();
      });
    });

    it("clears suggestions silently on RPC error", async () => {
      mockRpc.mockResolvedValue({ data: null, error: { message: "timeout" } });
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "2860 rue" } });

      // Wait for debounce + RPC to complete
      await waitFor(() => {
        expect(mockRpc).toHaveBeenCalled();
      }, { timeout: 2000 });

      // No suggestions should be displayed
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });
  });

  // ── TC-SRC-006: HighlightMatch ─────────────────────────────────────

  describe("TC-SRC-006: Highlight", () => {
    it("renders matched text with <mark> highlight", async () => {
      mockRpc.mockResolvedValue({ data: SAMPLE_SUGGESTIONS, error: null });
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "GABRIEL" } });

      await waitFor(() => {
        const marks = document.querySelectorAll("mark");
        expect(marks.length).toBeGreaterThan(0);
      }, { timeout: 2000 });
    });

    it("shows municipality in each suggestion", async () => {
      mockRpc.mockResolvedValue({ data: SAMPLE_SUGGESTIONS, error: null });
      render(<SearchInput />);
      const input = screen.getByPlaceholderText(/adresse ou matricule/i);

      fireEvent.change(input, { target: { value: "rue" } });

      await waitFor(() => {
        expect(screen.getByText(/Mun\. Quebec/)).toBeInTheDocument();
        expect(screen.getByText(/Mun\. Montreal/)).toBeInTheDocument();
      }, { timeout: 2000 });
    });
  });
});
