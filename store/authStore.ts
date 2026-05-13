import { create } from "zustand";
import { supabase } from "../lib/supabaseClient";
import { persist } from "zustand/middleware";
import type { AuthChangeEvent, Session, Provider } from "@supabase/supabase-js";
import type { UserType } from "@/lib/constants/user-types";

const IS_MOCK_MODE = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

/**
 * Generate a fake JWT-like token for mock mode.
 * The AuthGuard decodes the payload to check expiry, so we need a valid structure.
 */
function createMockToken(): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: "mock-user-id",
      email: "demo@artivo.africa",
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
      iat: Math.floor(Date.now() / 1000),
    })
  );
  const signature = btoa("mock-signature");
  return `${header}.${payload}.${signature}`;
}

/** Mock user returned when NEXT_PUBLIC_USE_MOCKS=true */
const MOCK_USER: User = {
  id: "mock-user-id",
  email: "demo@artivo.africa",
  email_confirmed_at: new Date().toISOString(),
  created_at: new Date().toISOString(),
  access_token: createMockToken(),
  refresh_token: "mock-refresh-token",
  user_type: "worker" as UserType,
  onboarding_completed: true,
  user_metadata: {
    full_name: "Demo User",
    user_type: "worker" as UserType,
    onboarding_completed: true,
    worker_profile_id: "worker-1",
  },
  app_metadata: {
    provider: "email",
    providers: ["email"],
  },
};

interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at?: string;
  access_token?: string;
  refresh_token?: string;
  user_metadata?: {
    avatar_url?: string;
    full_name?: string;
    name?: string;
    picture?: string;
    // Artivo-specific metadata
    user_type?: UserType;
    onboarding_completed?: boolean;
    worker_profile_id?: string;
    customer_profile_id?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
  // Convenience accessors for Artivo user state
  user_type?: UserType;
  onboarding_completed?: boolean;
}

interface LoadingStates {
  signIn: boolean;
  signUp: boolean;
  googleOAuth: boolean;
  appleOAuth: boolean;
  signOut: boolean;
  fetchUser: boolean;
  updateEmail: boolean;
  updatePassword: boolean;
}

interface AuthState {
  user: User | null;
  loading: {
    signIn: boolean;
    signUp: boolean;
    signOut: boolean;
    googleOAuth: boolean;
    appleOAuth: boolean;
    fetchUser: boolean;
    updateEmail: boolean;
    updatePassword: boolean;
    updateProfile: boolean;
    enableTwoFactor: boolean;
    disableTwoFactor: boolean;
    resendOtp: boolean;
    verifyOtp: boolean;
    confirmNewEmail: boolean;
    sendPasswordReset: boolean;
    resetPassword: boolean;
    deleteAccount: boolean;
  };
  error: string | null;
  initialized: boolean;
  authSubscription: any; // Store subscription reference for cleanup

  // Methods
  signIn: (email: string, password: string) => Promise<boolean>;
  signUp: (email: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  fetchUser: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  updateEmail: (email: string) => Promise<boolean>;
  updatePassword: (
    currentPassword: string,
    newPassword: string
  ) => Promise<boolean>;
  updateProfile: (updates: {
    name?: string;
    avatar?: string;
  }) => Promise<boolean>;
  enableTwoFactor: () => Promise<boolean>;
  disableTwoFactor: () => Promise<boolean>;
  resendOtp: (email: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<boolean>;
  confirmNewEmail: (otp: string) => Promise<boolean>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (password: string) => Promise<boolean>;
  deleteAccount: () => Promise<boolean>;
  initialize: () => void;
  clearError: () => void;
  isAnyLoading: () => boolean;
  cleanup: () => void; // Add cleanup method
  // Artivo-specific methods
  setUserType: (userType: UserType) => Promise<boolean>;
  completeOnboarding: () => Promise<boolean>;
  getUserType: () => UserType | undefined;
  isOnboardingComplete: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: {
        signIn: false,
        signUp: false,
        signOut: false,
        googleOAuth: false,
        appleOAuth: false,
        fetchUser: false,
        updateEmail: false,
        updatePassword: false,
        updateProfile: false,
        enableTwoFactor: false,
        disableTwoFactor: false,
        resendOtp: false,
        verifyOtp: false,
        confirmNewEmail: false,
        sendPasswordReset: false,
        resetPassword: false,
        deleteAccount: false,
      },
      error: null,
      initialized: false,
      authSubscription: null,

      signIn: async (email: string, password: string): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, signIn: true },
          error: null,
        }));

        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, signIn: false },
            }));
            return false;
          }

          if (data.user && data.session) {
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              email_confirmed_at: data.user.email_confirmed_at,
              created_at: data.user.created_at,
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              user_metadata: data.user.user_metadata,
              app_metadata: data.user.app_metadata,
            };

            set((state) => ({
              user,
              loading: { ...state.loading, signIn: false },
              error: null,
            }));
            return true;
          }

          set((state) => ({
            loading: { ...state.loading, signIn: false },
          }));
          return false;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : "An error occurred",
            loading: { ...state.loading, signIn: false },
          }));
          return false;
        }
      },

      signUp: async (email: string, password: string): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, signUp: true },
          error: null,
        }));

        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                onboarding_completed: false,
              },
            },
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, signUp: false },
            }));
            return false;
          }

          // Check if user needs email confirmation
          if (data.user && !data.user.email_confirmed_at) {
            set((state) => ({
              loading: { ...state.loading, signUp: false },
              error: null,
            }));
            return true; // Success but pending email confirmation
          }

          if (data.user && data.session) {
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              email_confirmed_at: data.user.email_confirmed_at,
              created_at: data.user.created_at,
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              user_metadata: data.user.user_metadata,
              app_metadata: data.user.app_metadata,
            };

            set((state) => ({
              user,
              loading: { ...state.loading, signUp: false },
              error: null,
            }));
            return true;
          }

          set((state) => ({
            loading: { ...state.loading, signUp: false },
          }));
          return false;
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : "An error occurred",
            loading: { ...state.loading, signUp: false },
          }));
          return false;
        }
      },

      signOut: async () => {
        set((state) => ({
          loading: { ...state.loading, signOut: true },
        }));

        try {
          // Clean up subscription before signing out
          const { authSubscription } = get();
          if (authSubscription) {
            authSubscription.unsubscribe();
            set({ authSubscription: null });
          }

          const { error } = await supabase.auth.signOut();
          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, signOut: false },
            }));
          } else {
            set((state) => ({
              user: null,
              loading: { ...state.loading, signOut: false },
              error: null,
            }));
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : "An error occurred",
            loading: { ...state.loading, signOut: false },
          }));
        }
      },

      fetchUser: async () => {
        set((state) => ({
          loading: { ...state.loading, fetchUser: true },
        }));

        try {
          const { data, error } = await supabase.auth.getUser();

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, fetchUser: false },
            }));
            return;
          }

          if (data.user) {
            const { data: sessionData } = await supabase.auth.getSession();

            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              email_confirmed_at: data.user.email_confirmed_at,
              created_at: data.user.created_at,
              access_token: sessionData.session?.access_token,
              refresh_token: sessionData.session?.refresh_token,
              user_metadata: data.user.user_metadata,
              app_metadata: data.user.app_metadata,
            };

            set((state) => ({
              user,
              error: null,
              loading: { ...state.loading, fetchUser: false },
            }));
          } else {
            set((state) => ({
              user: null,
              loading: { ...state.loading, fetchUser: false },
            }));
          }
        } catch (error) {
          set((state) => ({
            error: error instanceof Error ? error.message : "An error occurred",
            loading: { ...state.loading, fetchUser: false },
          }));
        }
      },

      refreshToken: async (): Promise<boolean> => {
        try {
          const { data, error } = await supabase.auth.refreshSession();

          if (error) {
            return false;
          }

          if (data.session && data.user) {
            const user: User = {
              id: data.user.id,
              email: data.user.email!,
              email_confirmed_at: data.user.email_confirmed_at,
              created_at: data.user.created_at,
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              user_metadata: data.user.user_metadata,
              app_metadata: data.user.app_metadata,
            };

            set((state) => ({
              user,
              error: null,
            }));
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      },

      signInWithGoogle: async () => {
        set((state) => ({
          loading: { ...state.loading, googleOAuth: true },
          error: null,
        }));

        try {
          const redirectTo =
            process.env.NODE_ENV === "production"
              ? `${process.env.NEXT_PUBLIC_SITE_URL}/callback`
              : `${window.location.origin}/callback`;

          const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
              redirectTo,
              queryParams: {
                access_type: "offline",
                prompt: "consent",
              },
            },
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, googleOAuth: false },
            }));
          }
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Google authentication failed",
            loading: { ...state.loading, googleOAuth: false },
          }));
        }
      },

      signInWithApple: async () => {
        set((state) => ({
          loading: { ...state.loading, appleOAuth: true },
          error: null,
        }));

        try {
          const redirectTo =
            process.env.NODE_ENV === "production"
              ? `${process.env.NEXT_PUBLIC_SITE_URL}/callback`
              : `${window.location.origin}/callback`;

          const { error } = await supabase.auth.signInWithOAuth({
            provider: "apple",
            options: {
              redirectTo,
            },
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, appleOAuth: false },
            }));
          }
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Apple authentication failed",
            loading: { ...state.loading, appleOAuth: false },
          }));
        }
      },

      updateEmail: async (email: string): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, updateEmail: true },
          error: null,
        }));

        try {
          const { error } = await supabase.auth.updateUser({
            email,
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, updateEmail: false },
            }));
            return false;
          }

          set((state) => ({
            loading: { ...state.loading, updateEmail: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error ? error.message : "Failed to update email",
            loading: { ...state.loading, updateEmail: false },
          }));
          return false;
        }
      },

      updatePassword: async (
        currentPassword: string,
        newPassword: string
      ): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, updatePassword: true },
          error: null,
        }));

        try {
          const { user } = get();
          if (!user?.email) {
            throw new Error("No user found");
          }

          // Verify current password
          const { error: signInError } = await supabase.auth.signInWithPassword(
            {
              email: user.email,
              password: currentPassword,
            }
          );

          if (signInError) {
            set((state) => ({
              error: "Current password is incorrect",
              loading: { ...state.loading, updatePassword: false },
            }));
            return false;
          }

          // Update password
          const { error: updateError } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (updateError) {
            set((state) => ({
              error: updateError.message,
              loading: { ...state.loading, updatePassword: false },
            }));
            return false;
          }

          set((state) => ({
            loading: { ...state.loading, updatePassword: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update password",
            loading: { ...state.loading, updatePassword: false },
          }));
          return false;
        }
      },

      updateProfile: async (updates: {
        name?: string;
        avatar?: string;
      }): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, updateProfile: true },
          error: null,
        }));

        try {
          const userMetadata: any = {};
          if (updates.name) userMetadata.full_name = updates.name;
          if (updates.avatar) userMetadata.avatar_url = updates.avatar;

          const { error } = await supabase.auth.updateUser({
            data: userMetadata,
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, updateProfile: false },
            }));
            return false;
          }

          set((state) => ({
            loading: { ...state.loading, updateProfile: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Failed to update profile",
            loading: { ...state.loading, updateProfile: false },
          }));
          return false;
        }
      },

      enableTwoFactor: async (): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, enableTwoFactor: true },
          error: null,
        }));

        try {
          // Implementation would depend on your 2FA provider
          // For now, just simulate the operation
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set((state) => ({
            loading: { ...state.loading, enableTwoFactor: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Failed to enable two-factor authentication",
            loading: { ...state.loading, enableTwoFactor: false },
          }));
          return false;
        }
      },

      disableTwoFactor: async (): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, disableTwoFactor: true },
          error: null,
        }));

        try {
          // Implementation would depend on your 2FA provider
          // For now, just simulate the operation
          await new Promise((resolve) => setTimeout(resolve, 1000));

          set((state) => ({
            loading: { ...state.loading, disableTwoFactor: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Failed to disable two-factor authentication",
            loading: { ...state.loading, disableTwoFactor: false },
          }));
          return false;
        }
      },

      resendOtp: async (email: string): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, resendOtp: true },
          error: null,
        }));

        try {
          const { error } = await supabase.auth.resend({
            type: "signup",
            email,
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, resendOtp: false },
            }));
            return false;
          }

          set((state) => ({
            loading: { ...state.loading, resendOtp: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error ? error.message : "Failed to resend OTP",
            loading: { ...state.loading, resendOtp: false },
          }));
          return false;
        }
      },

      verifyOtp: async (email: string, otp: string): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, verifyOtp: true },
          error: null,
        }));

        try {
          const { error } = await supabase.auth.verifyOtp({
            email,
            token: otp,
            type: "email",
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, verifyOtp: false },
            }));
            return false;
          }

          set((state) => ({
            loading: { ...state.loading, verifyOtp: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error ? error.message : "Failed to verify OTP",
            loading: { ...state.loading, verifyOtp: false },
          }));
          return false;
        }
      },

      confirmNewEmail: async (otp: string): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, confirmNewEmail: true },
          error: null,
        }));

        try {
          const { user } = get();
          if (!user?.email) {
            throw new Error("No user found");
          }

          const { error } = await supabase.auth.verifyOtp({
            email: user.email,
            token: otp,
            type: "email_change",
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, confirmNewEmail: false },
            }));
            return false;
          }

          set((state) => ({
            loading: { ...state.loading, confirmNewEmail: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Failed to confirm new email",
            loading: { ...state.loading, confirmNewEmail: false },
          }));
          return false;
        }
      },

      sendPasswordReset: async (email: string): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, sendPasswordReset: true },
          error: null,
        }));

        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/callback`,
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, sendPasswordReset: false },
            }));
            return false;
          }

          set((state) => ({
            loading: { ...state.loading, sendPasswordReset: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Failed to send password reset",
            loading: { ...state.loading, sendPasswordReset: false },
          }));
          return false;
        }
      },

      resetPassword: async (password: string): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, resetPassword: true },
          error: null,
        }));

        try {
          const { error } = await supabase.auth.updateUser({
            password,
          });

          if (error) {
            set((state) => ({
              error: error.message,
              loading: { ...state.loading, resetPassword: false },
            }));
            return false;
          }

          set((state) => ({
            loading: { ...state.loading, resetPassword: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Failed to reset password",
            loading: { ...state.loading, resetPassword: false },
          }));
          return false;
        }
      },

      deleteAccount: async (): Promise<boolean> => {
        set((state) => ({
          loading: { ...state.loading, deleteAccount: true },
          error: null,
        }));

        try {
          // Note: Supabase doesn't have a built-in delete user method in the client
          // This would typically require a server-side function
          // For now, we'll just sign out the user
          await get().signOut();

          set((state) => ({
            loading: { ...state.loading, deleteAccount: false },
            error: null,
          }));
          return true;
        } catch (error) {
          set((state) => ({
            error:
              error instanceof Error
                ? error.message
                : "Failed to delete account",
            loading: { ...state.loading, deleteAccount: false },
          }));
          return false;
        }
      },

      initialize: () => {
        if (get().initialized) return;

        // In mock mode, skip Supabase entirely and set a fake user
        if (IS_MOCK_MODE) {
          set({
            user: MOCK_USER,
            initialized: true,
            error: null,
          });
          return;
        }

        // Clean up existing subscription if any
        const { authSubscription } = get();
        if (authSubscription) {
          authSubscription.unsubscribe();
        }

        // Check for existing session immediately
        const checkInitialSession = async () => {
          try {
            const { data: sessionData, error } =
              await supabase.auth.getSession();

            if (!error && sessionData.session?.user) {
              const user: User = {
                id: sessionData.session.user.id,
                email: sessionData.session.user.email!,
                email_confirmed_at: sessionData.session.user.email_confirmed_at,
                created_at: sessionData.session.user.created_at,
                access_token: sessionData.session.access_token,
                refresh_token: sessionData.session.refresh_token,
                user_metadata: sessionData.session.user.user_metadata,
                app_metadata: sessionData.session.user.app_metadata,
              };

              set((state) => ({
                user,
                error: null,
                loading: {
                  ...state.loading,
                  googleOAuth: false,
                  appleOAuth: false,
                },
              }));
            }
          } catch (error) {
            console.error("Error checking initial session:", error);
          }
        };

        // Check initial session
        checkInitialSession();

        // Listen for auth changes and store subscription for cleanup
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange(
          (event: AuthChangeEvent, session: Session | null) => {
            if (session?.user?.email) {
              const user: User = {
                id: session.user.id,
                email: session.user.email,
                email_confirmed_at: session.user.email_confirmed_at,
                created_at: session.user.created_at,
                access_token: session.access_token,
                refresh_token: session.refresh_token,
                user_metadata: session.user.user_metadata,
                app_metadata: session.user.app_metadata,
              };
              set((state) => ({
                user,
                error: null,
                loading: {
                  ...state.loading,
                  googleOAuth: false,
                  appleOAuth: false,
                },
              }));
            } else if (event === "SIGNED_OUT") {
              set((state) => ({
                user: null,
                loading: {
                  ...state.loading,
                  googleOAuth: false,
                  appleOAuth: false,
                },
              }));
            }
          }
        );

        set({
          initialized: true,
          authSubscription: subscription,
        });
      },

      cleanup: () => {
        const { authSubscription } = get();
        if (authSubscription) {
          authSubscription.unsubscribe();
          set({ authSubscription: null });
        }
      },

      clearError: () => set({ error: null }),

      isAnyLoading: () => {
        const { loading } = get();
        return Object.values(loading).some((isLoading) => isLoading);
      },

      // Artivo-specific methods
      setUserType: async (userType: UserType): Promise<boolean> => {
        try {
          const { user } = get();
          if (!user) return false;

          const { error } = await supabase.auth.updateUser({
            data: {
              user_type: userType,
            },
          });

          if (error) {
            set({ error: error.message });
            return false;
          }

          // Update local state
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  user_type: userType,
                  user_metadata: {
                    ...state.user.user_metadata,
                    user_type: userType,
                  },
                }
              : null,
          }));

          return true;
        } catch (error) {
          set({ error: "Failed to set user type" });
          return false;
        }
      },

      completeOnboarding: async (): Promise<boolean> => {
        try {
          const { user } = get();
          if (!user) return false;

          const { error } = await supabase.auth.updateUser({
            data: {
              onboarding_completed: true,
            },
          });

          if (error) {
            set({ error: error.message });
            return false;
          }

          // Update local state
          set((state) => ({
            user: state.user
              ? {
                  ...state.user,
                  onboarding_completed: true,
                  user_metadata: {
                    ...state.user.user_metadata,
                    onboarding_completed: true,
                  },
                }
              : null,
          }));

          return true;
        } catch (error) {
          set({ error: "Failed to complete onboarding" });
          return false;
        }
      },

      getUserType: (): UserType | undefined => {
        const { user } = get();
        return user?.user_type || user?.user_metadata?.user_type;
      },

      isOnboardingComplete: (): boolean => {
        const { user } = get();
        return (
          user?.onboarding_completed ||
          user?.user_metadata?.onboarding_completed ||
          false
        );
      },
    }),
    {
      name: "auth-store",
      partialize: (state) => ({ user: state.user }),
    }
  )
);
