import { React, useEffect, useState } from "react";

export default function RoleSelector({
  onChange,
}: {
  onChange?: (role: "teacher" | "student") => void;
}) {
  const [role, setRole] = useState<"teacher" | "student">("student");
  useEffect(() => {
    onChange?.(role); // 🔥 notify parent whenever role changes
  }, [role]);

  return (
    <div className="flex bg-[#ebeaea] rounded-3xl p-1 w-[280px] h-12 items-center font-poppins font-semibold">
      <button
        onClick={() => setRole("teacher")}
        className={`flex-1 h-full !rounded-2xl transition-all duration-200 ${
          role === "teacher"
            ? "bg-[#5995fd] text-white shadow-[0_0_10px_#5995fd]"
            : "text-gray-600 hover:text-[#5995fd]"
        }`}
      >
        Teacher
      </button>
      <button
        onClick={() => setRole("student")}
        className={`flex-1 h-full !rounded-2xl transition-all duration-200 ${
          role === "student"
            ? "bg-[#5995fd] text-white shadow-[0_0_10px_#5995fd]"
            : "text-gray-600 hover:text-[#5995fd]"
        }`}
      >
        Student
      </button>
    </div>
  );
}
