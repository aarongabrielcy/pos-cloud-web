import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Dialog, FormField, Input } from "@pos-cloud-web/ui";
import { useCreateCustomer } from "../hooks/use-create-customer";
import {
  createCustomerSchema,
  toCreateCustomerRequest,
  type CreateCustomerFormValues,
} from "../schemas/create-customer-schema";
import { apiErrorCorrelationId, apiErrorMessage } from "../../../shared/api/api-error-display";

export interface CreateCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** react-hook-form + Zod, the exact pattern LoginForm established in WEB-01A (docs/conventions.md#
 *  forms-and-confirmations). Failure renders inline via Alert - never a toast. */
export function CreateCustomerDialog({ open, onOpenChange }: CreateCustomerDialogProps) {
  const createCustomer = useCreateCustomer();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateCustomerFormValues>({ resolver: zodResolver(createCustomerSchema) });

  // Clear the form and any stale mutation error when re-opening, adjusted during render rather than
  // in an Effect - same pattern @pos-cloud-web/ui's ConfirmDialog established in WEB-01B.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      reset();
      createCustomer.reset();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createCustomer.mutateAsync(toCreateCustomerRequest(values));
      reset();
      onOpenChange(false);
    } catch {
      // Surfaced below via createCustomer.error - nothing further to do here.
    }
  });

  const errorCorrelationId = apiErrorCorrelationId(createCustomer.error);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New customer">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {createCustomer.error ? (
          <div className="flex flex-col gap-1">
            <Alert variant="danger">{apiErrorMessage(createCustomer.error)}</Alert>
            {errorCorrelationId ? (
              <p className="text-xs text-[var(--color-text-muted)]">
                Reference: {errorCorrelationId}
              </p>
            ) : null}
          </div>
        ) : null}

        <FormField label="Code" error={errors.code?.message}>
          <Input {...register("code")} placeholder="GST-MX" autoComplete="off" />
        </FormField>
        <FormField label="Legal name" error={errors.legalName?.message}>
          <Input {...register("legalName")} placeholder="GS Trackme S.A. de C.V." />
        </FormField>
        <FormField label="Trade name" error={errors.tradeName?.message}>
          <Input {...register("tradeName")} placeholder="GS Trackme" />
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
