"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Mail,
  Lock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  X,
} from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [loginValue, setLoginValue] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [adminContacts, setAdminContacts] = useState([]);
  const { login } = useAuth();

  useEffect(() => {
    let isMounted = true;

    const loadAdminContacts = async () => {
      try {
        const response = await fetch("/api/auth/admin-details");
        const json = await response.json();
        if (isMounted && json?.success && Array.isArray(json.data)) {
          setAdminContacts(json.data);
        }
      } catch (fetchError) {
        console.error("Failed to fetch admin details", fetchError);
      }
    };

    loadAdminContacts();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!loginValue || !password) {
        setError("Login ID and password are required");
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }

      const result = await login(loginValue, password);

      if (!result.success) {
        setError(result.message || "Login failed");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center p-4 sm:p-6 bg-background selection:bg-indigo-500 selection:text-white">
      {/* Subtle Ambient Light (Clean & Minimal) */}
      <div className="absolute top-0 inset-x-0 h-96 bg-linear-to-b from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar Navigation */}
      <div className="w-full max-w-[410px] mb-4 flex items-center justify-between text-xs text-muted-foreground z-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </Link>
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground/80">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          System Active
        </span>
      </div>

      {/* Centered Login Card */}
      <Card className="w-full max-w-[410px] border border-border/80 bg-card/95 shadow-xl shadow-indigo-500/5 rounded-2xl relative z-10 overflow-hidden">
        {/* Sleek Top Accent Line */}
        <div className="h-1 w-full bg-linear-to-r from-indigo-500 via-indigo-600 to-purple-600" />

        <CardHeader className="pt-7 pb-4 px-6 text-center space-y-1.5">
          {/* Logo Mark */}
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-card border border-border/80 shadow-xs flex items-center justify-center p-2.5 mx-auto mb-2">
            <img
              src="/logo.png"
              alt="SCMS Pro Logo"
              className="w-full h-full object-contain"
            />
          </div>

          <CardTitle className="text-xl font-bold tracking-tight text-foreground">
            Sign in to SCMS Pro
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Enter your email or registration number to access your account
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 pb-7 space-y-4">
          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 rounded-xl text-xs">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <p className="flex-1 font-medium">{error}</p>
              <button
                type="button"
                onClick={() => setError("")}
                className="text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Login ID Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="login"
                className="text-xs font-semibold text-foreground flex items-center justify-between"
              >
                <span>Login ID</span>
                <span className="text-[10px] text-muted-foreground font-normal">
                  Email or Reg No
                </span>
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  id="login"
                  type="text"
                  placeholder="name@example.com or REG-1001"
                  value={loginValue}
                  onChange={(e) => setLoginValue(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 pl-9 pr-8 text-xs sm:text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                />
                {loginValue && !loading && (
                  <button
                    type="button"
                    onClick={() => setLoginValue("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title="Clear"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-foreground"
                >
                  Password
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full h-10 pl-9 pr-9 text-xs sm:text-sm bg-background border border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600 border-border focus:ring-indigo-500"
                />
                <span className="text-xs text-muted-foreground">
                  Remember this device
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 text-xs sm:text-sm font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs active:scale-[0.99] transition-all"
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Signing in...</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5">
                  <span>Sign In</span>
                  <ArrowRight className="h-4 w-4" />
                </span>
              )}
            </Button>
          </form>

          {/* Subtle Security Badge */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground/80 pt-2 border-t border-border/50">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>256-Bit Secure SSL Connection</span>
          </div>
        </CardContent>
      </Card>

      {/* Minimal Footer */}
      <p className="text-[11px] text-muted-foreground mt-4 text-center z-10">
        SCMS Pro • Educational Center Management System
      </p>
    </div>
  );
}
