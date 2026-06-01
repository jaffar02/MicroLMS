import React, { useEffect, useState } from "react";
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  useFocus,
  useDismiss,
  useRole,
  useInteractions,
  FloatingPortal,
} from "@floating-ui/react";
import { Eye, EyeOff } from "lucide-react";

interface PasswordInputProps {
  value?: string;
  onChange?: (value: string) => void;
  onStrengthChange?: (strength: number) => void;
  placeholder?: string;
  mode?: "create" | "confirm";
  mainPassword?: string;
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

const PasswordInput2: React.FC<PasswordInputProps> = ({
  value,
  onChange,
  onStrengthChange,
  placeholder,
  mode = "create",
  mainPassword,
}) => {
  const [localPassword, setLocalPassword] = useState("");
  const controlled = typeof value !== "undefined";
  const password = controlled ? value! : localPassword;

  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
    if (mode === "create") {
      if (newVal.length > 0 && !isOpen) setIsOpen(true);
      else if (newVal.length === 0 && isOpen) setIsOpen(false);
    }
  };

  const strengthLabels = ["Weak", "Medium", "Strong", "Very Strong"];
  const strengthColors = [
    "bg-red-500",
    "bg-orange-500",
    "bg-yellow-500",
    "bg-green-500",
  ];

  const confirmError =
    mode === "confirm" &&
    mainPassword != null &&
    password.length > 0 &&
    password !== mainPassword;

  const borderClass = confirmError
    ? "border-red-500 focus:!ring-2 focus:!ring-red-300"
    : mode === "create"
      ? strength < 3
        ? "border-gray-300 focus:!border-red-500 focus:!ring-2 focus:!ring-red-300"
        : "border-gray-300 focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-300"
      : "border-gray-300 focus:!border-blue-500 focus:!ring-2 focus:!ring-blue-300";

  return (
    <div className="w-full">
      <div className="relative">
        <input
          ref={refs.setReference}
          {...getReferenceProps()}
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={handleChange}
          placeholder={placeholder || "Pick a password"}
          className={`!font-poppins !text-[14px] w-full px-4 py-2 !pr-12 text-gray-900 bg-white border rounded-md focus:outline-none transition-all duration-200 ${borderClass}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword((s) => !s)}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 transition-colors duration-200 hover:text-gray-700"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>

      <FloatingPortal>
        {isOpen && mode === "create" && (
          <div
            ref={refs.setFloating}
            style={floatingStyles}
            {...getFloatingProps()}
            className="z-50"
          >
            <div className="p-4 bg-white border border-gray-200 rounded-md shadow-lg">
              <div className="flex flex-col px-2">
                <div className="w-full h-1.5 mb-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      strengthColors[strength - 1] || "bg-red-500"
                    }`}
                    style={{
                      width:
                        password.length > 0 ? `${(strength / 4) * 100}%` : "0%",
                    }}
                  />
                </div>

                <p className="mb-3 text-sm font-medium text-gray-700">
                  {password.length > 0
                    ? strengthLabels[strength - 1] || "Weak"
                    : "Weak"}
                </p>

                <hr className="mb-3" />

                <h3 className="mb-2 font-semibold text-gray-800 !text-[20px]">
                  Suggestions
                </h3>
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

      {confirmError && (
        <p className="mt-1 text-xs text-red-500 font-medium">
          Passwords do not match
        </p>
      )}
    </div>
  );
};

export default PasswordInput2;
