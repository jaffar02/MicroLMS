import React from "react";
import { useState, useRef } from "react";
import { LockClosedIcon } from "@heroicons/react/24/solid";
import { EnvelopeIcon } from "@heroicons/react/24/outline";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";

const ForgotLayout = () => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [isEmailEmpty, setIsEmailEmpty] = useState(false);
  const [isEmailInvalid, setIsEmailInvalid] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const sendEmailCodeMutate = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "An unknown error occured!");
      }
      return res.text();
    },
    onSuccess: () => {
      toast.success(
        "Reset link sent to specified your registered. Please check inbox!",
        {
          duration: 4000,
          position: "top-right",
        }
      );
    },
    onError: (err: any) => {
      toast.error(`Failed: ${err.message}`);
    },
  });

  const handleSubmit = () => {
    if (!email.trim()) {
      setIsEmailEmpty(true);
      emailInputRef.current?.focus();
      return;
    }

    if (!emailRegex.test(email)) {
      setIsEmailInvalid(true);
      toast.error("Please enter a valid email address.");
      emailInputRef.current?.focus();
      return;
    }

    setIsEmailEmpty(false);
    setIsEmailInvalid(false);
    sendEmailCodeMutate.mutate();
  };

  return (
    <section className="flex flex-col items-center max-w-6xl mx-auto p-4">
      <div className="flex">
        <h4 className="text-black !font-poppins font-semibold text-[23px] py-5">
          Forgot your Password?
        </h4>
      </div>
      <div className="w-full flex flex-col shadow-md shadow-black/30">
        <div className="bg-[#0000ff] w-full h-[5px]"></div>
        <div className="bg-white h-fit pb-3 pt-2 w-full flex flex-col p-3">
          <div className="w-full flex justify-center py-2">
            <LockClosedIcon className="hidden md:block size-5 text-gray-500 shrink-0" />
            <p className="!font-poppins h-fit  m-0">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3">
            <div className="w-full flex justify-center pt-2 gap-2 items-center">
              <p className="!font-poppins font-semibold h-fit">Email Address</p>
              <EnvelopeIcon className="h-5 w-5" />
            </div>
            <input
              ref={emailInputRef}
              className={`font-poppins border transition-all duration-300 outline-none
                ${
                  isEmailEmpty || isEmailInvalid
                    ? "border-red-500 focus:shadow-[0_0_8px_rgba(239,68,68,0.7)] focus:ring-2 focus:ring-red-400"
                    : "border-gray-400 focus:border-blue-500 focus:shadow-[0_0_8px_rgba(59,130,246,0.7)] focus:ring-2 focus:ring-blue-400"
                }
                rounded-[6px] w-full max-w-[250px] px-2 py-1 bg-transparent
              `}
              placeholder="e.g. email@domain.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value.trim() !== "") {
                  setIsEmailEmpty(false);
                } else {
                  setIsEmailInvalid(false);
                }
              }}
            />

            <button
              onClick={handleSubmit}
              disabled={sendEmailCodeMutate.isPending}
              className={`${
                sendEmailCodeMutate.isPending
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#5995fd] hover:scale-105"
              } !rounded-[10px] !text-[14px] !font-poppins font-semibold px-3 py-[8px] text-white bg-[#5995fd] transition-all duration-200 hover:scale-105`}
            >
              {sendEmailCodeMutate.isPending ? (
                <span className="flex items-center gap-2">
                  <Spinner className="h-4 w-4 text-white" />{" "}
                  {/* ShadCN spinner */}
                  Sending...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotLayout;
