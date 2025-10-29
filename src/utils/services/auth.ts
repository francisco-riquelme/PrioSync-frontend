import { signUp, confirmSignUp, signIn, updatePassword } from "aws-amplify/auth";
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

export interface UpdatePasswordInput {
  oldPassword: string;
  newPassword: string;
}

export interface UpdatePasswordResult {
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
      // Map time slots to custom attributes with day information
      // IMPORTANT: Use camelCase attribute names that match backend
      const flat = input.timeSlots.flatMap((d) =>
        d.timeSlots.map((slot) => ({ ...slot, day: d.day }))
      );

      const customAttributes: Record<string, string> = {};

      // Add time slot attributes with day information (1-5 slots)
      if (flat[0]) {
        customAttributes["custom:firstSlotStart"] = flat[0].start;
        customAttributes["custom:firstSlotEnd"] = flat[0].end;
        customAttributes["custom:firstSlotDay"] = flat[0].day;
      }
      if (flat[1]) {
        customAttributes["custom:secondSlotStart"] = flat[1].start;
        customAttributes["custom:secondSlotEnd"] = flat[1].end;
        customAttributes["custom:secondSlotDay"] = flat[1].day;
      }
      if (flat[2]) {
        customAttributes["custom:thirdSlotStart"] = flat[2].start;
        customAttributes["custom:thirdSlotEnd"] = flat[2].end;
        customAttributes["custom:thirdSlotDay"] = flat[2].day;
      }
      if (flat[3]) {
        customAttributes["custom:fourthSlotStart"] = flat[3].start;
        customAttributes["custom:fourthSlotEnd"] = flat[3].end;
        customAttributes["custom:fourthSlotDay"] = flat[3].day;
      }
      if (flat[4]) {
        customAttributes["custom:fifthSlotStart"] = flat[4].start;
        customAttributes["custom:fifthSlotEnd"] = flat[4].end;
        customAttributes["custom:fifthSlotDay"] = flat[4].day;
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

  /**
   * Updates user's password while authenticated
   * @param input - Current and new password
   * @returns Promise with update result
   */
  async updatePassword(input: UpdatePasswordInput): Promise<UpdatePasswordResult> {
    try {
      // Validate new password strength
      const passwordValidation = this.validatePassword(input.newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: passwordValidation.message || 'Contraseña inválida',
        };
      }

      await updatePassword({
        oldPassword: input.oldPassword,
        newPassword: input.newPassword,
      });

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error al actualizar contraseña',
      };
    }
  },
};

export default authService;
