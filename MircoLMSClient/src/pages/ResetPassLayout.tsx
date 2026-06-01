import { ShieldExclamationIcon } from "@heroicons/react/24/solid";
import { useState } from "react";
import PasswordInput2 from "@/components/ui/mypass";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const ResetPassLayout = () => {
  const navigate = useNavigate();
  const [strength, setStrength] = useState(0);
  const [mainPassword, setMainPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const baseUrl = import.meta.env.VITE_API_BASE_URL;

  // ✅ Use TanStack Query for validating reset code
  const { isError, isLoading, isSuccess } = useQuery({
    queryKey: ["validate-reset-code", code],
    queryFn: async () => {
      if (!code) throw new Error("Missing reset code");
      const res = await fetch(
        `${baseUrl}/api/auth/validate-reset-code?code=${code}`
      );
      if (!res.ok) {
        throw new Error("Invalid or expired reset code");
      }
      return res.json();
    },
    retry: false, // don't retry invalid links
    enabled: !!code, // only run if code is present
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${baseUrl}/api/auth/reset-pass`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code,
          newPassword: mainPassword,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Failed to reset password");
      }
      return res.text();
    },
    onSuccess: () => {
      toast.success("Password reset successful!", {
        duration: 4000, // 4 seconds
        position: "top-right", // top-right, bottom-right, bottom-left, top-left, top-center, bottom-center
      });
      // Optionally redirect user, e.g.:
      navigate("/login");
    },
    onError: (err: any) => {
      toast.error(`Failed: ${err.message}`);
    },
  });

  // ✅ Derived booleans
  const passwordsMatch =
    mainPassword.length > 0 &&
    confirmPassword.length > 0 &&
    mainPassword === confirmPassword;

  const canSubmit = strength >= 3 && passwordsMatch;

  // ✅ Loading state (while verifying code)
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <Spinner className="size-6 text-blue-500" />
      </div>
    );
  }

  // ✅ Invalid or expired code
  if (isError || !code) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full text-center">
        <ShieldExclamationIcon className="size-10 text-red-500 mb-2" />
        <h3 className="text-lg font-semibold text-red-600">
          Invalid or expired link
        </h3>
        <p className="text-sm !font-poppins text-gray-600">
          Please request a new password reset link.
        </p>
      </div>
    );
  }

  // ✅ Valid code → show password form
  if (isSuccess) {
    return (
      <section className="w-full h-full flex flex-wrap justify-center">
        <div className="h-full w-fit flex flex-col items-center justify-center">
          <div className="w-auto h-auto rounded-[8px] bg-[#eeebee]">
            <ShieldExclamationIcon className="size-5 m-2 text-header" />
          </div>
          <h3 className="scroll-m-20 !text-[20px] font-semibold tracking-tight">
            Create a new password
          </h3>
          <p className="leading-7 [&:not(:first-child)]:mt-6 !text-[12px] !font-poppins !font-normal">
            Please choose a new password.
          </p>

          <div className="flex flex-col flex-wrap gap-2 p-2">
            <PasswordInput2
              value={mainPassword}
              onChange={setMainPassword}
              onStrengthChange={setStrength}
              placeholder="Pick a password"
              mode="create"
            />

            <PasswordInput2
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Confirm password"
              mode="confirm"
              mainPassword={mainPassword}
            />
          </div>

          <button
            disabled={!canSubmit}
            onClick={() => {
              resetPasswordMutation.mutate();
            }}
            className={`!rounded-[10px] !text-[14px] !font-poppins !font-semibold !px-3 !py-[8px] !my-1 !text-white !transition-all !duration-200 hover:!scale-105 ${
              !canSubmit || resetPasswordMutation.isPending
                ? "!bg-gray-400 cursor-not-allowed"
                : "!bg-[#5995fd] hover:!bg-[#4078f7]"
            }`}
          >
            {resetPasswordMutation.isPending ? (
              <span className="flex items-center gap-2">
                <Spinner className="h-4 w-4 text-white" />{" "}
                {/* ShadCN spinner */}
                Resetting...
              </span>
            ) : (
              "Reset Password"
            )}
          </button>
        </div>
      </section>
    );
  }

  return null;
};

export default ResetPassLayout;
