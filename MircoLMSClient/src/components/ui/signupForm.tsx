import { UserIcon } from "@heroicons/react/24/solid";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import PasswordInput3 from "./mypass2";
import RoleSelector from "./roleSelector";

export default function SignupForm() {
  const [role, setRole] = useState<"teacher" | "student">("teacher");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [strength, setStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);

  const emailRef = useRef<HTMLInputElement>(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const handleSignup = async () => {
    if (isSubmitting) return;

    if (!emailRegex.test(email)) {
      setIsEmailInvalid(true);
      emailRef.current?.focus();
      toast.error("Please enter a valid email address.");
      return;
    }

    if (strength < 3) {
      toast.error("Password is too weak.");
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          password,
          roles: [{ name: role.toUpperCase() }],
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to register");
      }

      toast.success("Registration successful. Please check your email to verify your account.", {
        duration: 4000,
        position: "top-right",
      });
    } catch (err: any) {
      toast.error(`Failed: ${err.message}`, {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = fullName && email && password && strength >= 3;

  return (
    <div className="w-1/2 h-full relative z-10 flex justify-center md:mt-40">
      <div className="flex flex-col items-center gap-y-6 h-fit">
        <p className="text-4xl font-poppins font-medium text-[#444444] mb-0">
          Sign up
        </p>

        {/* Full Name */}
        <div className="w-[280px]">
          <div className="rounded-4xl flex items-center h-12 px-3 bg-[#ebeaea] transition-all duration-300">
            <UserIcon className="text-gray-500 w-6 h-6 mr-2" />
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="bg-transparent outline-none font-poppins font-semibold w-full h-full px-2"
            />
          </div>
        </div>

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
        <div className="w-[280px] transition-all duration-300 rounded-4xl">
          <PasswordInput3
            value={password}
            onChange={(v) => setPassword(v)}
            onStrengthChange={setStrength}
            placeholder="Password"
          />
        </div>

        {/* Role Selector */}
        <RoleSelector onChange={(r) => setRole(r)} />

        {/* Submit Button */}
        <button
          disabled={!canSubmit || isSubmitting}
          onClick={handleSignup}
          className={`!rounded-full text-[16px] font-poppins font-semibold px-10 py-[12px] text-white transition-all duration-200 hover:scale-105 
            ${
              !canSubmit || isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-[#5995fd] hover:bg-[#4078f7]"
            }`}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner className="h-4 w-4 text-white" />
              Signing up...
            </span>
          ) : (
            "SIGN UP"
          )}
        </button>
      </div>
    </div>
  );
}
