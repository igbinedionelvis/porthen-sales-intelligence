import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../app/store/auth-store";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";

export function AuthPage() {
  const navigate = useNavigate();

  const { signIn, signUp, isAuthenticated } = useAuthStore();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);

    try {
      if (mode === "signup") {
        await signUp(fullName, email, password);
        setMessage(
          "Account created. Check your inbox for a confirmation link before signing in.",
        );
      } else {
        await signIn(email, password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <Card className="w-full max-w-md space-y-6 p-8">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Porthen
          </p>

          <h1 className="mt-2 text-2xl font-semibold text-slate-100">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            {mode === "signin"
              ? "Sign in to access your workspace."
              : "Get started with your personal workspace."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="mb-2 block text-sm text-slate-300">
                Full name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
                placeholder="Your name"
              />
            </div>
          )}

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-slate-300">
              Password
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="At least 6 characters"
            />
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}

          {message && <p className="text-sm text-emerald-400">{message}</p>}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </Button>
        </form>

        <p className="text-center text-sm text-slate-400">
          {mode === "signin"
            ? "Don't have an account?"
            : "Already have an account?"}{" "}
          <button
            type="button"
            className="font-medium text-cyan-400 hover:text-cyan-300"
            onClick={() => {
              setMode(mode === "signin" ? "signup" : "signin");
              setError("");
              setMessage("");
            }}
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </p>
      </Card>
    </div>
  );
}
