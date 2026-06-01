import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/course";
import {
  BookOpenCheck,
  Check,
  ChevronRight,
  Copy,
  Pencil,
  Trash2,
  UsersRound,
} from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface CourseItemProps {
  course: Course;
  onClick: () => void;
  onDeleteClick: () => void;
  onUpdateClick: () => void;
}

export const CourseItem = ({
  course,
  onClick,
  onDeleteClick,
  onUpdateClick,
}: CourseItemProps) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showTooltip, setShowTooltip] = useState(false);
  const [showTitleTooltip, setShowTitleTooltip] = useState(false);
  const { user } = useAuth();
  const isTeacher = user?.roles.includes("TEACHER");
  const [copied, setCopied] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    // We get the position relative to the description container
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card navigation
    navigator.clipboard.writeText(course.inviteCode);
    setCopied(true);
    toast.success("Invite code copied!", {
      position: "top-right",
      duration: 2000,
    });

    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={cn(
        // Base Styles
        "bg-white border w-full border-gray-200 rounded-2xl p-[20px] shadow-sm cursor-pointer group",
        // Smooth Animation
        "transition-all duration-300 ease-out",
        // Hover State
        "hover:!border-blue-500 hover:!shadow-xl hover:-translate-y-1 hover:scale-[1.01]",
      )}
      onClick={onClick}
    >
      {/* Header: Title and Teacher */}
      <div className="flex justify-between items-center mb-2 cursor-help">
        <div
          className="flex items-center min-w-0 w-full"
          onMouseEnter={() => setShowTitleTooltip(true)}
          onMouseLeave={() => setShowTitleTooltip(false)}
          onMouseMove={handleMouseMove}
        >
          <h3 className="!text-[20px] font-bold text-gray-800 truncate w-full leading-none m-0 group-hover:!text-blue-600 transition-colors">
            {course.title}
          </h3>
          {/* Tooltip following the cursor */}
          {showTitleTooltip && (
            <div
              className="fixed z-[100] w-fit p-3 bg-[#007bff]/25 backdrop-blur-sm text-black text-xs rounded-xl shadow-2xs pointer-events-none transition-opacity duration-200"
              style={{
                // We use fixed positioning based on the viewport to avoid parent clipping
                left: `${mousePos.x + 40}px`,
                top: `${mousePos.y + 40}px`,
                position: "absolute",
              }}
            >
              <p className="leading-relaxed">{course.title}</p>
            </div>
          )}
        </div>

        {/* Icons + Invite Code Container */}
        {isTeacher && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 lg:opacity-0 group-hover:!opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateClick();
                }}
                className={cn(
                  "p-1.5 transition-colors !rounded-s-md",
                  // MOBILE: Always blue
                  "text-blue-600 bg-blue-100",
                  // DESKTOP: Start gray on card hover, turn blue only on button hover
                  "lg:text-gray-400 lg:bg-transparent lg:hover:text-blue-600 lg:hover:bg-blue-100",
                )}
              >
                <Pencil size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteClick();
                }}
                className={cn(
                  "p-1.5 transition-colors !rounded-e-md",
                  // MOBILE: Always red
                  "text-red-600 bg-red-100",
                  // DESKTOP: Start gray on card hover, turn red only on button hover
                  "lg:text-gray-400 lg:bg-transparent lg:hover:text-red-600 lg:hover:bg-red-100",
                )}
              >
                <Trash2 size={14} />
              </button>
            </div>

            {/* Invite Code */}
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1.5 px-2 py-1 rounded !text-[10px] font-mono font-semibold hover:font-bold transition-all border",
                copied
                  ? "bg-green-50 text-green-600 border-green-200"
                  : "bg-gray-100 text-header border-transparent hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600",
              )}
              title="Click to copy invite code"
            >
              {course.inviteCode}
              {copied ? (
                <Check size={12} />
              ) : (
                <Copy size={12} className="opacity-50" />
              )}
            </button>
          </div>
        )}
      </div>

      <div
        className="flex justify-between items-start mb-4 w-full cursor-help"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onMouseMove={handleMouseMove}
      >
        <p className="text-sm text-gray-600 line-clamp-2 m-0">
          {course.description}
        </p>

        {/* Tooltip following the cursor */}
        {showTooltip && (
          <div
            className="fixed z-[100] w-fit p-3 bg-[#007bff]/25 backdrop-blur-sm text-black text-xs rounded-xl shadow-2xs pointer-events-none transition-opacity duration-200"
            style={{
              // We use fixed positioning based on the viewport to avoid parent clipping
              left: `${mousePos.x + 40}px`,
              top: `${mousePos.y + 65}px`,
              position: "absolute",
            }}
          >
            <p className="leading-relaxed">{course.description}</p>
          </div>
        )}
      </div>

      {/* Footer: Stats */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
        {/* Left side: Stats Container */}
        <div className="flex items-center gap-6">
          {isTeacher && (
            <div className="flex items-center text-gray-500">
              <UsersRound className="text-orange-600 size-4 shrink-0" />
              <div className="flex flex-col px-2">
                <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] leading-tight mb-0.5">
                  Students
                </p>
                <span className="text-sm font-bold text-slate-700 leading-tight">
                  {course.enrolledStudents?.length || 0}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center text-gray-500">
            <BookOpenCheck className="text-purple-600 size-4 shrink-0" />
            <div className="flex flex-col px-2">
              <p className="font-bold text-slate-400 uppercase tracking-wider text-[10px] leading-tight mb-0.5">
                Assignments
              </p>
              <span className="text-sm font-bold text-slate-700 leading-tight">
                {course.assignments?.length || 0}
              </span>
            </div>
          </div>
        </div>

        <div className="w-8 h-8 rounded-full hover:bg-blue-500 bg-slate-50 group-hover:bg-blue-600 flex items-center justify-center transition-all shrink-0">
          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-white" />
        </div>
      </div>
    </div>
  );
};
