import { Loader2 } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCourseDialog = ({ isOpen, onClose, onSuccess }: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title || !description) return alert("Please fill in all fields");

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch("http://localhost:8080/api/course/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      if (response.status === 401) {
        toast.warning("Session expired. Please login again.", {
          position: "top-right",
        });
        return;
      }

      if (response.ok) {
        setTitle("");
        setDescription("");
        onSuccess(); // Refresh the parent list
        onClose(); // Close modal
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.log(errorData.message || "Failed to create course");
        toast.error("Failed to complete action.", {
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error creating course:", error);
      toast.error("Server is unreachable. Please check your connection.", {
        position: "top-right",
        description: "The request could not be completed.",
      });
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
          <h2 className="text-xl font-bold text-gray-800">Create New Course</h2>
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
              Course Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Advanced React Architecture"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-header/50 focus:border-header transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What will students learn?"
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-header/50 focus:border-header transition-all resize-none"
            />
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
    flex-1 h-11 flex items-center justify-center gap-2 
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
              "Create Course"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
