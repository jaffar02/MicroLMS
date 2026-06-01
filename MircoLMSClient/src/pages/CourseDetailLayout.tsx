import React, { useEffect, useState } from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  FileText,
  Plus,
  ChevronRight,
  CheckCircle2,
  Trash2,
  Pencil,
  UserMinus,
  ChevronDown,
  Clock,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CreateAssignmentDialog } from "@/components/ui/createAssignmentDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDeleteDialog } from "@/components/ui/deleteDialog";
import { UpdateAssignmentDialog } from "@/components/ui/updateAssignmentDialog";

export const CourseDetailLayout = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [isAssignmentCreationDialogOpen, setIsCreateAssignmentDialogOpen] =
    useState(false);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<any>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);

  // Update this array to include the new filter types
  const filterOptions = [
    { value: "all", label: "All", dot: null },
    { value: "due", label: "Due", dot: "bg-orange-500" },
    { value: "overdue", label: "Overdue", dot: "bg-red-600" },
    { value: "submitted", label: "Submitted", dot: "bg-green-600" },
    { value: "notSubmitted", label: "Not Submitted", dot: "bg-gray-400" },
    { value: "graded", label: "Graded", dot: "bg-blue-600" },
  ] as const;

  const [assignmentFilter, setAssignmentFilter] = useState<
    "all" | "due" | "overdue" | "graded" | "submitted" | "notSubmitted"
  >("all"); // 👈 NEW

  const [studentToUnenroll, setStudentToUnenroll] = useState<{
    email: string;
    name: string;
  } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [itemToEdit, setItemToEdit] = useState<any>(null);

  const handleUpdateSuccess = (updatedAssignment: any) => {
    setCourse((prev: any) => {
      if (!prev) return prev;
      const newAssignments = prev.assignments.map((asgn: any) => {
        if (String(asgn.id) === String(updatedAssignment.id)) {
          return { ...asgn, ...updatedAssignment };
        }
        return asgn;
      });
      return { ...prev, assignments: newAssignments };
    });
    setItemToEdit(null);
  };

  const handleConfirmUnenroll = async () => {
    if (!studentToUnenroll) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/course/unenroll`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            courseId,
            studentEmail: studentToUnenroll.email,
          }),
        },
      );
      if (response.ok) {
        setCourse((prev: any) => ({
          ...prev,
          enrolledStudents: prev.enrolledStudents.filter(
            (s: any) => s.email !== studentToUnenroll.email,
          ),
        }));
        toast.success(`${studentToUnenroll.name} has been unenrolled`);
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to unenroll student");
        return false;
      }
    } catch (error) {
      console.error("Unenroll error:", error);
      toast.error("A server error occurred");
      return false;
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setFilterOpen(false);
      }
    };

    if (filterOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [filterOpen]);

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/assignment/${itemToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );
      if (response.ok) {
        setCourse((prev: any) => ({
          ...prev,
          assignments: prev.assignments.filter(
            (a: any) => a.id !== itemToDelete.id,
          ),
        }));
        toast.success("Assignment deleted successfully");
        return true;
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || "Failed to delete assignment");
        return false;
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("A server error occurred");
      return false;
    }
  };

  useEffect(() => {
    const fetchCourseData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/course/${courseId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          setCourse(data);
        } else if (response.status === 404) {
          toast.error("Course not found");
          navigate("/courses");
        } else {
          toast.error("Server error occurred");
        }
      } catch (error) {
        console.error("Fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (courseId) fetchCourseData();
  }, [courseId, navigate]);

  const { user } = useAuth();
  const isTeacher = user?.roles.includes("TEACHER");

  const handleAssignmentSuccess = (newAssignment: any) => {
    if (!newAssignment || !newAssignment.title) {
      console.error("Received invalid assignment data:", newAssignment);
      return;
    }
    setCourse((prev: any) => ({
      ...prev,
      assignments: [
        { ...newAssignment, id: newAssignment.id || Date.now() },
        ...(prev?.assignments || []),
      ],
    }));
  };

  const getDueColorClasses = (dueDateString: string) => {
    if (!dueDateString) return { text: "text-gray-400", dot: "bg-gray-400" };
    const now = new Date();
    const due = new Date(dueDateString);
    const diffInMs = due.getTime() - now.getTime();
    const oneDayInMs = 24 * 60 * 60 * 1000;
    if (diffInMs < 0)
      return { text: "text-red-600 font-bold", dot: "bg-red-600" };
    else if (diffInMs < oneDayInMs)
      return { text: "text-orange-500 font-semibold", dot: "bg-orange-500" };
    else return { text: "text-green-600", dot: "bg-green-600" };
  };

  // 👇 NEW: filter + sort logic
  const getFilteredAssignments = () => {
    const now = new Date();

    // Base sort: Newest due date first
    const sorted = [...course.assignments].sort(
      (a: any, b: any) =>
        new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime(),
    );

    // 👇 EARLY EXIT: Teachers see everything, no filtering applied
    if (isTeacher) return sorted;

    // Student-specific filtering logic
    return sorted.filter((a: any) => {
      switch (assignmentFilter) {
        case "due":
          return new Date(a.dueDate) >= now && !a.submittedByStudent;
        case "overdue":
          return new Date(a.dueDate) < now && !a.submittedByStudent;
        case "submitted":
          return a.submittedByStudent === true;
        case "notSubmitted":
          return a.submittedByStudent === false;
        case "graded":
          return a.aquiredMarks !== null && a.aquiredMarks !== undefined;
        default: // "all"
          return true;
      }
    });
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!course) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">Could not load course data.</p>
        <button
          onClick={() => navigate("/courses")}
          className="text-blue-600 underline"
        >
          Go back to courses
        </button>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      <div className="w-full bg-gray-50/30 p-4 md:p-8">
        <button
          onClick={() => navigate("/courses")}
          className="flex items-center gap-2 text-blue-600 font-medium pt-2 pb-3 mb-6 hover:underline"
        >
          <ArrowLeft size={18} /> Back to Courses
        </button>

        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-8">
          <h1 className="!text-2xl md:!text-3xl font-bold text-gray-900 mb-2">
            {course.title}
          </h1>
          <p className="text-gray-600 leading-relaxed">{course.description}</p>
        </div>

        <div
          className={cn(
            "grid gap-6 lg:gap-8",
            isTeacher ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1",
          )}
        >
          {/* Enrolled Students Column */}
          {isTeacher && (
            <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col lg:h-[600px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Users className="text-purple-600" size={20} />
                  <h2 className="!text-xl md:!text-[27px] font-bold text-gray-800">
                    Enrolled Students
                  </h2>
                </div>
                <span className="bg-blue-100 text-blue-600 px-3 py-1 !rounded-full text-lg font-bold">
                  {course.enrolledStudents?.length || 0}
                </span>
              </div>
              <div className="lg:flex-1 lg:overflow-y-auto pr-2 custom-scrollbar space-y-3">
                {course.enrolledStudents.length > 0 ? (
                  course.enrolledStudents.map((student: any, index: number) => (
                    <div
                      key={student.email || index}
                      className="group flex items-center justify-between first:border-t border-b mb-0 gap-4 p-3 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-xs shrink-0 uppercase">
                          {student.name
                            ? student.name
                                .split(" ")
                                .map((n: string) => n[0])
                                .join("")
                                .slice(0, 2)
                            : "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-800 truncate">
                            {student.name || "Unknown Student"}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {student.email}
                          </p>
                        </div>
                      </div>
                      <button
                        className="flex items-center justify-center gap-1 px-3 py-2 md:px-3 md:py-2 !rounded-md text-red-600 hover:text-red-700 hover:bg-red-600/7 transition-all group shrink-0 ml-2 md:ml-4
                          !border-red-300 border md:!border-0 opacity-100 md:!opacity-0 md:group-hover:!opacity-100"
                        onClick={() => setStudentToUnenroll(student)}
                      >
                        <UserMinus className="size-4 md:size-5" />
                        <span className="font-medium text-sm hidden md:inline">
                          Unenroll
                        </span>
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60">
                    <Users size={40} strokeWidth={1} className="mb-2" />
                    <p className="text-sm font-medium">No students yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignments Column */}
          <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 flex flex-col lg:h-[600px]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <FileText className="text-orange-600" size={20} />
                <h2 className="!text-xl md:!text-[27px] font-bold text-gray-800">
                  Assignments
                </h2>
              </div>
              <div className="flex items-center gap-2">
                {/* 👇 NEW: Filter selector */}
                {!isTeacher && (
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setFilterOpen((p) => !p)}
                      className="flex items-center gap-1.5 text-xs font-medium border border-gray-200 !rounded-lg px-2.5 py-2 bg-white text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      {filterOptions.find((o) => o.value === assignmentFilter)
                        ?.dot && (
                        <span
                          className={`w-2 h-2 rounded-full shrink-0 ${filterOptions.find((o) => o.value === assignmentFilter)?.dot}`}
                        />
                      )}
                      <span>
                        {
                          filterOptions.find(
                            (o) => o.value === assignmentFilter,
                          )?.label
                        }
                      </span>
                      <ChevronDown
                        size={12}
                        className={cn(
                          "transition-transform",
                          filterOpen && "rotate-180",
                        )}
                      />
                    </button>

                    {filterOpen && (
                      <div
                        className="fixed bg-white border border-gray-200 !rounded-xl shadow-xl py-1 min-w-[130px] z-[9999]"
                        style={{
                          // Dynamically positions the fixed panel directly below the trigger button
                          top: filterRef.current
                            ? filterRef.current.getBoundingClientRect().bottom +
                              window.scrollY +
                              8
                            : "auto",
                          left: filterRef.current
                            ? filterRef.current.getBoundingClientRect().right -
                              130 +
                              window.scrollX
                            : "auto",
                        }}
                      >
                        {filterOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setAssignmentFilter(option.value);
                              setFilterOpen(false);
                            }}
                            className={cn(
                              "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-gray-50 transition-colors",
                              assignmentFilter === option.value
                                ? "text-blue-600"
                                : "text-gray-600",
                            )}
                          >
                            {option.dot ? (
                              <span
                                className={`w-2 h-2 rounded-full shrink-0 ${option.dot}`}
                              />
                            ) : (
                              <span className="w-2 h-2 rounded-full shrink-0 bg-gray-300" />
                            )}
                            {option.label}
                            {assignmentFilter === option.value && (
                              <CheckCircle2
                                size={12}
                                className="ml-auto text-blue-600"
                              />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {isTeacher && (
                  <button
                    onClick={() =>
                      isTeacher && setIsCreateAssignmentDialogOpen(true)
                    }
                    className="flex items-center justify-center gap-2 bg-blue-600 text-white p-2 md:px-4 md:py-2 !rounded-lg text-xs md:text-sm font-bold hover:bg-blue-700 transition-all shrink-0"
                  >
                    <Plus size={18} strokeWidth={3} />
                    <span className="hidden md:inline">Create Assignment</span>
                  </button>
                )}
              </div>
            </div>

            <div className="lg:flex-1 lg:overflow-y-auto pr-2 custom-scrollbar space-y-4">
              {/* 👇 NEW: Use filtered + sorted assignments */}
              {getFilteredAssignments().length > 0 ? (
                getFilteredAssignments().map((assignment: any) => (
                  <div
                    key={assignment.id}
                    className="cursor-pointer p-2 first:border-t border-b mb-0 bg-gray-50/30 hover:bg-white hover:shadow-md transition-all group"
                    onClick={() =>
                      navigate(
                        `/courses/${courseId}/assignments/${assignment.id}`,
                        {
                          state: {
                            assignment,
                            enrolledCount: isTeacher
                              ? course?.enrolledStudents?.length || 0
                              : 0,
                          },
                        },
                      )
                    }
                  >
                    <div className="flex items-center">
                      <h3 className="flex-1 font-bold !text-[18px] md:!text-[20px] text-gray-800 truncate group-hover:text-blue-600 transition-colors">
                        {assignment.title}
                      </h3>
                      {/* 👇 NEW: Submission Status Label for Students */}
                      {!isTeacher && (
                        <div className="flex items-center h-5 ml-2 shrink-0">
                          {assignment.submittedByStudent ? (
                            <CheckCircle2
                              size={18}
                              className="text-green-500 fill-green-50 transform translate-y-[0.5px]"
                              strokeWidth={2.5}
                            />
                          ) : (
                            <Clock
                              size={18}
                              className="text-orange-500 transform translate-y-[0.5px]"
                              strokeWidth={2.5}
                            />
                          )}
                        </div>
                      )}
                      {isTeacher && (
                        <div className="flex items-center gap-1 lg:opacity-0 group-hover:!opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToEdit(assignment);
                            }}
                            className={cn(
                              "p-1.5 transition-colors !rounded-s-md",
                              "text-blue-600 bg-blue-100",
                              "lg:text-gray-400 lg:bg-transparent lg:hover:text-blue-600 lg:hover:bg-blue-100",
                            )}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setItemToDelete({
                                id: assignment.id,
                                title: assignment.title,
                              });
                            }}
                            className={cn(
                              "p-1.5 transition-colors !rounded-e-md",
                              "text-red-600 bg-red-100",
                              "lg:text-gray-400 lg:bg-transparent lg:hover:text-red-600 lg:hover:bg-red-100",
                            )}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <span className="inline-flex items-center text-[10px] font-bold px-2 h-5 bg-gray-200 text-gray-700 rounded-md shrink-0 ml-2">
                        {assignment.maxMarks} pts
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-4">
                      {assignment.description}
                    </p>
                    <div className="flex items-center justify-end gap-3 mt-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {!isTeacher && (
                          <>
                            {/* 1. GRADED STATUS (Highest Priority) */}
                            {assignment.aquiredMarks !== null &&
                            assignment.aquiredMarks !== undefined ? (
                              (() => {
                                const percentage = Math.round(
                                  (assignment.aquiredMarks /
                                    assignment.maxMarks) *
                                    100,
                                );

                                // Helper to determine color based on percentage
                                const getColorClasses = (pct: number) => {
                                  if (pct < 40)
                                    return {
                                      stroke: "text-red-500",
                                      text: "text-red-700",
                                      bg: "border-red-100",
                                    };
                                  if (pct <= 70)
                                    return {
                                      stroke: "text-yellow-500",
                                      text: "text-yellow-700",
                                      bg: "border-yellow-100",
                                    };
                                  return {
                                    stroke: "text-blue-600",
                                    text: "text-blue-700",
                                    bg: "border-blue-100",
                                  };
                                };

                                const colors = getColorClasses(percentage);

                                return (
                                  <div
                                    className={`flex items-center gap-2 bg-white border ${colors.bg} rounded-xl px-2 py-1 shadow-sm h-11`}
                                  >
                                    {/* Scaled Down Circular Progress */}
                                    <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
                                      <svg className="w-full h-full transform -rotate-90">
                                        <circle
                                          cx="16"
                                          cy="16"
                                          r="13"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          fill="transparent"
                                          className="text-gray-100"
                                        />
                                        <circle
                                          cx="16"
                                          cy="16"
                                          r="13"
                                          stroke="currentColor"
                                          strokeWidth="3"
                                          fill="transparent"
                                          strokeDasharray={82}
                                          strokeDashoffset={
                                            82 - (percentage / 100) * 82
                                          }
                                          strokeLinecap="round"
                                          className={`${colors.stroke} transition-all duration-500`}
                                        />
                                      </svg>
                                      <span
                                        className={`absolute text-[8px] font-black ${colors.text}`}
                                      >
                                        {percentage}%
                                      </span>
                                    </div>

                                    {/* Tight Marks Text */}
                                    <div className="flex flex-col pr-1">
                                      <span className="text-[8px] font-black text-gray-400 tracking-widest uppercase leading-none mb-0.5">
                                        Graded
                                      </span>
                                      <div className="flex items-baseline gap-0.5">
                                        <span className="text-sm font-black text-gray-800 leading-none">
                                          {assignment.aquiredMarks}
                                        </span>
                                        <span className="text-[10px] font-bold text-gray-400">
                                          /
                                        </span>
                                        <span className="text-[11px] font-black text-gray-700 leading-none">
                                          {assignment.maxMarks}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : assignment.submittedByStudent ? (
                              /* 2. SUBMITTED STATUS */
                              <div className="flex items-center gap-1 text-[11px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">
                                <CheckCircle2
                                  size={12}
                                  className="fill-green-50"
                                />
                                Submitted:{" "}
                                {assignment.submissionDate
                                  ? new Date(
                                      assignment.submissionDate,
                                    ).toLocaleString("en-GB", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                      hour12: true,
                                    })
                                  : "Recently"}
                              </div>
                            ) : (
                              /* 3. DUE/OVERDUE STATUS */
                              <div
                                className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
                                  new Date(assignment.dueDate) < new Date()
                                    ? "text-red-500 bg-red-50"
                                    : "text-gray-400 bg-gray-50"
                                }`}
                              >
                                <span
                                  className={`w-2 h-2 !shrink-0 rounded-full ${getDueColorClasses(assignment.dueDate).dot}`}
                                />
                                {new Date(assignment.dueDate) < new Date()
                                  ? "Overdue: "
                                  : "Due: "}
                                {assignment.dueDate
                                  ? new Date(assignment.dueDate).toLocaleString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: true,
                                      },
                                    )
                                  : "No date"}
                              </div>
                            )}
                          </>
                        )}

                        {/* Teacher specific submission count */}
                        {isTeacher && (
                          <div className="flex items-center gap-1 text-[11px] text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={12} />
                            {assignment.submissions?.length || 0}/
                            {course.enrolledStudents.length} Submissions
                          </div>
                        )}
                      </div>
                      <button className="text-gray-300 group-hover:text-blue-500 transition-colors">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-60 py-8">
                  <FileText size={40} strokeWidth={1} className="mb-2" />
                  <p className="text-sm font-medium">
                    {assignmentFilter === "all"
                      ? "No assignments yet"
                      : `No ${assignmentFilter} assignments`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateAssignmentDialog
        isOpen={isAssignmentCreationDialogOpen}
        onClose={() => setIsCreateAssignmentDialogOpen(false)}
        onSuccess={handleAssignmentSuccess}
      />
      <ConfirmDeleteDialog
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmDelete}
        title={itemToDelete?.title || ""}
        dialogTitle="Delete Assignment"
        description="Are you sure you want to delete this assignment? All student submissions and grades associated with it will be permanently removed."
        confirmText="Delete Assignment"
      />
      <UpdateAssignmentDialog
        isOpen={!!itemToEdit}
        onClose={() => setItemToEdit(null)}
        onSuccess={handleUpdateSuccess}
        assignment={itemToEdit}
      />
      <ConfirmDeleteDialog
        isOpen={!!studentToUnenroll}
        onClose={() => setStudentToUnenroll(null)}
        onConfirm={handleConfirmUnenroll}
        title={studentToUnenroll?.name || ""}
        dialogTitle="Unenroll Student"
        description={
          <>
            Are you sure you want to unenroll{" "}
            <span className="font-bold text-gray-900">
              {studentToUnenroll?.name}
            </span>{" "}
            from this course? They will lose access to all assignments and
            materials.
          </>
        }
        confirmText="Unenroll"
      />
    </div>
  );
};
