import React, { useState } from "react";
import AskSignup from "@/components/ui/askSingup";
import LoginForm from "@/components/ui/loginForm";
import AskLogin from "@/components/ui/askLogin";
import SignupForm from "@/components/ui/signupForm";

export default function AuthLayout() {
  const [isSignupMode, setIsSignupMode] = useState(false);

  return (
    <section className="w-full min-h-screen flex flex-col bg-white">
      {/* ── Mobile-only top banner ── */}
      <div className="md:hidden relative bg-white">
        {/* SVG does the gradient fill + curved right edge in one shot */}
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 w-full h-full"
          style={{ zIndex: 0 }}
        >
          <defs>
            <linearGradient id="mob-grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4481eb" />
              <stop offset="100%" stopColor="#04befe" />
            </linearGradient>
          </defs>
          <path
            d="M 0 0 L 100 0 L 100 100 Q 60 70 0 100 Z"
            fill="url(#mob-grad)"
          />
        </svg>

        {/* Content */}
        <div
          className="relative flex flex-col items-center justify-center gap-2 px-8 py-16 min-h-[300px] text-center"
          style={{ zIndex: 1 }}
        >
          {isSignupMode ? (
            <>
              <p className="text-white/80 text-lg font-poppins font-semibold">
                Already have an account?
              </p>
              <button
                onClick={() => setIsSignupMode(false)}
                className="border-2 border-white !font-poppins text-white text-xs font-bold tracking-widest uppercase px-6 py-2 !rounded-full hover:bg-white hover:text-blue-500 transition-colors duration-200"
              >
                Sign In
              </button>
            </>
          ) : (
            <>
              <p className="text-white font-bold text-2xl font-poppins">New here?</p>
              <p className="text-white/80 text-base font-poppins">
                Then Sign Up and Start Learning!
              </p>
              <button
                onClick={() => setIsSignupMode(true)}
                className="border-2 border-white !font-poppins text-white text-xs font-bold tracking-widest uppercase px-6 py-2 !rounded-full hover:bg-white hover:text-blue-500 transition-colors duration-200"
              >
                Sign Up
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Mobile-only form area ── */}
      <div className="md:hidden flex-1 flex flex-col items-center justify-center px-6 py-10">
        {isSignupMode ? <SignupForm /> : <LoginForm />}
      </div>

      {/* ── Desktop split layout (unchanged) ── */}
      <section
        className="
          hidden md:flex
          w-full flex-grow relative overflow-hidden
          group
          before:content-['']
          before:absolute
          before:h-[2000px]
          before:w-[2000px]
          before:top-[-10%]
          before:right-[48%]
          before:-translate-y-1/2
          before:bg-[linear-gradient(-45deg,#4481eb,#04befe)]
          before:transition-all before:duration-[1800ms]
          before:ease-in-out
          before:rounded-full
          before:z-[6]
          hover:before:right-[46%]
        "
      >
        {isSignupMode ? (
          <>
            <AskLogin onSwitch={() => setIsSignupMode(false)} />
            <SignupForm />
          </>
        ) : (
          <>
            <AskSignup onSwitch={() => setIsSignupMode(true)} />
            <LoginForm />
          </>
        )}
      </section>
    </section>
  );
}
