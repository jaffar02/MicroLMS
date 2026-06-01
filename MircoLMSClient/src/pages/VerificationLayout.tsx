import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  ShieldExclamationIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect } from "react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";

export const VerificationLayout = () => {
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code");
  const baseUrl = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const { isError, isLoading, isSuccess } = useQuery({
    queryKey: ["verify", code],
    queryFn: async () => {
      if (!code) throw new Error("Missing verification code");

      const res = await fetch(`${baseUrl}/api/auth/verify?code=${code}`);
      if (!res.ok) {
        throw new Error("Invalid or expired verification link");
      }

      // Try reading JSON first; fallback to text
      const text = await res.text();
      return { message: text };
    },
    retry: false,
    enabled: !!code,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    if (isSuccess) {
      const timeout = setTimeout(() => {
        navigate("/login", { replace: true }); 
      }, 3000);
      return () => clearTimeout(timeout);
    }
  }, [isSuccess, navigate]);

  if (isError || !code) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <ShieldExclamationIcon className="size-10 text-red-500 mb-2 animate-pulse" />
        <h3 className="text-lg font-semibold text-red-600">
          Invalid or expired link
        </h3>
        <p className="text-sm font-poppins text-gray-600">
          Please request a new verification link.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <Spinner className="size-6 text-primary animate-spin" />
        <p className="!font-poppins mt-3 text-sm text-gray-500">
          Verifying your account...
        </p>
      </div>
    );
  }

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-center">
        <CheckCircleIcon className="size-10 text-green-500 mb-2 animate-bounce" />
        <h3 className="text-lg font-semibold text-green-600">
          Verification Successful!
        </h3>
        <p className="text-sm font-poppins text-gray-600">
          Your account has been verified. You can now log in.
        </p>
      </div>
    );
  }

  return null;
};
