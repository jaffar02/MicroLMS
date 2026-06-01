import React, { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  CircleCheck,
  Clock,
  Download,
  FileArchive,
  FileCode,
  FileIcon,
  FileImage,
  FileText,
  NotepadText,
  Pencil,
  Timer,
  Trash2,
  Users,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { UpdateAssignmentDialog } from "@/components/ui/updateAssignmentDialog";
import { ConfirmDeleteDialog } from "@/components/ui/deleteDialog";
import type { Submission } from "@/types/submission";
import SubmissionCard from "@/components/ui/submissionCard";
import { GradingDialog } from "@/components/ui/gradeSubmissionRequest";

export const getFileName = (path) => {
  if (!path) return "Unknown File";
  const parts = path.split("/");
  const lastPart = parts[parts.length - 1];
  return lastPart.length > 37 ? lastPart.substring(37) : lastPart;
};

export const AssignmentDetailsLayout = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { courseId, assignmentId } = useParams();
  const isTeacher = user?.roles.includes("TEACHER");
  const location = useLocation();
  const assignment = location.state?.assignment;
  const [loadingSubmissions, setLoadingSubmissions] = useState(isTeacher);
  const [submissions, setSubmissions] = useState<Submission | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [selectedSubmission, setSelectedSubmission] =
    useState<Submission | null>(null);
  const enrolledCount = location.state?.enrolledCount || 0;
  const [currentAssignment, setCurrentAssignment] = useState(
    location.state?.assignment || null,
  );
  const [loading, setLoading] = useState(!location.state?.assignment);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const submitAssignment = async () => {
    // Lock submission if no files exist in the current working queue
    const totalFilesAvailable =
      (submissions?.files?.length || 0) + selectedFiles.length;
    if (totalFilesAvailable === 0) {
      toast.error("Please attach at least one file before submitting.");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();

      // Append files to match your Spring Boot @RequestPart MultipartFile[] files
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      // 👇 ADD THIS: Append the list of previous server files the user decided to KEEP
      if (submissions?.files && submissions.files.length > 0) {
        submissions.files.forEach((path: string) => {
          formData.append("retainedFiles", path);
        });
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/submissions/${assignmentId}/submit`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success("Assignment submitted successfully!");
        setSubmissions(data); // Set backend status object mapping (contains data.files array)
        setIsSubmitted(true);
        setSelectedFiles([]); // Clear local temporary staging buffer
      } else {
        toast.error(data.error || "Failed to submit assignment.");
      }
    } catch (err) {
      console.error("Submission error:", err);
      toast.error("An error occurred while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const unsubmitAssignment = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/submissions/${assignmentId}/unsubmit`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();

      if (response.ok) {
        toast.success(
          "Submission withdrawn successfully. You can now edit attachments.",
        );
        setIsSubmitted(false);
        setSubmissions(data); // 👇 Keep data here instead of setting to null
        setSelectedFiles([]); // Start local queue fresh
      } else {
        toast.error(data.error || "Failed to unsubmit assignment.");
      }
    } catch (err) {
      console.error("Unsubmit error:", err);
      toast.error("An error occurred while withdrawing submission.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentAssignment) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/assignment/${currentAssignment.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        toast.success("Assignment deleted successfully");
        // Redirect back to course page since this assignment no longer exists
        navigate(`/courses/${courseId}`);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.error || "Failed to delete assignment");
        return false;
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("A server error occurred");
      return false;
    }
  };

  const handleGradeSubmission = async (submissionId, acquiredMarks) => {
    const token = localStorage.getItem("token");
    const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/api/submissions`;

    // Helper to update local state after a successful fetch
    const updateLocalState = () => {
      setSubmissions((prev) =>
        prev.map((s) =>
          s.submissionId === submissionId
            ? { ...s, acquiredMarks: Number(acquiredMarks) }
            : s,
        ),
      );
      toast.success("Graded successfully");
      setSelectedSubmission(null);
    };

    try {
      // 1. Attempt Initial Grade
      const response = await fetch(`${baseUrl}/grade`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courseId: Number(courseId),
          submissionId: Number(submissionId),
          marks: Number(acquiredMarks),
        }),
      });

      if (response.ok) {
        updateLocalState();
        return true;
      }

      // 2. Handle "Already Graded" by calling the Update endpoint
      const errorData = await response.json().catch(() => ({}));

      if (errorData.error === "Submission already graded.") {
        // Note the format: /grade/{id}?marks={value}
        const updateUrl = `${baseUrl}/grade/${submissionId}?marks=${acquiredMarks}`;

        const updateResponse = await fetch(updateUrl, {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            // No "Content-Type" needed if the body is empty, but harmless to keep
          },
        });

        if (updateResponse.ok) {
          updateLocalState();
          return true;
        } else {
          const updateError = await updateResponse.json().catch(() => ({}));
          toast.error(updateError.error || "Failed to update grade");
          return false;
        }
      }

      // 3. Handle any other specific errors
      toast.error(errorData.error || "Failed to grade submission");
      return false;
    } catch (error) {
      console.error("Grading error:", error);
      toast.error("A server error occurred");
      return false;
    }
  };

  const fetchSubmissions = useCallback(async () => {
    if (!isTeacher) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/submissions/assignment/${assignmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setSubmissions(data);
      }
    } catch (err) {
      console.error("Failed to fetch submissions:", err);
    } finally {
      setLoadingSubmissions(false);
    }
  }, [assignmentId, isTeacher]);

  useEffect(() => {
    if (isTeacher) {
      fetchSubmissions();
    }
  }, [fetchSubmissions, isTeacher]);

  const handleUpdateSuccess = (updatedData: any) => {
    setCurrentAssignment(updatedData);
    // Optional: Update the browser history state so it persists on refresh
    window.history.replaceState(
      { ...location.state, assignment: updatedData },
      "",
    );
  };

  useEffect(() => {
    if (isTeacher) return;

    const fetchSubmissionStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/submissions/${assignmentId}/getSubmissionStatus`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (response.ok) {
          const data = await response.json();
          console.log("Submission Status Data: ", data);

          if (data && data.status === "SUBMITTED") {
            setIsSubmitted(true);
            setSubmissions(data);
            setSelectedFiles([]);
          } else if (data && data.status === "DRAFT") {
            setIsSubmitted(false); // Editable mode!
            setSubmissions(data); // Keeps files on layout screen from database draft references
          } else {
            setIsSubmitted(false);
            setSubmissions(null);
            setSelectedFiles([]);
          }
        }
      } catch (err) {
        console.error("Error fetching submission status:", err);
      }
    };

    // 3. Execute the function immediately
    fetchSubmissionStatus();
  }, [assignmentId, isTeacher]);

  const getFileIcon = (fileName) => {
    const ext = fileName.split(".").pop()?.toLowerCase();

    switch (ext) {
      case "pdf":
        return {
          icon: <FileText size={20} />,
          color: "text-red-500",
          bg: "bg-red-50",
          border: "border-red-100",
        };
      case "doc":
      case "docx":
        return {
          icon: <FileText size={20} />,
          color: "text-blue-600",
          bg: "bg-blue-50",
          border: "border-blue-100",
        };
      case "zip":
      case "rar":
      case "7z":
        return {
          icon: <FileArchive size={20} />,
          color: "text-orange-500",
          bg: "bg-orange-50",
          border: "border-orange-100",
        };
      case "png":
      case "jpg":
      case "jpeg":
      case "svg":
        return {
          icon: <FileImage size={20} />,
          color: "text-emerald-500",
          bg: "bg-emerald-50",
          border: "border-emerald-100",
        };
      case "js":
      case "ts":
      case "jsx":
      case "py":
      case "html":
      case "css":
        return {
          icon: <FileCode size={20} />,
          color: "text-purple-500",
          bg: "bg-purple-50",
          border: "border-purple-100",
        };
      default:
        return {
          icon: <FileIcon size={20} />,
          color: "text-gray-500",
          bg: "bg-gray-50",
          border: "border-gray-100",
        };
    }
  };

  // 2. Function to fetch assignment if user refreshes the page
  const fetchAssignmentData = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/assignment/${assignmentId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentAssignment({
          ...data,
          id: data.id || assignmentId, // Use existing ID if backend missed it
        });
      } else {
        toast.error("Failed to load assignment data.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [assignmentId]);

  // 3. Handle refresh or missing data
  useEffect(() => {
    if (!currentAssignment) {
      fetchAssignmentData();
    }
  }, [currentAssignment, fetchAssignmentData]);

  const handleDownload = async (e, fileUrl, fileName) => {
    e.stopPropagation();
    const toastId = toast.loading("Preparing download...");

    try {
      // 1. Get your token (assuming it's in localStorage or your AuthContext)
      const token = localStorage.getItem("token");

      // 2. Fetch the file with Authorization headers
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}${fileUrl}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) throw new Error("Failed to download file");

      // 3. Convert response to a Blob (Binary Large Object)
      const blob = await response.blob();

      // 4. Create a temporary local URL for the blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName); // Uses the clean filename

      document.body.appendChild(link);
      link.click();

      // 5. Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Download complete", { id: toastId });
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Could not download file. You might not have permission.", {
        id: toastId,
      });
    }
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        Loading...
      </div>
    );

  if (!currentAssignment) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <p>Assignment data not found.</p>
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="text-blue-600 underline"
        >
          Return to Course
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-y-auto">
      <div className="min-h-screen w-full bg-gray-50/30 p-4 md:p-8">
        <button
          onClick={() => navigate(`/courses/${courseId}`)}
          className="flex items-center gap-2 text-blue-600 font-medium pt-2 pb-3 mb-6 hover:underline"
        >
          <ArrowLeft size={18} /> Back to Course
        </button>

        <div className="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-gray-100 mb-8">
          <div className="flex items-center justify-between gap-4 mb-2">
            <h1 className="!text-2xl md:!text-3xl font-bold text-gray-900 mb-2 truncate">
              {currentAssignment.title}
            </h1>
            {isTeacher && (
              <div className="flex items-center flex-row gap-2 md:gap-3 shrink-0">
                {/* Edit Button */}
                <button
                  className="flex items-center gap-2 px-2.5 py-1.5 md:px-4 border !border-blue-600 text-blue-600 !rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsUpdateDialogOpen(true);
                  }}
                >
                  <Pencil className="size-4 md:size-4" strokeWidth={2.5} />
                  <span className="hidden md:inline">Edit</span>
                </button>

                {/* Delete Button */}
                <button
                  className="flex items-center gap-2 px-2.5 py-1.5 md:px-4 border !border-red-500 text-red-500 !rounded-lg font-bold text-sm hover:bg-red-50 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setItemToDelete(currentAssignment);
                  }}
                >
                  <Trash2 className="size-4 md:size-4" strokeWidth={2.5} />
                  <span className="hidden md:inline">Delete</span>
                </button>
              </div>
            )}
          </div>
          <p className="text-gray-600 leading-relaxed max-w-6xl">
            {currentAssignment.description}
          </p>
          <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-4 py-2">
            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 !bg-orange-50 text-orange-700 rounded-full border !border-orange-100 w-fit">
                <Timer className="size-4 text-orange-600" strokeWidth={2.5} />
                <span className="text-sm font-bold">
                  Due:{" "}
                  {new Date(currentAssignment.dueDate).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                  <span className="mx-1.5 opacity-50">•</span>
                  {new Date(currentAssignment.dueDate).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-gray-600 mt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 !bg-green-50 text-green-700 rounded-full border !border-green-100 w-fit">
                <NotepadText
                  className="size-4 text-green-600"
                  strokeWidth={2.5}
                />
                <span className="text-sm font-bold">
                  Max Marks: {currentAssignment.maxMarks}
                </span>
              </div>
            </div>
            {isTeacher && (
              <div className="flex items-center gap-2 text-gray-600 mt-2">
                <div className="flex items-center gap-1.5 px-3 py-1 !bg-blue-50 text-blue-700 rounded-full border !border-blue-100 w-fit">
                  <CircleCheck
                    className="size-4 text-blue-600"
                    strokeWidth={2.5}
                  />
                  <span className="text-sm font-bold">
                    Submissions: {currentAssignment.submissions?.length || 0}/
                    {enrolledCount}
                  </span>
                </div>
              </div>
            )}
          </div>
          {currentAssignment.materials &&
            currentAssignment.materials.length > 0 && (
              <div className="space-y-2">
                <span className="text-gray-900 text font-bold flex items-center gap-2">
                  Assignment Materials:
                </span>

                {currentAssignment.materials &&
                currentAssignment.materials.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {currentAssignment.materials.map((file, index) => {
                      const fileMeta = getFileIcon(file); // Get icon and colors
                      const fileName = getFileName(file);

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between group max-w-2xl p-3 bg-white border border-gray-100 rounded-xl hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
                          onClick={(e) => handleDownload(e, file, fileName)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`p-2 rounded-lg border ${fileMeta.bg} ${fileMeta.color} ${fileMeta.border} shadow-sm`}
                            >
                              {fileMeta.icon}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900 truncate max-w-[200px] md:max-w-md">
                                {getFileName(file)}
                              </span>
                              <span className="text-[10px] uppercase font-bold text-gray-400">
                                {file.split(".").pop()} File
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pr-2">
                            <div className="p-2 text-gray-400 group-hover:text-blue-600 group-hover:bg-blue-50 rounded-full transition-colors">
                              <Download size={18} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 italic">
                    No materials attached.
                  </p>
                )}
              </div>
            )}

          {/* TEACHER ONLY: Submissions Section */}
          {isTeacher && (
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2 px-2">
                <span className="text-gray-900 text-xl font-bold flex items-center gap-2">
                  Student Submissions:
                </span>
              </div>

              {loadingSubmissions ? (
                <div className="p-8 text-center text-gray-500 animate-pulse">
                  Loading submissions...
                </div>
              ) : submissions.length > 0 ? (
                <div className="space-y-4">
                  {submissions.map((sub: any) => (
                    <SubmissionCard
                      key={sub.id}
                      submission={sub}
                      maxMarks={currentAssignment.maxMarks}
                      onDownload={handleDownload}
                      onGradeClick={() => setSelectedSubmission(sub)}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm">
                  <Users
                    className="mx-auto text-gray-300 mb-4"
                    size={48}
                    strokeWidth={1}
                  />
                  <p className="text-gray-500 font-medium">
                    No submissions received yet.
                  </p>
                </div>
              )}
            </div>
          )}

          {!isTeacher && (
            <div className="pt-3">
              <span className="text-gray-900 font-bold flex items-center gap-2">
                Your Submission
              </span>

              <p className="text-[13px] text-gray-500 mb-2">
                {isSubmitted
                  ? "Your assignment has been turned in. Unsubmit to change files."
                  : "Attach your completed assignment files before submitting."}
              </p>

              {/* Hidden Native File Input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                multiple
                onChange={(e) => {
                  if (e.target.files) {
                    const newFiles = Array.from(e.target.files);
                    setSelectedFiles((prev) => [...prev, ...newFiles]);
                    e.target.value = "";
                  }
                }}
                disabled={isSubmitted}
              />

              {/* Dropzone Box: Visible ONLY when editable (not submitted) */}
              {!isSubmitted && (
                <div
                  className="border-2 max-w-2xl mt-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50/50 hover:!bg-gray-50/80 hover:border-header transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="w-12 h-12 !rounded-full !bg-blue-100 flex items-center justify-center text-blue-600 mb-3 group-hover:!scale-110 transition-transform">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                  </div>

                  <p className="text-sm font-semibold text-gray-700">
                    Drag & drop files here, or{" "}
                    <span className="text-blue-600 hover:underline">
                      browse
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    PDF, ZIP, PY, TXT — up to 50 MB each
                  </p>
                </div>
              )}

              {/* Unified Files Container List */}
              {((submissions?.files && submissions.files.length > 0) ||
                selectedFiles.length > 0) && (
                <div className="!mt-3 max-w-2xl space-y-1.5">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {isSubmitted ? "Submitted Files" : "Draft / Staged Files"} (
                    {(submissions?.files?.length || 0) + selectedFiles.length})
                  </p>

                  {/* 👇 RENDERS FILES THAT EXIST ON THE SERVER (SUBMITTED OR DRAFT) */}
                  {submissions?.files?.map((fileUrl: string, index: number) => {
                    const urlParts = fileUrl.split("/");
                    const rawName = urlParts[urlParts.length - 1] || "File";
                    const cleanName = rawName.includes("-")
                      ? rawName.substring(rawName.indexOf("-") + 1)
                      : rawName;

                    return (
                      <div
                        key={`db-${index}`}
                        className="flex mt-2 items-center justify-between bg-blue-50/40 border border-blue-100/60 rounded-xl px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 truncate text-gray-700 font-medium">
                          <span className="text-blue-600 font-bold">📄</span>
                          <a
                            href={`${import.meta.env.VITE_API_BASE_URL}${fileUrl}`}
                            target="_blank"
                            rel="noreferrer"
                            className="truncate hover:text-blue-600 hover:underline cursor-pointer font-semibold"
                          >
                            {cleanName}
                          </a>
                          {!isSubmitted && (
                            <span className="text-[10px] text-blue-500 bg-blue-100/50 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                              Server Draft
                            </span>
                          )}
                        </div>

                        {/* Allow removing from the local visualization if editing a draft */}
                        {!isSubmitted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSubmissions((prev: any) => ({
                                ...prev,
                                files: prev.files.filter(
                                  (_: any, i: number) => i !== index,
                                ),
                              }));
                            }}
                            className="text-gray-400 hover:text-red-500 font-bold px-2 py-1 text-sm transition-colors duration-150"
                            title="Remove file"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {/* 👇 RENDERS NEW STAGED LOCAL FILES IN EDIT MODE */}
                  {!isSubmitted &&
                    selectedFiles.map((file, index) => (
                      <div
                        key={`local-${file.name}-${index}`}
                        className="flex mt-2 items-center justify-between bg-emerald-50/30 border border-emerald-100 rounded-xl px-3 py-2 text-xs animate-fadeIn"
                      >
                        <div className="flex items-center gap-2 truncate text-gray-700 font-medium">
                          <span className="text-emerald-500 font-bold">📎</span>
                          <span className="truncate text-gray-700 font-semibold">
                            {file.name}
                          </span>
                          {file.size > 0 && (
                            <span className="text-gray-400 font-normal shrink-0">
                              ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                            </span>
                          )}
                          <span className="text-[10px] text-emerald-600 bg-emerald-100/50 px-1.5 py-0.5 rounded font-bold uppercase shrink-0">
                            New
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFiles((prev) =>
                              prev.filter((_, i) => i !== index),
                            );
                          }}
                          className="text-gray-400 hover:text-red-500 font-bold px-2 py-1 text-sm transition-colors duration-150"
                          title="Delete attachment"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                </div>
              )}

              {/* Primary Control Action Button */}
              {/* Primary Control Action Button */}
              <button
                className={cn(
                  "py-1.5 px-3 mt-4 !rounded-xl font-medium text-[13px] transition-all duration-200 ease-in-out text-white active:scale-95",
                  isSubmitted
                    ? "!bg-red-600 hover:!bg-red-500 hover:!text-white shadow-md shadow-red-600/20 hover:shadow-lg hover:shadow-red-500/30"
                    : "!bg-blue-600 hover:!bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-700/30",

                  // 👇 UPDATE THIS CONDITION (Allow submit if server draft files exist OR new files are queued)
                  (isSubmitting ||
                    (!isSubmitted &&
                      (submissions?.files?.length || 0) === 0 &&
                      selectedFiles.length === 0)) &&
                    "opacity-50 cursor-not-allowed active:scale-100 hover:!bg-blue-600 !shadow-none",
                )}
                disabled={
                  isSubmitting ||
                  (!isSubmitted &&
                    (submissions?.files?.length || 0) === 0 &&
                    selectedFiles.length === 0)
                }
                onClick={() => {
                  if (isSubmitted) {
                    unsubmitAssignment();
                  } else {
                    submitAssignment();
                  }
                }}
              >
                {isSubmitting
                  ? "Processing..."
                  : isSubmitted
                    ? "Unsubmit"
                    : "Submit Assignment"}
              </button>
            </div>
          )}
        </div>

        {selectedSubmission && (
          <GradingDialog
            submission={selectedSubmission}
            maxMarks={currentAssignment?.maxMarks}
            onClose={() => setSelectedSubmission(null)}
            onSubmit={handleGradeSubmission}
          />
        )}

        <UpdateAssignmentDialog
          isOpen={isUpdateDialogOpen}
          onClose={() => setIsUpdateDialogOpen(false)}
          onSuccess={handleUpdateSuccess}
          assignment={currentAssignment}
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
      </div>
    </div>
  );
};
