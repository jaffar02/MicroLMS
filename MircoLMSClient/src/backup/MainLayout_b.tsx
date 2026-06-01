import { Outlet } from "react-router-dom";

import logo from "@/assets/logo_main.svg";

import { Toaster } from "@/components/ui/sonner";

import { PowerIcon } from "@heroicons/react/24/solid";

import { toast } from "sonner";

import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";

import { useEffect } from "react";

export default function MainLayout() {
  const navigate = useNavigate();

  const { isAuthenticated, logout } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [navigate, isAuthenticated]);

  return (
    <div className="w-full h-full flex flex-col bg-white">
      <header className="fixed top-0 left-0 !w-full !h-13 bg-[#007bff] flex items-center justify-between !pl-4 z-50 shadow-md">
        <div className="flex items-center">
          <img src={logo} alt="logo" className="!h-20 !w-25 object-contain" />
        </div>

        {isAuthenticated && (
          <div className="px-2 py-1 mx-2 rounded cursor-pointer text-white hover:bg-blue-600">
            <PowerIcon
              className="h-6 w-6"
              onClick={() => {
                toast.success("Logged out successfully!");

                logout();
              }}
            />
          </div>
        )}
      </header>

      {/* Render page content */}

      <main className="flex-grow pt-4 overflow-y-auto">
        <Toaster />

        <Outlet />
      </main>
    </div>
  );
}
