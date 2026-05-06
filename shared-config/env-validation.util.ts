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
          message: `Missing required env var: ${rule.key} (${rule.description})`,
        });
      }
    });

    if (errors.length > 0) {
      console.error('❌ ENV VALIDATION FAILED:');
      errors.forEach(err => console.error(` - ${err.message}`));
      if (process.env.NODE_ENV === 'production') {
        process.exit(1);
      }
    }
  }
}
