import { Loader2, Upload, X } from "lucide-react";
import React, { useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAssignment: any) => void;
}

export const CreateAssignmentDialog = ({
  isOpen,
  onClose,
  onSuccess,
}: Props) => {
  const { courseId } = useParams(); // Get courseId from URL
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!title || !description || !totalMarks || !dueDate) {
      return toast.error("Please fill in all required fields");
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      let response;
      const headers: Record<string, string> = {
        Authorization: `Bearer ${token}`,
      };

      // Check if we should use the files endpoint or the standard one
      if (files.length > 0) {
        const formData = new FormData();
        // The CreateAssignmentRequest fields (mapped via @ModelAttribute)
        formData.append("title", title);
        formData.append("description", description);
        formData.append("maxMarks", totalMarks);
        formData.append(
          "dueDate",
          new Date(dueDate).toISOString().split(".")[0].replace("Z", ""),
        );
        formData.append("courseId", courseId || "");

        // Append multiple files
        files.forEach((file) => {
          formData.append("files", file);
        });

        response = await fetch(
          "http://localhost:8080/api/assignment/create-with-files",
          {
            method: "POST",
            headers: headers, // Don't set Content-Type, browser sets it for FormData
            body: formData,
          },
        );
      } else {
        // Standard JSON Request
        response = await fetch("http://localhost:8080/api/assignment/create", {
          method: "POST",
          headers: {
            ...headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            maxMarks: parseInt(totalMarks),
            dueDate: new Date(dueDate).toISOString(),
            courseId: parseInt(courseId || "0"),
          }),
        });
      }

      if (response.status === 401) {
        toast.warning("Session expired. Please login again.");
        return;
      }

      if (response.ok) {
        toast.success("Assignment created successfully!");
        const result = await response.json();
        onSuccess(result);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to create assignment");
      }
    } catch (error) {
      toast.error("Server is unreachable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      <div className="relative bg-white w-[calc(100%-2rem)] max-w-md rounded-2xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Create Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assignment Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your assignment a clear heading..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-header/50 focus:border-header transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total Marks
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-[13px] cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the assignment..."
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-header/50 focus:border-header transition-all resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attachments (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Upload className="mx-auto text-gray-400 mb-2" size={24} />
              <span className="text-sm text-gray-500">
                Click to upload reference materials
              </span>
              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />
            </div>

            {files.length > 0 && (
              <div className="mt-3 space-y-2">
                {files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg text-xs"
                  >
                    <span className="truncate max-w-[200px] text-gray-600">
                      {file.name}
                    </span>
                    <button
                      onClick={() => removeFile(idx)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-white border hover:border-gray-200 text-gray-600 font-semibold !rounded-xl hover:!bg-gray-300/30 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="
    flex-1 h-13 flex items-center justify-center gap-2 
    px-4 py-2 bg-blue-600 text-white font-bold !rounded-xl 
    transition-all duration-200 
    hover:bg-blue-700 active:scale-[0.98] 
    disabled:bg-blue-400 disabled:cursor-not-allowed disabled:active:scale-100
    shadow-md shadow-blue-200/50
  "
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader2
                  className="w-4 h-4 animate-spin text-white/90"
                  strokeWidth={3}
                />
                <span className="tracking-wide">Creating...</span>
              </div>
            ) : (
              <span className="tracking-wide">
                Create<span className="hidden sm:inline"> Assignment</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
