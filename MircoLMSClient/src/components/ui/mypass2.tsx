import React, { useEffect, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
  size,
} from "@floating-ui/react";
import { Eye, EyeOff, Fingerprint } from "lucide-react";

interface PasswordInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onStrengthChange?: (strength: number) => void;
  placeholder?: string;
}

const SuggestionItem = ({
  isValid,
  text,
}: {
  isValid: boolean;
  text: string;
}) => (
  <li
    className={`transition-colors ${
      isValid ? "text-green-600" : "text-gray-500"
    }`}
  >
    {text}
  </li>
);

const PasswordInput3: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  onStrengthChange,
  placeholder,
}) => {
  const [localPassword, setLocalPassword] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const controlled = typeof value !== "undefined";
  const password = controlled ? value! : localPassword;

  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: setIsOpen,
    placement: "bottom",
    whileElementsMounted: autoUpdate,
    middleware: [
      offset(10),
      flip({ fallbackPlacements: ["top", "bottom"], padding: 8 }),
      shift({ padding: 8 }),
      size({
        apply({ availableWidth, elements }) {
          // never wider than available space, min 220px
          Object.assign(elements.floating.style, {
            maxWidth: `${Math.min(availableWidth, 280)}px`,
            minWidth: "220px",
          });
        },
        padding: 8,
      }),
    ],
  });

  const focus = useFocus(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([
    focus,
    dismiss,
    role,
  ]);

  // password rules
  const hasMinLength = password.length >= 8;
  const hasNumeric = /\d/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  let strength = 0;
  if (password.length > 0) strength = 1;
  if (hasMinLength && (hasLowercase || hasUppercase)) strength = 2;
  if (hasMinLength && hasLowercase && hasUppercase && hasNumeric) strength = 3;
  if (hasMinLength && hasLowercase && hasUppercase && hasNumeric && hasSymbol)
    strength = 4;

  useEffect(() => {
    onStrengthChange?.(strength);
  }, [strength, onStrengthChange]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    if (!controlled) setLocalPassword(newVal);
    onChange?.(newVal);
    if (newVal.length > 0 && !isOpen) setIsOpen(true);
    else if (newVal.length === 0 && isOpen) setIsOpen(false);
  };

  return (
    <div className="w-full">
      {/* Main Input */}
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        className="!rounded-4xl flex items-center h-12 bg-[#ebeaea] px-2 w-full"
      >
        <Fingerprint className="text-gray-500 w-6 h-6 mx-2 shrink-0" />
        <input
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handleChange}
          placeholder={placeholder || "Password"}
          className="bg-transparent !outline-none focus:!outline-none !font-poppins font-semibold w-full h-full ml-2 px-2"
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="text-gray-500 hover:text-gray-700 pr-2 shrink-0"
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      {/* Strength suggestions popup */}
      <FloatingPortal>
        {isOpen && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50"
          >
            <div className="p-4 bg-white rounded-md shadow-lg">
              <div className="flex flex-col px-2">
                <div className="w-full h-1.5 mb-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      [
                        "bg-red-500",
                        "bg-orange-500",
                        "bg-yellow-500",
                        "bg-green-500",
                      ][strength - 1] || "bg-red-500"
                    }`}
                    style={{
                      width:
                        password.length > 0 ? `${(strength / 4) * 100}%` : "0%",
                    }}
                  />
                </div>

                <p className="mb-3 text-sm font-medium text-gray-700">
                  {password.length > 0
                    ? ["Weak", "Medium", "Strong", "Very Strong"][
                        strength - 1
                      ] || "Weak"
                    : "Weak"}
                </p>

                <hr className="mb-3" />

                <ul className="space-y-1 text-sm list-disc list-inside !p-0">
                  <SuggestionItem
                    isValid={hasLowercase}
                    text="At least one lowercase"
                  />
                  <SuggestionItem
                    isValid={hasUppercase}
                    text="At least one uppercase"
                  />
                  <SuggestionItem
                    isValid={hasNumeric}
                    text="At least one number"
                  />
                  <SuggestionItem
                    isValid={hasSymbol}
                    text="At least one symbol"
                  />
                  <SuggestionItem
                    isValid={hasMinLength}
                    text="Minimum 8 characters"
                  />
                </ul>
              </div>
            </div>
          </div>
        )}
      </FloatingPortal>
    </div>
  );
};

export default PasswordInput3;
