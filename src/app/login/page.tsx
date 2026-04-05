import Link from "next/link";
import { login, signup } from "./actions";

const errorMessages: Record<string, string> = {
  "invalid-email": "Enter a valid email address.",
  "invalid-password": "Enter your password.",
  "invalid-credentials": "Email or password is invalid."
};

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = resolvedSearchParams?.error
    ? errorMessages[resolvedSearchParams.error] ?? resolvedSearchParams.error
    : null;

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6 py-8">
      <section className="paper-panel rounded-[1.75rem] p-6 sm:p-7">
        <p className="kicker">Volunteer access</p>
        <h1 className="display-font mt-2 text-3xl font-semibold text-slate-900">Log in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">Use your email and password to continue your stampbook and apply to opportunities.</p>

        {errorMessage ? (
          <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-medium text-rose-800">{errorMessage}</p>
        ) : null}

        <form className="mt-6 flex flex-col gap-3">
          <input
            className="input-shell"
            name="email"
            type="email"
            placeholder="Email"
            required
          />
          <input
            className="input-shell"
            name="password"
            type="password"
            placeholder="Password"
            required
          />

          <div className="mt-2 flex flex-wrap gap-3">
            <button formAction={login} className="primary-action rounded-full px-4 py-2 text-sm font-semibold">
              Log In
            </button>
            <button formAction={signup} className="secondary-action rounded-full px-4 py-2 text-sm font-semibold">
              Sign Up
            </button>
            <button type="button" className="secondary-action rounded-full px-4 py-2 text-sm font-semibold">
              Forgot password
            </button>
          </div>
        </form>

        <p className="mt-4 text-sm text-slate-600">
          Are you an organization?{" "}
          <Link href="/org/login" className="font-semibold text-slate-900 underline decoration-2 underline-offset-4">
            Go to organization login
          </Link>
        </p>
      </section>
    </main>
  );
}