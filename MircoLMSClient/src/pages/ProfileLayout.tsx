import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { SpecialInfo } from "@/types/course";
import {
  BookOpen,
  Building2,
  ClipboardList,
  GraduationCap,
  Mail,
  Pencil,
  Save,
  Users,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface ProfileData {
  fullName: string;
  email: string;
  title: string;
  department: string;
  password: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}

export const ProfileLayout = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, updateUser } = useAuth();
  const isTeacher = user?.roles.includes("TEACHER");
  const [stats, setStats] = useState<SpecialInfo | null>(null);
  
  const [profile, setProfile] = useState<ProfileData>({
    fullName: (user as any)?.fullName ?? "",
    email: (user as any)?.email ?? "",
    title: (user as any)?.title ?? "",
    department: (user as any)?.department ?? "",
    password: "",
  });

  const [draft, setDraft] = useState<ProfileData>(profile);

  useEffect(() => {
    if (!isTeacher) return;
    const token = localStorage.getItem("token");
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/course/getSpecialInfo`, {
      headers: { Authorization: `Bearer ${token}` },
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data: SpecialInfo) => setStats(data))
      .catch(() => setStats(null));
  }, [isTeacher]);

  const handleEdit = () => {
    setDraft({ ...profile, password: "" });
    setError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const body: Record<string, string> = {
        fullName: draft.fullName,
        department: draft.department,
      };
      if (isTeacher && draft.title) body.title = draft.title;
      if (draft.password) body.password = draft.password;

      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/update-info`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(body),
        },
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.message ?? "Failed to save. Please try again.");
      } else {
        updateUser({
          fullName: draft.fullName,
          department: draft.department || undefined,
          ...(isTeacher ? { title: draft.title || undefined } : {}),
        });
        setProfile({ ...draft, password: "" });
      }
      setIsEditing(false);
    } catch (err: unknown) {
      console.log(
        "error occurred while saving profile: ",
        err instanceof Error
          ? err.message
          : "Failed to save. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const subtitle = isTeacher
    ? [profile.title, profile.department].filter(Boolean).join(" - ")
    : profile.department;

  return (
    <section id="outerContainer" className="flex flex-col w-full mt-2.5 mb-8">
      {/* ── Header ── */}
      <div className="flex w-full items-center p-[24px]">
        <p className="flex-1 font-poppins font-semibold text-2xl text-gray-700">
          Profile
        </p>
        <div className="flex flex-row gap-2">
          {!isEditing && (
            <Button
              className="flex items-center gap-2 px-2.5 py-1.5 md:px-4 border !border-blue-600 hover:!text-blue-600 !rounded-lg font-medium text-sm hover:!bg-blue-50 transition-colors"
              onClick={handleEdit}
            >
              <Pencil className="size-4 md:size-4" strokeWidth={2.5} />
              <span className="hidden md:inline">Edit Profile</span>
            </Button>
          )}
          {isEditing && (
            <div className="flex flex-row gap-2">
              <Button
                className="flex items-center gap-2 px-2.5 py-1.5 md:px-4 border border-green-100 bg-white !rounded-lg font-medium text-black text-sm hover:!bg-gray-100 transition-colors"
                onClick={handleCancel}
              >
                <span className="hidden md:inline">Cancel</span>
              </Button>
              <Button
                className="flex items-center gap-2 px-2.5 py-1.5 md:px-4 border !border-blue-600 hover:!text-blue-600 !rounded-lg font-medium text-sm hover:!bg-blue-50 transition-colors"
                onClick={handleSave}
                disabled={saving}
              >
                <Save className="size-4 md:size-4" strokeWidth={2.5} />
                <span className="hidden md:inline">
                  {saving ? "Saving…" : "Save Changes"}
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Profile card ── */}
      <div className="mx-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible mb-5">
        {/* Banner */}
        <div className="h-[110px] w-full rounded-t-xl bg-gradient-to-r from-blue-700 to-blue-500" />

        {/* Avatar + name row */}
        <div className="relative px-6 mb-4">
          <div className="absolute -top-10 left-6 w-20 h-20 rounded-full bg-blue-600 border-4 border-white flex items-center justify-center shadow-md">
            <span className="text-white font-bold text-lg tracking-wide">
              {getInitials(profile.fullName || "U")}
            </span>
          </div>
          <div className="pl-23 pt-2">
            <p className="font-semibold text-gray-800 text-lg leading-tight">
              {profile.fullName || "—"}
            </p>
            {/* {subtitle && <p className="text-gray-500 text-sm">{subtitle}</p>} */}
            {isTeacher ? (
              profile.title || profile.department ? (
                <p className="text-sm font-medium text-gray-500">{subtitle}</p>
              ) : (
                <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-b-sm">
                  Not provided
                </span>
              )
            ) : profile.department ? (
              <p className="text-sm font-medium text-gray-500">{subtitle}</p>
            ) : (
              <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-b-sm">
                Not provided
              </span>
            )}
          </div>
        </div>

        {/* Error message */}
        {error && (
          <p className="mx-6 mb-3 text-red-500 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* View mode */}
        {!isEditing && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
            {/* Email */}
            <div className="flex items-start gap-3">
              <Mail className="size-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                  Email
                </p>
                {profile.email ? (
                  <p className="text-sm font-medium text-black">
                    {profile.email}
                  </p>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-b-sm">
                    Not provided
                  </span>
                )}
              </div>
            </div>

            {/* Department */}
            <div className="flex items-start gap-3">
              <Building2 className="size-4 text-blue-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                  Department
                </p>
                {profile.department ? (
                  <p className="text-sm font-medium text-black">
                    {profile.department}
                  </p>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-b-sm">
                    Not provided
                  </span>
                )}
              </div>
            </div>

            {/* Title — teachers only */}
            {isTeacher && (
              <div className="flex items-start gap-3">
                <GraduationCap className="size-4 text-blue-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-0.5">
                    Title
                  </p>
                  {profile.title ? (
                    <p className="text-sm font-medium text-black">
                      {profile.title}
                    </p>
                  ) : (
                    <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-b-sm">
                      Not provided
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Edit mode */}
        {isEditing && (
          <div className="px-6 pb-6 border-t border-gray-100 pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Full Name
              </label>
              <input
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                value={draft.fullName}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, fullName: e.target.value }))
                }
                placeholder="Full name"
              />
            </div>

            {/* Email — read-only, not in update req */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Email{" "}
                <span className="normal-case text-gray-400">
                  (cannot be changed)
                </span>
              </label>
              <input
                readOnly
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-400 cursor-not-allowed"
                value={draft.email}
              />
            </div>

            {/* Department */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Department
              </label>
              <input
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                value={draft.department}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, department: e.target.value }))
                }
                placeholder="e.g. Computer Science"
              />
            </div>

            {/* Title — teachers only */}
            {isTeacher && (
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Title
                </label>
                <input
                  className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="e.g. Associate Professor"
                />
              </div>
            )}

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                New Password{" "}
                <span className="normal-case text-gray-400">
                  (leave blank to keep current)
                </span>
              </label>
              <input
                type="password"
                className="w-full bg-gray-100 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all"
                value={draft.password}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, password: e.target.value }))
                }
                placeholder="••••••••"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Stat cards ── */}
      {isTeacher && (
        <div className="mx-6 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="size-6 text-blue-500" />
              <p className="font-semibold text-gray-800 text-xl">
                Total Courses
              </p>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {stats
                ? `${stats.totalCourses} Active ${stats.totalCourses === 1 ? "Course" : "Courses"}`
                : "—"}
            </p>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <Users className="size-6 text-blue-500" />
              <p className="font-semibold text-gray-800 text-xl">
                Total Students
              </p>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {stats
                ? `${stats.totalStudents} Enrolled ${stats.totalStudents === 1 ? "Student" : "Students"}`
                : "—"}
            </p>
          </div>
          <div className="flex-1 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <ClipboardList className="size-6 text-blue-500" />
              <p className="font-semibold text-gray-800 text-xl">Assignments</p>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {stats
                ? `${stats.totalAssignments} Active ${stats.totalAssignments === 1 ? "Assignment" : "Assignments"}`
                : "—"}
            </p>
          </div>
        </div>
      )}
    </section>
  );
};
