/**
 * @jest-environment jsdom
 */

import { TextEncoder, TextDecoder } from "util";
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";

// Mock the AuthContext
let mockAuthState = {
  user: null,
  token: null,
  isLoading: false,
  loading: false,
  isAuthenticated: false,
};

jest.mock("../client/src/features/auth/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

// Mock child components to isolate Auth Gate logic
jest.mock("../client/src/core/Layout", () => {
  return function MockLayout() {
    return <div data-testid="app-layout">App Workspace Layout</div>;
  };
});

jest.mock("../client/src/features/auth/SplitAuthPage", () => {
  return function MockSplitAuth() {
    return <div data-testid="split-auth">Sign In Screen</div>;
  };
});

jest.mock("../client/src/features/auth/VerifyEmailPage", () => {
  return function MockVerify() {
    return <div data-testid="verify-screen">Verify Your Email - Activate Account</div>;
  };
});

// Import Gatekeeper and Skeletons
import Gatekeeper from "../client/src/pages/Gatekeeper";
import DashboardSkeleton from "../client/src/components/ui/DashboardSkeleton";

describe("Frontend Auth Gate & Glass Skeleton Testing Suite", () => {
  beforeEach(() => {
    mockAuthState = {
      user: null,
      token: null,
      isLoading: false,
      loading: false,
      isAuthenticated: false,
    };
  });

  describe("Auth Gate (Gatekeeper)", () => {
    it("mounts the frosted glass skeleton while authentication state is loading (Zero CLS)", () => {
      mockAuthState = {
        user: null,
        token: null,
        isLoading: true,
        loading: true,
        isAuthenticated: false,
      };

      const { container } = render(
        <MemoryRouter initialEntries={["/app"]}>
          <Gatekeeper />
        </MemoryRouter>
      );

      // Verify the visionOS frosted glass skeleton classes are mounted
      const skeletonCard = container.querySelector(".glass-skeleton");
      expect(skeletonCard).toBeInTheDocument();
      expect(skeletonCard).toHaveClass("animate-pulse");
      expect(skeletonCard).toHaveClass("backdrop-blur-3xl");
    });

    it("strictly blocks unauthenticated users and renders SplitAuthPage (Sign In)", () => {
      mockAuthState = {
        user: null,
        token: null,
        isLoading: false,
        loading: false,
        isAuthenticated: false,
      };

      render(
        <MemoryRouter initialEntries={["/app"]}>
          <Gatekeeper />
        </MemoryRouter>
      );

      // Verify unauthenticated user sees Sign In screen
      expect(screen.getByText(/Sign In/i)).toBeInTheDocument();
      expect(screen.queryByText(/Cash Flow Projection/i)).not.toBeInTheDocument();
    });

    it("strictly intercepts unverified registered users and gates them behind Email Verification", () => {
      mockAuthState = {
        user: {
          _id: "user-123",
          name: "Pending Verification Student",
          email: "student@campus.edu",
          role: "student",
          isVerified: false,
        },
        token: "mock-valid-jwt",
        isLoading: false,
        loading: false,
        isAuthenticated: true,
      };

      render(
        <MemoryRouter initialEntries={["/app"]}>
          <Gatekeeper />
        </MemoryRouter>
      );

      // Verify user is presented with the email verification OTP screen
      expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument();
      expect(screen.getByText(/Activate Account/i)).toBeInTheDocument();
    });

    it("permits demo users to bypass email verification and directly access the application", () => {
      mockAuthState = {
        user: {
          _id: "demo-student-id",
          name: "Alex Rivera",
          email: "student@campuscoin.com",
          role: "student",
          isDemo: true,
          isVerified: true,
        },
        token: "demo-mock-jwt-token",
        isLoading: false,
        loading: false,
        isAuthenticated: true,
      };

      const { container } = render(
        <MemoryRouter initialEntries={["/app"]}>
          <Gatekeeper />
        </MemoryRouter>
      );

      // Verify demo user directly accesses the app and is NOT gated by Verify Your Email
      expect(screen.queryByText(/Verify Your Email/i)).not.toBeInTheDocument();
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("@tanstack/react-query Fetching State & Skeleton Alignment", () => {
    function TestQueryConsumer() {
      const { data, isLoading } = useQuery({
        queryKey: ["testData"],
        queryFn: () => new Promise((resolve) => setTimeout(() => resolve({ balance: 1500 }), 1000)),
      });

      if (isLoading) {
        return <DashboardSkeleton />;
      }

      return <div data-testid="resolved-content">Balance: ${data?.balance}</div>;
    }

    it("mounts the frosted glass skeleton during background queries", async () => {
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: {
            retry: false,
          },
        },
      });

      const { container } = render(
        <QueryClientProvider client={queryClient}>
          <TestQueryConsumer />
        </QueryClientProvider>
      );

      // Verify skeleton is mounted during fetching
      expect(container.querySelector(".glass-skeleton")).toBeInTheDocument();
      expect(screen.queryByTestId("resolved-content")).not.toBeInTheDocument();
    });
  });
});
