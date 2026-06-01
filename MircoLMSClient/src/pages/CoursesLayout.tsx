import { CourseItem } from "@/components/ui/courseItem";
import { CreateCourseDialog } from "../components/ui/createCourseDialog";
import { useAuth } from "@/context/AuthContext";
import React, { useEffect, useState } from "react";
import type { Course } from "@/types/course";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "@/components/ui/deleteDialog";
import { UpdateCourseDialog } from "@/components/ui/updateCourseDialog";
import { Spinner } from "@/components/ui/spinner";
import { CourseSkeleton } from "@/components/ui/courseSkeleton";
import { EnrollCourseDialog } from "@/components/ui/EnrollCourseDialog";

export const CoursesLayout = () => {
  const [isDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEnrollDialogOpen, setIsEnrollDialogOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isTeacher = user?.roles.includes("TEACHER");
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [isFetching, setIsFetching] = useState(false); // For the spinner
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 10;

  const fetchCourses = async (attempt = 0) => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsFetching(false);
      return;
    }

    setIsFetching(true);
    try {
      const response = await fetch(
        "http://localhost:8080/api/course/list-courses",
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.status === 401) {
        setIsFetching(false);
        toast.warning("Session expired. Please login again.", {
          duration: 5000,
          position: "top-right",
        });
        logout();
        navigate("/login"); // Direct them back to login
        return;
      }

      if (!response.ok) throw new Error("Server error");

      const data = await response.json();
      setCourses(data);
      setRetryCount(0);
      setIsFetching(false);
    } catch (err: any) {
      const activeToken = localStorage.getItem("token");
      if (!activeToken) return;
      if (attempt < MAX_RETRIES) {
        const nextAttempt = attempt + 1;
        setRetryCount(nextAttempt);

        // Exponential backoff: Wait longer with each retry (1s, 2s, 4s...)
        const delay = Math.pow(2, attempt) * 1000;

        setTimeout(() => {
          if (localStorage.getItem("token")) {
            fetchCourses(nextAttempt);
          }
        }, delay);
      } else {
        setIsFetching(false);
        toast.error("Server unreachable after multiple attempts.", {
          duration: 2000,
          position: "top-right",
        });
      }
    }
  };

  const deleteCourse = async (courseId: number): Promise<boolean> => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:8080/api/course/${courseId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.ok) {
        // Update UI by filtering out the deleted course
        setCourses((prev) => prev.filter((c) => c.id !== courseId));
        toast.success("Course deleted successfully", {
          position: "top-right",
        });
        return true;
      } else {
        toast.error("An error encountered while deleting the course", {
          position: "top-right",
        });
        return false;
      }
    } catch (err: any) {
      toast.error(`Error deleting course: ${err.message}`, {
        duration: 2000,
        position: "top-right",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  return (
    <section className="flex flex-col p-4 h-full w-full">
      {/* The Bottom Right Spinner Container */}
      {isFetching && (
        <div className="fixed bottom-6 right-6 z-[100] flex items-center gap-3 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl border border-gray-100 shadow-xl animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="relative flex items-center justify-center">
            {/* Shadcn Spinner */}
            <Spinner className="w-5 h-5 text-blue-600" />

            {/* Optional: Add a subtle pulse effect behind the spinner if it's retrying */}
            {retryCount > 0 && (
              <span className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping" />
            )}
          </div>

          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800 leading-none">
              {retryCount > 0 ? "Reconnecting..." : "Syncing"}
            </span>
            {retryCount > 0 && (
              <span className="text-[10px] text-gray-500 font-medium mt-1 uppercase tracking-wider">
                Attempt {retryCount} of {MAX_RETRIES}
              </span>
            )}
          </div>
        </div>
      )}
      <div className="flex flex-row w-full items-center mt-2.5 mb-8">
        <p className="flex-1 font-poppins font-semibold text-2xl text-gray-700">
          My Courses
        </p>

        <div className="h-10">
          <button
            onClick={() =>
              isTeacher
                ? setIsCreateDialogOpen(true)
                : setIsEnrollDialogOpen(true)
            }
            className="
      flex items-center justify-start gap-2.5 
      pl-3 pr-5 
      !rounded-xl overflow-hidden 
      bg-header h-full w-fit min-w-[100px]
      cursor-pointer transition-all 
      hover:brightness-110 active:scale-95
    "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={3}
              stroke="currentColor"
              className="w-4 h-4 text-white shrink-0"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <p className="font-bold text-[13px] text-white whitespace-nowrap">
              {isTeacher ? "Create Course" : "Enroll"}
            </p>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
        {isFetching && courses.length === 0
          ? // Show 4 shimmering cards
            Array.from({ length: 6 }).map((_, i) => <CourseSkeleton key={i} />)
          : courses.length > 0
            ? // Show the actual course cards
              courses.map((course) => (
                <CourseItem
                  key={course.id}
                  course={course}
                  onClick={() =>
                    navigate(`/courses/${course.id}`, { state: { course } })
                  }
                  onDeleteClick={() => setCourseToDelete(course)}
                  onUpdateClick={() => setCourseToEdit(course)}
                />
              ))
            : // Show empty state only if not loading
              !isFetching && (
                <div className="col-span-full flex flex-col items-center justify-center min-h-[400px] h-full w-full py-20 text-gray-500 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
                  {/* Optional: Add an icon to make it look less empty */}
                  <div className="bg-gray-100 p-4 rounded-full mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>

                  <p className="font-semibold text-xl text-gray-700">
                    No courses found
                  </p>
                  <p className="text-gray-500 mt-1">
                    Click{" "}
                    <span className="text-blue-600 font-medium">
                      {isTeacher ? '"Create Course"' : '"Enroll"'}
                    </span>{" "}
                    to get started.
                  </p>
                </div>
              )}
      </div>

      <CreateCourseDialog
        isOpen={isDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSuccess={fetchCourses} // Pass the refresh function
      />

      <EnrollCourseDialog
        isOpen={isEnrollDialogOpen}
        onClose={() => setIsEnrollDialogOpen(false)}
        onSuccess={fetchCourses} // Pass the refresh function
      />

      <UpdateCourseDialog
        isOpen={!!courseToEdit}
        course={courseToEdit}
        onClose={() => setCourseToEdit(null)}
        onSuccess={fetchCourses}
      />

      <ConfirmDeleteDialog
        isOpen={!!courseToDelete}
        title={courseToDelete?.title || ""}
        onClose={() => setCourseToDelete(null)}
        onConfirm={async () => {
          if (courseToDelete) {
            // You MUST return the result of the async function here
            return await deleteCourse(courseToDelete.id);
          }
        }}
        dialogTitle="Delete Course"
      />
    </section>
  );
};
