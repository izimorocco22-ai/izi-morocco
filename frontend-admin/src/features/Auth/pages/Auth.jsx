import { useState, useEffect } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Map,
  ShieldCheck,
  Ticket,
  Users,
} from "lucide-react";
import logo from "../../../assets/logo.png";
import { callAPI } from "../../../services/callApi";
import useNavigateTo from "../../../hooks/useNavigateTo";
import { mapFieldErrors } from "../../../utils/error";
import { apiResponseType } from "../../../utils/types";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { ROUTES } from "../../../routes/helper";
import { verifyAuth } from "../../../slices/usersSlice";

// Moroccan zellige star, tiled as a faint background pattern
const ZELLIGE_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96' viewBox='0 0 96 96'%3E%3Cg fill='none' stroke='%23f4d35e' stroke-width='1.5'%3E%3Cpath d='M48 8 L59 37 L88 48 L59 59 L48 88 L37 59 L8 48 L37 37 Z'/%3E%3Crect x='29' y='29' width='38' height='38' transform='rotate(45 48 48)'/%3E%3Ccircle cx='48' cy='48' r='7'/%3E%3C/g%3E%3C/svg%3E\")";

const FEATURES = [
  { icon: Map, title: "Games & puzzles", text: "Design treasure hunts, checkpoints and tasks" },
  { icon: Ticket, title: "Activation codes", text: "Generate and track codes in batches" },
  { icon: Users, title: "Players & teams", text: "Follow players, teams and their results" },
];

// Field errors arrive either as plain strings or as { message }
const errorText = (errors, field) => {
  const e = errors?.[field];
  return typeof e === "string" ? e : e?.message;
};

export default function Auth() {
  const initialFormData = { email: "", password: "", errors: null };
  const [formData, setFormData] = useState(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { verifyAuthApi } = useSelector((state) => state.user);

  const goTo = useNavigateTo();
  const dispatch = useDispatch();


  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await callAPI("/auth/login", {
        method: "POST",
        data: {
          email: formData.email,
          password: formData.password,
        },
        suppressError: true,
      });
      if (response && !response.error && response.data?.success) {
        // Save access token to localStorage so subsequent API calls include it
        const accessToken = response?.data?.response?.accessToken || response?.data?.response?.accessToken;
        if (accessToken) {
          try {
            localStorage.setItem("accessToken", accessToken);
          } catch (e) {
            console.warn("Unable to persist access token to localStorage", e);
          }
        }

        setFormData(initialFormData);
        const redirectUrl = ROUTES.DASHBOARD;
        // dispatch verifyAuth after storing token so callAPI can attach it
        dispatch(verifyAuth()).then(() => goTo(redirectUrl));

      } else {
        console.log("Login failed:", response);
        const errors = mapFieldErrors(response);
        setFormData((prev) => ({
          ...prev,
          errors,
        }));
      }
    } catch (error) {
      console.error("Login error:", error);
      setFormData((prev) => ({
        ...prev,
        errors: { general: "Login failed. Please try again." },
      }));
    }
    setIsLoading(false);
  };

  const handleChange = (field, val) => {
    // Editing a field clears its error
    setFormData(prev => ({
      ...prev,
      [field]: val,
      errors: prev.errors ? { ...prev.errors, [field]: undefined } : prev.errors,
    }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  useEffect(() => {
    let toastId;
    if (verifyAuthApi.status === apiResponseType.pending) {
      toastId = toast.loading("Verifying authentication...");
    }
    else if (verifyAuthApi.status === apiResponseType.success) {
      toast.dismiss(toastId);
      goTo("/dashboard", { replace: true });
    }
    else {
      toast.dismiss(toastId);
      goTo("/auth", { replace: true });
    }
  }, [verifyAuthApi.status])

  const emailError = errorText(formData.errors, "email");
  const passwordError = errorText(formData.errors, "password");
  const inputBase =
    "w-full rounded-xl border bg-white/80 py-3 pl-11 text-[15px] text-primary placeholder:text-gray-400 outline-none transition focus:bg-white focus:ring-4 disabled:opacity-60";

  return (
    <div className="min-h-screen w-full flex bg-[#fffaf0]">
      {/* Brand panel */}
      <aside
        className="relative hidden lg:flex lg:w-1/2 flex-col justify-between overflow-hidden p-12 xl:p-16 text-white"
        style={{ background: "linear-gradient(160deg, #0d3b66 0%, #0a2c4d 55%, #071f36 100%)" }}
      >
        <div
          className="absolute inset-0 opacity-[0.12]"
          style={{
            backgroundImage: ZELLIGE_PATTERN,
            backgroundSize: "96px 96px",
            maskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.5) 60%, transparent 100%)",
          }}
        />
        {/* Sunset glow */}
        <div
          className="absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full blur-3xl opacity-60"
          style={{ background: "radial-gradient(circle, #f95738 0%, #ee964b 45%, transparent 70%)" }}
        />
        {/* Treasure trail */}
        <svg
          className="absolute bottom-24 left-0 w-full h-56 opacity-50"
          viewBox="0 0 600 220"
          fill="none"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M-10 190 C 90 120, 160 210, 250 140 S 390 40, 450 105 S 520 150, 548 78"
            stroke="#f4d35e"
            strokeWidth="2.5"
            strokeDasharray="2 12"
            strokeLinecap="round"
          />
          <g stroke="#f95738" strokeWidth="4" strokeLinecap="round">
            <path d="M548 54 L572 78" />
            <path d="M572 54 L548 78" />
          </g>
        </svg>

        <div className="relative animate-in fade-in slide-in-from-left-4 duration-700">
          <p className="text-xs font-semibold tracking-[0.3em] text-secondary">
            IZI MOROCCO · ADMIN
          </p>
        </div>

        <div className="relative max-w-lg animate-in fade-in slide-in-from-bottom-6 duration-700">
          <h2 className="text-4xl xl:text-5xl font-extrabold leading-tight">
            Craft unforgettable{" "}
            <span className="bg-gradient-to-r from-secondary to-[#ee964b] bg-clip-text text-transparent">
              treasure hunts
            </span>{" "}
            across Morocco.
          </h2>
          <p className="mt-4 text-lg text-white/70 tracking-wide">
            Locate · Play · Victory
          </p>

          <ul className="mt-10 space-y-4">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
                  <feature.icon className="h-5 w-5 text-secondary" />
                </span>
                <span>
                  <span className="block font-semibold">{feature.title}</span>
                  <span className="block text-sm text-white/60">{feature.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-sm text-white/50">
          © {new Date().getFullYear()} IZI Morocco
        </p>
      </aside>

      {/* Form panel */}
      <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-12">
        <div
          className="absolute inset-0 opacity-[0.07] lg:hidden"
          style={{ backgroundImage: ZELLIGE_PATTERN.replace("%23f4d35e", "%23f95738"), backgroundSize: "96px 96px" }}
        />
        <div
          className="absolute -top-32 -right-24 h-80 w-80 rounded-full blur-3xl opacity-30"
          style={{ background: "radial-gradient(circle, #ee964b 0%, transparent 70%)" }}
        />

        <div className="relative w-full max-w-md animate-in fade-in zoom-in-95 duration-500">
          <div className="rounded-3xl border border-orange-100 bg-white/90 p-8 sm:p-10 shadow-[0_24px_60px_-20px_rgba(13,59,102,0.25)] backdrop-blur">
            <img src={logo} alt="IZI Morocco" className="mx-auto h-16 w-auto" />

            <div className="mt-8 text-center">
              <h1 className="text-3xl font-extrabold text-primary">Welcome back</h1>
              <p className="mt-2 text-gray-500">Sign in to the IZI Morocco admin panel</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              {formData.errors?.general && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                  {formData.errors.general}
                </div>
              )}

              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@izimorocco.com"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    disabled={isLoading}
                    required
                    className={`${inputBase} pr-4 ${
                      emailError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-accent focus:ring-accent/15"
                    }`}
                  />
                </div>
                {emailError && <p className="mt-1.5 text-sm text-red-500">{emailError}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    disabled={isLoading}
                    required
                    className={`${inputBase} pr-12 ${
                      passwordError
                        ? "border-red-300 focus:border-red-400 focus:ring-red-100"
                        : "border-gray-200 focus:border-accent focus:ring-accent/15"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                  </button>
                </div>
                {passwordError && <p className="mt-1.5 text-sm text-red-500">{passwordError}</p>}
              </div>

              <button
                type="submit"
                disabled={isLoading || formData.email === "" || formData.password === ""}
                className="group flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent to-[#ee964b] py-3.5 font-semibold text-white shadow-lg shadow-accent/25 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-accent/30 disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  <>
                    Login
                    <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 flex items-center justify-center gap-2 text-xs text-gray-400">
              <ShieldCheck className="h-4 w-4" />
              Restricted area · Authorized IZI Morocco staff only
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
