"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/components/ui/sidebar";
import { IconBook, IconUser, IconPower } from "@tabler/icons-react";
import { motion } from "framer-motion"; // Note: Aceternity usually uses framer-motion
import { cn } from "@/lib/utils";
import { Outlet, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import logo from "@/assets/logo_main.svg";
import logo_collapsed from "@/assets/logo_main_collapsed.svg";

export default function MainLayout() {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate, isAuthenticated]);

  const handleLogout = () => {
    toast.success("Logged out successfully!");
    logout();
  };

  const links = [
    {
      label: "Courses",
      href: "/courses",
      icon: (
        <IconBook className="h-5 w-5 shrink-0 dark:text-neutral-700 text-neutral-200" />
      ),
    },
    {
      label: "Profile",
      href: "/profile",
      icon: (
        <IconUser className="h-5 w-5 shrink-0 dark:text-neutral-700 text-neutral-200" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-screen h-screen overflow-hidden",
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            {/* Logo - same pattern as SidebarLink */}
            <motion.div
              animate={{ paddingLeft: open ? "16px" : "18px" }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="mb-2"
            >
              <div className="flex items-center gap-2 py-2">
                <span className="flex items-center justify-center w-5 shrink-0">
                  <LogoIcon />
                </span>
                <motion.span
                  animate={{ width: open ? "auto" : 0, opacity: open ? 1 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  style={{ overflow: "hidden", whiteSpace: "nowrap" }}
                  className="text-neutral-200 font-bold text-base !p-0 !m-0"
                >
                  MICROLMS
                </motion.span>
              </div>
            </motion.div>

            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}

              <div onClick={handleLogout} className="cursor-pointer">
                <SidebarLink
                  link={{
                    label: "Logout",
                    href: "#",
                    icon: (
                      <IconPower className="h-5 w-5 shrink-0 text-red-500" />
                    ),
                  }}
                />
              </div>
            </div>
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto bg-white dark:bg-neutral-900 md:rounded-tl-2xl border-l border-neutral-200 dark:border-neutral-700">
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

// Custom Logo components using your SVG
export const Logo = () => {
  return (
    <Link to="/" className="flex items-center space-x-2 py-1 text-black">
      <img src={logo} alt="logo" className="h-6 w-20 object-contain" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-bold text-lg text-black dark:text-white"
      />
    </Link>
  );
};

export const LogoIcon = () => {
  return (
    <Link to="/" className="flex items-center py-1">
      <img src={logo_collapsed} alt="logo" className="h-6 w-8 object-contain" />
    </Link>
  );
};
