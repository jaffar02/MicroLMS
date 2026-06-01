import "bootstrap/dist/css/bootstrap.min.css";
import {
  Route,
  Routes,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import HomeLayout from "./pages/HomeLayout";
import AuthLayout from "./pages/AuthLayout";
import MainLayout from "./pages/MainLayout";
import ForgotLayout from "./pages/ForgotLayout";

import { AnimatePresence, motion } from "framer-motion";
import ResetPassLayout from "./pages/ResetPassLayout";
import { CoursesLayout, DashboardLayout } from "./pages/CoursesLayout";

import type { JSX } from "react";
import PublicRoute from "./routes-protection/PublicRoute";
import ProtectedRoute from "./routes-protection/ProtectedRoute";
import PageNotFound from "./pages/PageNotFound";
import { VerificationLayout } from "./pages/VerificationLayout";
import { ProfileLayout } from "./pages/ProfileLayout";
import { CourseDetailLayout } from "./pages/CourseDetailLayout";
import { AssignmentDetailsLayout } from "./pages/AssignmentDetailsLayout";
import { PublicProfilePage } from "./pages/PublicProfilePage";

export default function App() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isBack = navigationType === "POP";

  const slideVariants = {
    enter: (isBack: boolean) => ({
      x: isBack ? "-100%" : "100%",
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (isBack: boolean) => ({
      x: isBack ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  const MotionWrapper = ({ children }: { children: JSX.Element }) => (
    <motion.div
      custom={isBack}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className="w-full h-full relative overflow-hidden"
    >
      {children}
    </motion.div>
  );

  return (
    <div className="h-full">
      <AnimatePresence mode="wait" custom={isBack}>
        <Routes location={location} key={location.pathname}>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <MotionWrapper>
                  <AuthLayout />
                </MotionWrapper>
              </PublicRoute>
            }
          />
          <Route
            path="/"
            element={
              <PublicRoute>
                <MotionWrapper>
                  <HomeLayout />
                </MotionWrapper>
              </PublicRoute>
            }
          />

          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <MotionWrapper>
                  <ResetPassLayout />
                </MotionWrapper>
              </PublicRoute>
            }
          />

          <Route
            path="/forgot"
            element={
              <PublicRoute>
                <MotionWrapper>
                  <ForgotLayout />
                </MotionWrapper>
              </PublicRoute>
            }
          />

          <Route
            path="/profile/:userId"
            element={
              <PublicRoute>
                <MotionWrapper>
                  <PublicProfilePage />
                </MotionWrapper>
              </PublicRoute>
            }
          />

          <Route element={<MainLayout />}>
            {/* ✅ Public Routes */}

            <Route
              path="/verify"
              element={
                <PublicRoute>
                  <MotionWrapper>
                    <VerificationLayout />
                  </MotionWrapper>
                </PublicRoute>
              }
            />

            {/* 🔒 Protected Routes */}
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <MotionWrapper>
                    <CoursesLayout />
                  </MotionWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId"
              element={
                <ProtectedRoute>
                  <MotionWrapper>
                    <CourseDetailLayout />
                  </MotionWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses/:courseId/assignments/:assignmentId"
              element={
                <ProtectedRoute>
                  <MotionWrapper>
                    <AssignmentDetailsLayout />
                  </MotionWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MotionWrapper>
                    <ProfileLayout />
                  </MotionWrapper>
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<PageNotFound />} />
          </Route>
        </Routes>
      </AnimatePresence>
    </div>
  );
}
