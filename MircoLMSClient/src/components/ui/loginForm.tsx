import { UserIcon, FingerPrintIcon } from "@heroicons/react/24/solid";
import { Eye, EyeOff } from "lucide-react";
import { useState, useRef } from "react";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function LoginForm() {
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const emailRef = useRef<HTMLInputElement>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleLogin = async () => {
    if (isSubmitting) return;

    if (!emailRegex.test(email)) {
      setIsEmailInvalid(true);
      emailRef.current?.focus();
      toast.error("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const contentType = res.headers.get("content-type");
      const isJson = contentType && contentType.includes("application/json");
      const data = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        throw new Error(
          typeof data === "string" ? data : data.message || "Login failed",
        );
      }

      if (data.token) {
        const userTitle = data.title || "";
        const userDept = data.department || "";

        login(
          data.token,
          data.email || "",
          data.fullName || "",
          JSON.stringify(data.roles || []),
          userTitle, // 👈 ADD THIS NEW PROPERTY
          userDept, // 👈 ADD THIS NEW PROPERTY
        );

        toast.success("Logged in successfully!", {
          duration: 3000,
          position: "top-right",
        });

        // Optional: navigate to dashboard later if needed
        window.location.replace("/courses");
      } else {
        throw new Error("Token not received");
      }
    } catch (err: any) {
      toast.error(`Login failed: ${err.message}`, {
        duration: 3000,
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = email && password;

  return (
    <div className="w-1/2 h-full relative z-10 flex justify-center md:mt-40">
      <div className="flex flex-wrap flex-col items-center gap-y-8 h-fit">
        <p className="text-4xl font-poppins font-medium text-[#444444] mb-0">
          Sign in
        </p>

        {/* Email */}
        <div className="w-[280px]">
          <div
            className={`rounded-4xl flex items-center h-12 px-3 transition-all duration-300
              ${
                isEmailFocused && isEmailInvalid
                  ? "border border-red-500 shadow-[0_0_10px_#ff4d4d]"
                  : "bg-[#ebeaea]"
              }`}
          >
            <UserIcon className="text-gray-500 w-6 h-6 mr-2" />
            <input
              ref={emailRef}
              type="email"
              placeholder="Email"
              value={email}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsEmailInvalid(!emailRegex.test(e.target.value));
              }}
              className="bg-transparent outline-none font-poppins font-semibold w-full h-full px-2"
            />
          </div>
        </div>

        {/* Password */}
        <div className="w-[280px] rounded-4xl flex items-center h-12 bg-[#ebeaea] px-2">
          <FingerPrintIcon className="text-gray-500 w-6 h-6 mx-2" />
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-transparent outline-none font-poppins font-semibold w-full h-full ml-2 px-2"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="text-gray-500 hover:text-gray-700 pr-2"
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </div>

        {/* Submit */}
        <button
          disabled={!canSubmit || isSubmitting}
          onClick={handleLogin}
          className={`!rounded-full text-[16px] font-poppins font-semibold px-17 py-[12px] text-white transition-all duration-200 hover:scale-105 
            ${
              !canSubmit || isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#5995fd] hover:bg-[#4078f7]"
            }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-white" />
              Logging in...
            </span>
          ) : (
            "LOGIN"
          )}
        </button>

        <p
          onClick={() => (window.location.href = "/forgot")}
          className="text-[#007bff] font-poppins hover:underline !-mt-5 hover:cursor-pointer"
        >
          Forgot Password?
        </p>
      </div>
    </div>
  );
}
