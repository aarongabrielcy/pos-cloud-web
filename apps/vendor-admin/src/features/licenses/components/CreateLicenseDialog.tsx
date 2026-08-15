import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Dialog, FormField, Input, Select } from "@pos-cloud-web/ui";
import { useCreateLicense } from "../hooks/use-create-license";
import {
  createLicenseSchema,
  toCreateLicenseRequest,
  type CreateLicenseFormInput,
  type CreateLicenseFormValues,
} from "../schemas/create-license-schema";
import { apiErrorCorrelationId, apiErrorMessage } from "../../../shared/api/api-error-display";
import { CustomerPicker } from "./CustomerPicker";

export interface CreateLicenseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateLicenseFormInput = {
  customerId: "",
  licenseNumber: "",
  edition: "BASIC",
  validFrom: "",
  validUntil: "",
  maxInstallations: "",
};

/** react-hook-form + Zod, the same pattern CreateCustomerDialog established in WEB-01C. `licenseNumber`
 *  and `maxInstallations` both transform their raw input into a different output type, so useForm is
 *  given all three zodResolver generics (Input/Context/Output) - register()/errors below operate on
 *  the raw Input shape, while handleSubmit's callback receives the validated/transformed Output
 *  (CreateLicenseFormValues). Failure renders inline via Alert - never a toast. */
export function CreateLicenseDialog({ open, onOpenChange }: CreateLicenseDialogProps) {
  const createLicense = useCreateLicense();
  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateLicenseFormInput, unknown, CreateLicenseFormValues>({
    resolver: zodResolver(createLicenseSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const edition = watch("edition");

  // Clear the form and any stale mutation error when re-opening, adjusted during render rather than
  // in an Effect - same pattern CreateCustomerDialog/ConfirmDialog established.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      reset(DEFAULT_VALUES);
      createLicense.reset();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createLicense.mutateAsync(toCreateLicenseRequest(values));
      reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch {
      // Surfaced below via createLicense.error - nothing further to do here.
    }
  });

  const errorCorrelationId = apiErrorCorrelationId(createLicense.error);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New license">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {createLicense.error ? (
          <div className="flex flex-col gap-1">
            <Alert variant="danger">{apiErrorMessage(createLicense.error)}</Alert>
            {errorCorrelationId ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                Reference: {errorCorrelationId}
              </p>
            ) : null}
          </div>
        ) : null}

        <Controller
          name="customerId"
          control={control}
          render={({ field }) => (
            <CustomerPicker
              value={field.value}
              onChange={field.onChange}
              error={errors.customerId?.message}
            />
          )}
        />

        <FormField label="License number" error={errors.licenseNumber?.message}>
          <Input {...register("licenseNumber")} placeholder="LIC-GST-00001" autoComplete="off" />
        </FormField>

        <FormField label="Edition" error={errors.edition?.message}>
          <Select {...register("edition")}>
            <option value="BASIC">Basic (Perpetual)</option>
            <option value="PREMIUM">Premium (Subscription)</option>
          </Select>
        </FormField>

        <FormField label="Valid from" error={errors.validFrom?.message}>
          <Input type="date" {...register("validFrom")} />
        </FormField>

        {edition === "PREMIUM" ? (
          <FormField label="Valid until" error={errors.validUntil?.message}>
            <Input type="date" {...register("validUntil")} />
          </FormField>
        ) : null}

        <FormField label="Max installations" error={errors.maxInstallations?.message}>
          <Input type="number" min={1} step={1} {...register("maxInstallations")} />
        </FormField>

        <div className="mt-2 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Create
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
