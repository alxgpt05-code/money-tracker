import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <AuthShell topActionLabel="Вход" topActionHref="/login">
      <section className="pb-10">
        <RegisterForm />
      </section>
    </AuthShell>
  );
}
