/**
 * Environment variable validation utility
 * Ensures all required environment variables are set at application startup
 */

export interface EnvValidationRule {
  key: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export class EnvValidator {
  /**
   * Validates that all required environment variables are set
   * @param rules Array of validation rules
   * @throws Error with clear message indicating which env var is missing
   */
  static validate(rules: EnvValidationRule[]): void {
    const missing: string[] = [];
    const errors: { key: string; message: string }[] = [];

    rules.forEach((rule) => {
      const value = process.env[rule.key];

      if (!value && rule.required && !rule.defaultValue) {
        missing.push(rule.key);
        errors.push({
          key: rule.key,
          message: `Missing required environment variable: ${rule.key}\nDescription: ${rule.description}`,
        });
      }
    });

    if (errors.length > 0) {
      const errorMessages = errors.map((e) => `\n❌ ${e.message}`).join('');
      throw new Error(
        `\n${'='.repeat(70)}\nENVIRONMENT VALIDATION FAILED\n${'='.repeat(70)}${errorMessages}\n${'='.repeat(70)}`,
      );
    }
  }

  /**
   * Get environment variable with fallback and validation
   */
  static getEnv(key: string, defaultValue?: string): string | undefined {
    const value = process.env[key];
    return value || defaultValue;
  }

  /**
   * Get required environment variable or throw error
   */
  static getRequiredEnv(key: string, description: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(
        `\nMissing required environment variable: ${key}\nDescription: ${description}`,
      );
    }
    return value;
  }
}
