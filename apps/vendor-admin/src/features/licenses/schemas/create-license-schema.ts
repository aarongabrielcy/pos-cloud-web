import { z } from "zod";
import type { CreateLicenseRequest } from "../api/licenses-api";

/**
 * Aligned to CreateLicenseRequestDto's actual constraints (pos-cloud libs/control-plane/licensing/
 * src/presentation/http/dto/create-license.request.dto.ts and .../domain/license-number.ts). The
 * DTO's own @ApiProperty description ("3-80 chars") is stale relative to the real enforced pattern -
 * the domain's `^[A-Z0-9][A-Z0-9_-]{4,79}$` mathematically requires 5-80 chars. Mirroring the real
 * regex here (not the stale doc string) follows the same precedent WEB-01C's technical validation
 * established for Customer `code`.
 */
const LICENSE_NUMBER_PATTERN = /^[A-Z0-9][A-Z0-9_-]{4,79}$/;
const LICENSE_NUMBER_MESSAGE =
  "License number must be 5-80 characters: letters, numbers, underscores, or hyphens, starting with a letter or number.";

const EDITIONS = ["BASIC", "PREMIUM"] as const;

/**
 * Edition and licenseModel are not independently combinable server-side - License.create only
 * accepts BASIC+PERPETUAL or PREMIUM+SUBSCRIPTION, rejecting any other pairing with a 400
 * InvalidLicenseEditionModelError (pos-cloud .../domain/license.ts, validateEditionModel). Presenting
 * a single "edition" choice here - instead of two independent selects that could produce a
 * guaranteed-invalid combination - reflects that confirmed constraint directly; licenseModel is
 * derived in toCreateLicenseRequest, never asked for on the form. Likewise PERPETUAL requires
 * validUntil to be null and SUBSCRIPTION requires it to be set (and after validFrom) - so "Valid
 * until" is only required/shown for a PREMIUM (subscription) license.
 */
export const createLicenseSchema = z
  .object({
    customerId: z.string().uuid("Select a customer"),
    licenseNumber: z
      .string()
      .trim()
      .min(1, "License number is required")
      .transform((value) => value.toUpperCase())
      .pipe(z.string().regex(LICENSE_NUMBER_PATTERN, LICENSE_NUMBER_MESSAGE)),
    edition: z.enum(EDITIONS),
    validFrom: z.string().min(1, "Valid from is required"),
    validUntil: z.string().optional(),
    // A native <input type="number"> always yields a string via onChange - validated/converted as a
    // string->number transform (same input/output-divergence pattern as licenseNumber's uppercase
    // transform above), not `z.coerce.number()`, which types its input as `unknown` and doesn't fit
    // cleanly through zodResolver's Input/Output generics for a single object schema field.
    maxInstallations: z
      .string()
      .trim()
      .min(1, "Max installations is required")
      .regex(/^\d+$/, "Max installations must be a whole number")
      .transform(Number)
      .pipe(z.number().min(1, "Max installations must be at least 1")),
  })
  .superRefine((values, ctx) => {
    if (values.edition !== "PREMIUM") return;
    if (!values.validUntil) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validUntil"],
        message: "Valid until is required for Premium (subscription) licenses.",
      });
      return;
    }
    if (new Date(values.validUntil).getTime() <= new Date(values.validFrom).getTime()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["validUntil"],
        message: "Valid until must be after valid from.",
      });
    }
  });

// licenseNumber/maxInstallations both transform their raw string input into a different output type
// (uppercased-and-validated string / number), so the form's INPUT shape (what register() binds to)
// and OUTPUT shape (what handleSubmit's callback receives) genuinely diverge - CreateLicenseDialog
// wires these into useForm's 3-generic signature accordingly (see zodResolver's own Input/Output/
// Context generics).
export type CreateLicenseFormInput = z.input<typeof createLicenseSchema>;
export type CreateLicenseFormValues = z.output<typeof createLicenseSchema>;

function toIsoDateTime(dateOnly: string): string {
  return `${dateOnly}T00:00:00.000Z`;
}

/** `licenseNumber` arrives already trimmed + uppercased + pattern-validated, and `maxInstallations`
 *  already converted to a real number, by the schema itself. licenseModel is derived from edition
 *  (see schema doc comment above), and validUntil is sent as null for a Basic/Perpetual license
 *  (matching the DTO's own "@example null") or as a real date for a Premium/Subscription one. */
export function toCreateLicenseRequest(values: CreateLicenseFormValues): CreateLicenseRequest {
  return {
    customerId: values.customerId,
    licenseNumber: values.licenseNumber,
    edition: values.edition,
    licenseModel: values.edition === "BASIC" ? "PERPETUAL" : "SUBSCRIPTION",
    validFrom: toIsoDateTime(values.validFrom),
    validUntil: values.edition === "PREMIUM" ? toIsoDateTime(values.validUntil ?? "") : null,
    maxInstallations: values.maxInstallations,
  };
}
