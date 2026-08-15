import { z } from "zod";
import type { CreateCustomerRequest } from "../api/customers-api";

/**
 * Aligned to CreateCustomerRequestDto's actual constraints (pos-cloud libs/control-plane/
 * customer-management/src/presentation/http/dto/create-customer.request.dto.ts and
 * .../domain/customer-code.ts). `code`'s pattern is stable, purely syntactic, and checkable locally
 * without inventing business behavior, so it's mirrored exactly here (not just length) - catching a
 * malformed code before submit is strictly better UX than a round-trip 400. The backend still has the
 * final say; this is a courtesy, not a re-implementation of its authority.
 */
const CUSTOMER_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{2,49}$/;
const CUSTOMER_CODE_MESSAGE =
  "Code must be 3-50 characters: letters, numbers, underscores, or hyphens, starting with a letter or number.";

export const createCustomerSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Code is required")
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(CUSTOMER_CODE_PATTERN, CUSTOMER_CODE_MESSAGE)),
  legalName: z
    .string()
    .trim()
    .min(2, "Legal name must be at least 2 characters")
    .max(200, "Legal name must be 200 characters or fewer"),
  tradeName: z.string().trim().max(200, "Trade name must be 200 characters or fewer").optional(),
});

export type CreateCustomerFormValues = z.infer<typeof createCustomerSchema>;

/** `code` arrives already trimmed + uppercased + pattern-validated by the schema itself. An empty or
 *  whitespace-only tradeName becomes undefined (not sent as "" or "   "), since the backend's own
 *  @Length(1, 200) rejects an empty string once the field is present at all - @IsOptional only skips
 *  undefined/null, and .trim() in the schema already reduces "   " to "" before this runs. */
export function toCreateCustomerRequest(values: CreateCustomerFormValues): CreateCustomerRequest {
  return {
    code: values.code,
    legalName: values.legalName,
    tradeName: values.tradeName ? values.tradeName : undefined,
  };
}
