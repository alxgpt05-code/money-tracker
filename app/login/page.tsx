import { AuthLogo } from "@/components/auth/auth-logo";
import { LoginForm } from "@/components/auth/login-form";
import { AuthShell } from "@/components/auth/auth-shell";

export default function LoginPage() {
  return (
    <AuthShell topActionLabel="Регистрация" topActionHref="/register">
      <section className="pb-10">
        <AuthLogo />
        <LoginForm />
      </section>
    </AuthShell>
  );
}
