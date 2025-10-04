"use client";

import { useState, useEffect } from "react";
import {
  signUp,
  signIn,
  confirmSignUp,
  resetPassword,
  confirmResetPassword,
  signOut,
  getCurrentUser,
  fetchAuthSession,
  type ConfirmResetPasswordInput,
} from "aws-amplify/auth";
import { logger } from "@/utils/commons/log";

// ============= Types =============

export interface UseAuthRegisterInput {
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface UseAuthLoginInput {
  email: string;
  password: string;
}

export interface UseAuthValidateInput {
  email: string;
  confirmationCode: string;
}

export interface UseAuthResetPasswordInput {
  email: string;
}

export interface UseAuthConfirmResetPasswordInput {
  email: string;
  confirmationCode: string;
  newPassword: string;
}

export interface AuthState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

export interface CurrentUser {
  userId: string;
  username: string;
  email?: string;
}

export interface AuthSessionState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CurrentUser | null;
}

export interface UseAuthReturn {
  // Register
  registerState: AuthState;
  register: (input: UseAuthRegisterInput) => Promise<{
    success: boolean;
    isSignUpComplete: boolean;
    userId?: string;
    error?: string;
  }>;

  // Login
  loginState: AuthState;
  login: (input: UseAuthLoginInput) => Promise<{
    success: boolean;
    isSignedIn: boolean;
    error?: string;
  }>;

  // Validate Account
  validateState: AuthState;
  validateAccount: (input: UseAuthValidateInput) => Promise<{
    success: boolean;
    isSignUpComplete: boolean;
    error?: string;
  }>;

  // Change Password (Reset Password Flow)
  resetPasswordState: AuthState;
  requestPasswordReset: (input: UseAuthResetPasswordInput) => Promise<{
    success: boolean;
    codeDeliveryDetails?: unknown;
    error?: string;
  }>;

  confirmPasswordResetState: AuthState;
  confirmPasswordReset: (input: UseAuthConfirmResetPasswordInput) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Auth Session
  authSession: AuthSessionState;
  checkAuthStatus: () => Promise<boolean>;
  logout: () => Promise<void>;

  // Clear functions
  clearRegisterError: () => void;
  clearLoginError: () => void;
  clearValidateError: () => void;
  clearResetPasswordError: () => void;
  clearConfirmPasswordResetError: () => void;
}

// ============= Hook =============

export function useAuth(): UseAuthReturn {
  // Register state
  const [registerState, setRegisterState] = useState<AuthState>({
    loading: false,
    error: null,
    success: false,
  });

  // Login state
  const [loginState, setLoginState] = useState<AuthState>({
    loading: false,
    error: null,
    success: false,
  });

  // Validate state
  const [validateState, setValidateState] = useState<AuthState>({
    loading: false,
    error: null,
    success: false,
  });

  // Reset password state
  const [resetPasswordState, setResetPasswordState] = useState<AuthState>({
    loading: false,
    error: null,
    success: false,
  });

  // Confirm password reset state
  const [confirmPasswordResetState, setConfirmPasswordResetState] =
    useState<AuthState>({
      loading: false,
      error: null,
      success: false,
    });

  // Auth session state
  const [authSession, setAuthSession] = useState<AuthSessionState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
  });

  // ============= Check Auth Status =============
  const checkAuthStatus = async (): Promise<boolean> => {
    setAuthSession((prev) => ({ ...prev, isLoading: true }));

    try {
      const session = await fetchAuthSession();

      if (session.tokens) {
        const user = await getCurrentUser();

        logger.info("user", user);

        setAuthSession({
          isAuthenticated: true,
          isLoading: false,
          user: {
            userId: user.userId,
            username: user.username,
            email: user.signInDetails?.loginId,
          },
        });

        return true;
      } else {
        setAuthSession({
          isAuthenticated: false,
          isLoading: false,
          user: null,
        });

        return false;
      }
    } catch (error) {
      console.error("Error checking auth status:", error);
      setAuthSession({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });

      return false;
    }
  };

  // ============= Logout =============
  const logout = async (): Promise<void> => {
    try {
      await signOut();
      setAuthSession({
        isAuthenticated: false,
        isLoading: false,
        user: null,
      });
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // ============= Register =============
  const register = async (input: UseAuthRegisterInput) => {
    setRegisterState({ loading: true, error: null, success: false });

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: input.email,
        password: input.password,
        options: {
          userAttributes: {
            email: input.email,
            ...(input.phoneNumber && { phone_number: input.phoneNumber }),
          },
        },
      });

      setRegisterState({ loading: false, error: null, success: true });

      return {
        success: true,
        isSignUpComplete,
        userId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Registration failed";
      setRegisterState({ loading: false, error: errorMessage, success: false });

      return {
        success: false,
        isSignUpComplete: false,
        error: errorMessage,
      };
    }
  };

  // ============= Login =============
  const login = async (input: UseAuthLoginInput) => {
    setLoginState({ loading: true, error: null, success: false });

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: input.email,
        password: input.password,
      });

      setLoginState({ loading: false, error: null, success: true });

      // Update auth session after successful login
      if (isSignedIn) {
        await checkAuthStatus();
      }

      return {
        success: true,
        isSignedIn,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Login failed";
      setLoginState({ loading: false, error: errorMessage, success: false });

      return {
        success: false,
        isSignedIn: false,
        error: errorMessage,
      };
    }
  };

  // ============= Validate Account =============
  const validateAccount = async (input: UseAuthValidateInput) => {
    setValidateState({ loading: true, error: null, success: false });

    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: input.email,
        confirmationCode: input.confirmationCode,
      });

      setValidateState({ loading: false, error: null, success: true });

      return {
        success: true,
        isSignUpComplete,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Validation failed";
      setValidateState({ loading: false, error: errorMessage, success: false });

      return {
        success: false,
        isSignUpComplete: false,
        error: errorMessage,
      };
    }
  };

  // ============= Request Password Reset =============
  const requestPasswordReset = async (input: UseAuthResetPasswordInput) => {
    setResetPasswordState({ loading: true, error: null, success: false });

    try {
      const output = await resetPassword({
        username: input.email,
      });

      setResetPasswordState({ loading: false, error: null, success: true });

      return {
        success: true,
        codeDeliveryDetails: output.nextStep.codeDeliveryDetails,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Password reset request failed";
      setResetPasswordState({
        loading: false,
        error: errorMessage,
        success: false,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // ============= Confirm Password Reset =============
  const confirmPasswordReset = async (
    input: UseAuthConfirmResetPasswordInput
  ) => {
    setConfirmPasswordResetState({
      loading: true,
      error: null,
      success: false,
    });

    try {
      await confirmResetPassword({
        username: input.email,
        confirmationCode: input.confirmationCode,
        newPassword: input.newPassword,
      });

      setConfirmPasswordResetState({
        loading: false,
        error: null,
        success: true,
      });

      return {
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Password reset confirmation failed";
      setConfirmPasswordResetState({
        loading: false,
        error: errorMessage,
        success: false,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }
  };

  // ============= Clear Error Functions =============
  const clearRegisterError = () => {
    setRegisterState((prev) => ({ ...prev, error: null }));
  };

  const clearLoginError = () => {
    setLoginState((prev) => ({ ...prev, error: null }));
  };

  const clearValidateError = () => {
    setValidateState((prev) => ({ ...prev, error: null }));
  };

  const clearResetPasswordError = () => {
    setResetPasswordState((prev) => ({ ...prev, error: null }));
  };

  const clearConfirmPasswordResetError = () => {
    setConfirmPasswordResetState((prev) => ({ ...prev, error: null }));
  };

  // ============= Check Auth on Mount =============
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // ============= Return =============
  return {
    // Register
    registerState,
    register,

    // Login
    loginState,
    login,

    // Validate
    validateState,
    validateAccount,

    // Reset Password
    resetPasswordState,
    requestPasswordReset,

    // Confirm Password Reset
    confirmPasswordResetState,
    confirmPasswordReset,

    // Auth Session
    authSession,
    checkAuthStatus,
    logout,

    // Clear errors
    clearRegisterError,
    clearLoginError,
    clearValidateError,
    clearResetPasswordError,
    clearConfirmPasswordResetError,
  };
}
