/**
 * Environment variable validation utility - Shared across all services
 */

export interface EnvValidationRule {
  key: string;
  required: boolean;
  defaultValue?: string;
  description: string;
}

export class EnvValidator {
  static validate(rules: EnvValidationRule[]): void {
    const errors: { key: string; message: string }[] = [];
    rules.forEach((rule) => {
      const value = process.env[rule.key];
      if (!value && rule.required && !rule.defaultValue) {
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

  static getEnv(key: string, defaultValue?: string): string | undefined {
    return process.env[key] || defaultValue;
  }

  static getRequiredEnv(key: string, description: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`\nMissing required environment variable: ${key}\nDescription: ${description}`);
    }
    return value;
  }
}
