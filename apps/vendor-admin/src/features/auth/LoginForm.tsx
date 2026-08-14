import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Alert, Button, FormField, Input } from "@pos-cloud-web/ui";
import { useAuth } from "@pos-cloud-web/auth";

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

/** Generic "Invalid email or password" for any auth failure - never distinguishes suspended, locked,
 *  unknown-user or wrong-password (WEB-01A#23, matches the backend's own INVALID_CREDENTIALS which
 *  is deliberately generic for the same reason: don't leak account existence/state to an attacker). */
const GENERIC_LOGIN_ERROR = "Invalid email or password.";

export function LoginForm() {
  const { login } = useAuth();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      await login(values.email, values.password);
      reset();
    } catch {
      setSubmitError(GENERIC_LOGIN_ERROR);
    }
  });

  return (
    <form onSubmit={onSubmit} noValidate className="flex w-full max-w-sm flex-col gap-4">
      {submitError ? <Alert variant="danger">{submitError}</Alert> : null}

      <FormField label="Email" error={errors.email?.message}>
        <Input type="email" autoComplete="username" {...register("email")} />
      </FormField>

      <FormField label="Password" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...register("password")} />
      </FormField>

      <Button type="submit" isLoading={isSubmitting} className="w-full">
        Sign in
      </Button>
    </form>
  );
}
