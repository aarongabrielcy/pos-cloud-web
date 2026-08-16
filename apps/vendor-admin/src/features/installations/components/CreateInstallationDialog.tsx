import { useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Alert, Button, Dialog, FormField, Input, Select } from "@pos-cloud-web/ui";
import { useCreateInstallation } from "../hooks/use-create-installation";
import {
  createInstallationSchema,
  toCreateInstallationRequest,
  type CreateInstallationFormValues,
} from "../schemas/create-installation-schema";
import { apiErrorCorrelationId, apiErrorMessage } from "../../../shared/api/api-error-display";
import { CustomerPicker } from "../../licenses/components/CustomerPicker";
import { LicensePicker } from "./LicensePicker";

export interface CreateInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_VALUES: CreateInstallationFormValues = {
  customerId: "",
  licenseId: "",
  installationCode: "",
  name: "",
  platform: "WINDOWS",
};

/** react-hook-form + Zod, the same pattern CreateCustomerDialog/CreateLicenseDialog established.
 *  Customer -> eligible License is a real dependent-field relationship (WEB-01E brief §25): picking
 *  a new customer always clears any previously-selected license, since a license eligible for one
 *  customer is never eligible for another (LicensePicker itself only shows the selected customer's
 *  own licenses). Uses `useWatch` (not the bare `watch()` API) per WEB-01E brief §49 to avoid the
 *  known non-blocking React Compiler warning already accepted on CreateLicenseDialog. */
export function CreateInstallationDialog({ open, onOpenChange }: CreateInstallationDialogProps) {
  const createInstallation = useCreateInstallation();
  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateInstallationFormValues>({
    resolver: zodResolver(createInstallationSchema),
    defaultValues: DEFAULT_VALUES,
  });
  const customerId = useWatch({ control, name: "customerId" });

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      reset(DEFAULT_VALUES);
      createInstallation.reset();
    }
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      await createInstallation.mutateAsync(toCreateInstallationRequest(values));
      reset(DEFAULT_VALUES);
      onOpenChange(false);
    } catch {
      // Surfaced below via createInstallation.error - nothing further to do here.
    }
  });

  const errorCorrelationId = apiErrorCorrelationId(createInstallation.error);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New installation">
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        {createInstallation.error ? (
          <div className="flex flex-col gap-1">
            <Alert variant="danger">{apiErrorMessage(createInstallation.error)}</Alert>
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
              onChange={(nextCustomerId) => {
                field.onChange(nextCustomerId);
                setValue("licenseId", "");
              }}
              error={errors.customerId?.message}
            />
          )}
        />

        <Controller
          name="licenseId"
          control={control}
          render={({ field }) => (
            <LicensePicker
              customerId={customerId ?? ""}
              value={field.value}
              onChange={field.onChange}
              error={errors.licenseId?.message}
            />
          )}
        />

        <FormField label="Installation code" error={errors.installationCode?.message}>
          <Input {...register("installationCode")} placeholder="POS-GST-00001" autoComplete="off" />
        </FormField>

        <FormField label="Name" error={errors.name?.message}>
          <Input {...register("name")} placeholder="Sucursal Principal" />
        </FormField>

        <FormField label="Platform" error={errors.platform?.message}>
          <Select {...register("platform")}>
            <option value="WINDOWS">Windows</option>
            <option value="ANDROID">Android</option>
            <option value="IOS">iOS</option>
          </Select>
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
