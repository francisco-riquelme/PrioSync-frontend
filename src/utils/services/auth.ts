import { signUp, confirmSignUp, signIn } from "aws-amplify/auth";

export interface SignUpInput {
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface ConfirmSignUpInput {
  email: string;
  confirmationCode: string;
}

export interface SignInInput {
  email: string;
  password: string;
}

export interface SignUpResult {
  isSignUpComplete: boolean;
  userId: string | undefined;
  nextStep: unknown;
  success: boolean;
  error?: string;
}

export interface ConfirmSignUpResult {
  isSignUpComplete: boolean;
  nextStep: unknown;
  success: boolean;
  error?: string;
}

export interface SignInResult {
  isSignedIn: boolean;
  nextStep: unknown;
  success: boolean;
  error?: string;
}

export const authService = {
  /**
   * Creates a new user account using AWS Amplify Auth
   * @param input - User registration data
   * @returns Promise with signup result
   */
  async signUp(input: SignUpInput): Promise<SignUpResult> {
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

      return {
        isSignUpComplete,
        userId,
        nextStep,
        success: true,
      };
    } catch (error) {
      console.error("Sign up error:", error);

      return {
        isSignUpComplete: false,
        userId: undefined,
        nextStep: null,
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  },

  /**
   * Confirms a user's signup with the verification code
   * @param input - Email and confirmation code
   * @returns Promise with confirmation result
   */
  async confirmSignUp(input: ConfirmSignUpInput): Promise<ConfirmSignUpResult> {
    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: input.email,
        confirmationCode: input.confirmationCode,
      });

      return {
        isSignUpComplete,
        nextStep,
        success: true,
      };
    } catch (error) {
      console.error("Confirm sign up error:", error);

      return {
        isSignUpComplete: false,
        nextStep: null,
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  },

  /**
   * Signs in a user with email and password
   * @param input - Email and password
   * @returns Promise with sign in result
   */
  async signIn(input: SignInInput): Promise<SignInResult> {
    try {
      const { isSignedIn, nextStep } = await signIn({
        username: input.email,
        password: input.password,
      });

      return {
        isSignedIn,
        nextStep,
        success: true,
      };
    } catch (error) {
      console.error("Sign in error:", error);

      return {
        isSignedIn: false,
        nextStep: null,
        success: false,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  },

  /**
   * Validates email format
   * @param email - Email to validate
   * @returns boolean indicating if email is valid
   */
  validateEmail(email: string): boolean {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    return emailRegex.test(email);
  },

  /**
   * Validates password strength
   * @param password - Password to validate
   * @returns object with validation result and message
   */
  validatePassword(password: string): { isValid: boolean; message?: string } {
    if (password.length < 8) {
      return {
        isValid: false,
        message: "Password must be at least 8 characters long",
      };
    }

    if (!/(?=.*[a-z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one lowercase letter",
      };
    }

    if (!/(?=.*[A-Z])/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one uppercase letter",
      };
    }

    if (!/(?=.*\d)/.test(password)) {
      return {
        isValid: false,
        message: "Password must contain at least one number",
      };
    }

    return { isValid: true };
  },

  /**
   * Validates confirmation code format
   * @param code - Confirmation code to validate
   * @returns boolean indicating if code format is valid
   */
  validateConfirmationCode(code: string): boolean {
    return /^\d{6}$/.test(code);
  },
};

export default authService;
