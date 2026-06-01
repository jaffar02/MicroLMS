import { Building2, GraduationCap, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

interface PublicProfile {
  fullName: string;
  department?: string;
  title?: string;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleColor(title?: string): {
  banner: string;
  avatar: string;
  badge: string;
  badgeText: string;
} {
  if (!title)
    return {
      banner: "from-slate-600 to-slate-500",
      avatar: "bg-slate-600",
      badge: "bg-slate-100 text-slate-600",
      badgeText: "Student",
    };

  const lower = title.toLowerCase();
  if (lower.includes("professor") || lower.includes("associate"))
    return {
      banner: "from-blue-800 to-blue-600",
      avatar: "bg-blue-700",
      badge: "bg-blue-50 text-blue-700",
      badgeText: "Faculty",
    };
  if (lower.includes("assistant"))
    return {
      banner: "from-indigo-700 to-indigo-500",
      avatar: "bg-indigo-600",
      badge: "bg-indigo-50 text-indigo-700",
      badgeText: "Faculty",
    };
  
  if (lower.includes("lecturer") || lower.includes("instructor"))
    return {
      banner: "from-violet-700 to-violet-500",
      avatar: "bg-violet-600",
      badge: "bg-violet-50 text-violet-700",
      badgeText: "Instructor",
    };

  return {
    banner: "from-blue-800 to-blue-600",
    avatar: "bg-blue-700",
    badge: "bg-blue-50 text-blue-700",
    badgeText: "Faculty",
  };
}

const FieldCard = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string;
}) => (
  <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100 hover:border-gray-200 hover:bg-gray-100/70 transition-all duration-150">
    <div className="mt-0.5 shrink-0 text-gray-400">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">
        {label}
      </p>
      {value ? (
        <p className="text-sm font-semibold text-gray-800 truncate">{value}</p>
      ) : (
        <span className="inline-block text-xs bg-gray-200/70 text-gray-400 px-2.5 py-0.5 rounded-full font-medium">
          Not provided
        </span>
      )}
    </div>
  </div>
);

export const PublicProfilePage = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_BASE_URL}/api/auth/${userId}/profile`)
      .then((r) => {
        if (!r.ok) {
          setNotFound(true);
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (data) setProfile(data);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
        <p className="text-sm text-gray-400">Loading profile…</p>
      </div>
    );

  if (notFound || !profile)
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-2">
        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="size-5 text-gray-400" />
        </div>
        <p className="text-sm font-medium text-gray-500">Profile not found</p>
        <p className="text-xs text-gray-400">
          This user may not exist or has been removed.
        </p>
      </div>
    );

  const isTeacher = !!profile.title;
  const colors = getRoleColor(profile.title);

  return (
    <div className="w-full h-full p-2">
      <div className="rounded-none sm:rounded-2xl border-0 sm:border border-gray-200 shadow-sm overflow-hidden bg-white min-h-screen sm:min-h-0">
        {/* Banner */}
        <div
          className={`relative h-40 w-full bg-gradient-to-r ${colors.banner}`}
        >
          {/* subtle pattern overlay */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        {/* Identity section */}
        <div className="relative px-8 pb-6">
          {/* Avatar */}
          <div
            className={`absolute -top-10 left-8 w-20 h-20 rounded-2xl ${colors.avatar} border-4 border-white shadow-lg flex items-center justify-center`}
          >
            <span className="text-white font-bold text-xl tracking-wide select-none">
              {getInitials(profile.fullName)}
            </span>
          </div>

          {/* Role badge — top right */}
          <div className="flex justify-end pt-4 pb-2">
            <span
              className={`text-xs font-semibold px-3 py-1 rounded-full ${colors.badge}`}
            >
              {colors.badgeText}
            </span>
          </div>

          {/* Name + subtitle */}
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-gray-900 leading-tight">
              {profile.fullName}
            </h1>
            {isTeacher && profile.title && profile.department ? (
              <p className="text-base text-gray-500 mt-1">
                {profile.title}
                <span className="mx-2 text-gray-300">·</span>
                {profile.department}
              </p>
            ) : isTeacher && profile.title ? (
              <p className="text-base text-gray-500 mt-1">{profile.title}</p>
            ) : profile.department ? (
              <p className="text-base text-gray-500 mt-1">
                {profile.department}
              </p>
            ) : (
              <p className="text-sm text-gray-400 mt-1">No subtitle provided</p>
            )}
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-100 mx-8" />

        {/* Detail fields */}
        <div className="px-8 py-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FieldCard
            icon={<Building2 className="size-5 text-header" />}
            label="Department"
            value={profile.department}
          />
          {isTeacher && (
            <FieldCard
              icon={<GraduationCap className="size-5 text-orange-500" />}
              label="Title"
              value={profile.title}
            />
          )}
        </div>
      </div>
    </div>
  );
};
