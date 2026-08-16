import { z } from "zod";
import type { CreateInstallationRequest } from "../api/installations-api";

/**
 * Aligned to CreateInstallationRequestDto's actual constraints (pos-cloud libs/control-plane/
 * installations/src/presentation/http/dto/create-installation.request.dto.ts and .../domain/
 * installation-code.ts). Same stale-doc-comment situation confirmed for Customer/License codes: the
 * domain's `^[A-Z0-9][A-Z0-9_-]{4,79}$` mathematically requires 5-80 chars, not the DTO doc's "3-80".
 */
const INSTALLATION_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_-]{4,79}$/;
const INSTALLATION_CODE_MESSAGE =
  "Installation code must be 5-80 characters: letters, numbers, underscores, or hyphens, starting with a letter or number.";

const PLATFORMS = ["WINDOWS", "ANDROID", "IOS"] as const;

export const createInstallationSchema = z.object({
  customerId: z.string().uuid("Select a customer"),
  licenseId: z.string().uuid("Select a license"),
  installationCode: z
    .string()
    .trim()
    .min(1, "Installation code is required")
    .transform((value) => value.toUpperCase())
    .pipe(z.string().regex(INSTALLATION_CODE_PATTERN, INSTALLATION_CODE_MESSAGE)),
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(200, "Name must be 200 characters or fewer"),
  platform: z.enum(PLATFORMS),
});

export type CreateInstallationFormValues = z.output<typeof createInstallationSchema>;
export type CreateInstallationFormInput = z.input<typeof createInstallationSchema>;

/** `installationCode` arrives already trimmed + uppercased + pattern-validated by the schema itself. */
export function toCreateInstallationRequest(
  values: CreateInstallationFormValues,
): CreateInstallationRequest {
  return {
    customerId: values.customerId,
    licenseId: values.licenseId,
    installationCode: values.installationCode,
    name: values.name,
    platform: values.platform,
  };
}
