import { signUp, confirmSignUp, signIn } from "aws-amplify/auth";
import { DaySchedule } from "@/components/modals/welcome/types";

export interface SignUpInput {
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface SignUpWithStudyPreferencesInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  timeSlots: DaySchedule[];
  playlistUrl?: string;
  areaOfInterest?: string;
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

export interface SignUpWithStudyPreferencesResult {
  isSignUpComplete: boolean;
  userId?: string;
  nextStep?: unknown;
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
   * Creates a new user account with study preferences and custom attributes
   * @param input - User registration data with study preferences
   * @returns Promise with signup result
   */
  async signUpWithStudyPreferences(
    input: SignUpWithStudyPreferencesInput
  ): Promise<SignUpWithStudyPreferencesResult> {
    try {
      // Extract time slots from schedule and map to custom attributes
      const timeSlots = input.timeSlots
        .flatMap((day) => day.timeSlots)
        .slice(0, 5); // Take up to 5 slots

      // Map time slots to custom attributes (only include slots that exist)
      // IMPORTANT: Use camelCase attribute names that match backend
      const flat = input.timeSlots.flatMap((d) => d.timeSlots);

      const customAttributes: Record<string, string> = {};

      // Add time slot attributes only for slots that exist (1-5 slots)
      if (flat[0]) {
        customAttributes["custom:firstSlotStart"] = flat[0].start;
        customAttributes["custom:firstSlotEnd"] = flat[0].end;
      }
      if (flat[1]) {
        customAttributes["custom:secondSlotStart"] = flat[1].start;
        customAttributes["custom:secondSlotEnd"] = flat[1].end;
      }
      if (flat[2]) {
        customAttributes["custom:thirdSlotStart"] = flat[2].start;
        customAttributes["custom:thirdSlotEnd"] = flat[2].end;
      }
      if (flat[3]) {
        customAttributes["custom:fourthSlotStart"] = flat[3].start;
        customAttributes["custom:fourthSlotEnd"] = flat[3].end;
      }
      if (flat[4]) {
        customAttributes["custom:fifthSlotStart"] = flat[4].start;
        customAttributes["custom:fifthSlotEnd"] = flat[4].end;
      }

      // Add optional attributes
      if (input.areaOfInterest) {
        customAttributes["custom:areaOfInterest"] = input.areaOfInterest;
      }
      if (input.playlistUrl) {
        customAttributes["custom:playlistUrl"] = input.playlistUrl;
      }

      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: input.email,
        password: input.password,
        options: {
          userAttributes: {
            email: input.email,
            given_name: input.firstName,
            family_name: input.lastName,
            ...customAttributes,
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
      console.error("Sign up with study preferences error:", error);

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
