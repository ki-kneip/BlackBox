import { RegisterForm } from "@/components/auth/register-form";

export const metadata = { title: "Create account — BlackBox" };

export default function RegisterPage() {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-xl font-semibold tracking-tight text-white">Create account</h1>
        <p className="mt-1 text-sm text-[#52525b]">Start logging in seconds.</p>
      </div>
      <RegisterForm />
    </div>
  );
}
