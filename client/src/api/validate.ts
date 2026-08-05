import type { ZodSchema, ZodIssue } from 'zod';

/**
 * Custom error class for contract validation failures.
 * Includes field path and expected type information.
 */
export class ContractValidationError extends Error {
  public readonly issues: ZodIssue[];

  constructor(message: string, issues: ZodIssue[]) {
    super(`Contract validation failed: ${message}`);
    this.name = 'ContractValidationError';
    this.issues = issues;
  }
}

/**
 * Validates response data against a Zod schema.
 * Uses safeParse() for descriptive error messages.
 * 
 * @param data - The response data to validate
 * @param schema - The Zod schema to validate against
 * @returns The validated and typed data
 * @throws ContractValidationError if validation fails
 */
export function validateResponse<T>(data: unknown, schema: ZodSchema<T>): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const issue = result.error.issues[0];
    const fieldPath = issue.path.join('.') || 'root';
    const message = `Field '${fieldPath}' - ${issue.message}`;
    
    throw new ContractValidationError(message, result.error.issues);
  }
  
  return result.data;
}
