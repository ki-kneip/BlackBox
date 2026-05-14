import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Sign in — BlackBox" };

export default function LoginPage() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-white">Sign in</h1>
        <p className="mt-1 text-sm text-[#52525b]">Welcome back to BlackBox.</p>
      </div>
      <LoginForm />
    </div>
  );
}
