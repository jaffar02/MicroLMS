import React from "react";
import { useNavigate } from "react-router-dom";
import {
  BookOpenIcon,
  UsersIcon,
  ChartBarIcon,
} from "@heroicons/react/24/solid";
import { SparklesIcon } from "lucide-react";
import backgroundImage_ from "@/assets/bg1.jpg";

export default function HomeLayout() {
  const navigate = useNavigate();

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-[#f8faff] to-[#eef3ff] text-gray-800">
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${backgroundImage_})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(9px) brightness(0.9)", // Adjust blur and brightness here
          transform: "scale(1.1)", // Scaling up slightly prevents white edges from the blur
        }}
      />

      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center py-19 px-5 overflow-hidden">
          {/* Floating background circles */}
          <div className="absolute top-10 left-20 w-40 h-40 bg-[#5995fd]/60 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-20 right-24 w-52 h-52 bg-[#5995fd]/60 rounded-full blur-3xl animate-pulse"></div>

          <h1 className="text-5xl font-extrabold font-poppins text-white mb-4">
            Welcome to <span className="text-[#5995fd]">MicroLMS</span>
          </h1>
          <p className="text-lg text-white max-w-2xl mb-8">
            A modern, efficient, and beautiful Learning Management System built
            with{" "}
            <span className="font-semibold text-[#5995fd]">Spring Boot</span> &{" "}
            <span className="font-semibold text-[#5995fd]">React</span>.
          </p>

          <button
            onClick={() => navigate("/login")}
            className="bg-[#5995fd] text-white !font-semibold !my-4 !px-8 !py-3 !rounded-full !shadow-md hover:!shadow-lg hover:!bg-[#4c85ea] !transition-all !duration-300 hover:!scale-105"
          >
            Get Started
          </button>
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-8 md:px-16 mb-12">
          {/* Card 1 */}
          <div className="p-8 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
            <BookOpenIcon className="w-12 h-12 text-[#5995fd] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2 text-[#2b2b2b]">
              Assignments
            </h2>
            <p className="text-gray-800 leading-relaxed font-medium">
              Create, distribute, and grade assignments with ease. Empower
              educators and simplify student submissions.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-8 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
            <UsersIcon className="w-12 h-12 text-[#5995fd] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2 text-[#2b2b2b]">
              Collaboration
            </h2>
            <p className="text-gray-800 leading-relaxed font-medium">
              Foster communication and teamwork with real-time discussions,
              feedback, and group projects.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-8 bg-white/20 backdrop-blur-md rounded-2xl shadow-xl border border-white/30 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 group">
            <SparklesIcon className="w-12 h-12 text-[#5995fd] mb-4 group-hover:scale-110 transition-transform" />
            <h2 className="text-2xl font-semibold mb-2 text-[#2b2b2b]">
              Convenient <span className="text-[#5995fd]">&</span> Easy
            </h2>
            <p className="text-gray-800 leading-relaxed font-medium">
              Designed with simplicity in mind — navigate effortlessly, manage
              your courses, and focus on learning without distractions.
            </p>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center py-6 text-gray-500 text-sm">
          © {new Date().getFullYear()} MicroLMS. All rights reserved.
        </footer>
      </div>
    </div>
  );
}
