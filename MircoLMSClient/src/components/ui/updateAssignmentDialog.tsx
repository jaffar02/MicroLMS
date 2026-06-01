import { Loader2, Upload, X } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedAssignment: any) => void;
  assignment: any; // The assignment data to be edited
}

export const UpdateAssignmentDialog = ({
  isOpen,
  onClose,
  onSuccess,
  assignment,
}: Props) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Synchronize state with the selected assignment when dialog opens
  useEffect(() => {
    if (assignment && isOpen) {
      setTitle(assignment.title || "");
      setDescription(assignment.description || "");
      setTotalMarks(assignment.maxMarks?.toString() || "");

      // Format ISO date to YYYY-MM-DDTHH:MM for datetime-local input
      if (assignment.dueDate) {
        const date = new Date(assignment.dueDate);
        const formattedDate = date.toISOString().slice(0, 16);
        setDueDate(formattedDate);
      }
    }
  }, [assignment, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title || !description || !totalMarks || !dueDate) {
      return toast.error("Please fill in all required fields");
    }

    setLoading(true);
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/assignment/${assignment.id}/update`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            title,
            description,
            maxMarks: parseInt(totalMarks),
            dueDate: new Date(dueDate).toISOString(),
          }),
        },
      );

      if (response.ok) {
        const result = await response.json();
        const updatedAssignment = {
          ...assignment, // This is the old data containing the ID (202)
          ...result, // This is the new data from the server
        };
        toast.success("Assignment updated successfully!");
        onSuccess(updatedAssignment);
        onClose();
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "Failed to update assignment");
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
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs"
        onClick={onClose}
      />
      <div className="relative bg-white w-[calc(100%-2rem)] max-w-md rounded-2xl shadow-2xl p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Edit Assignment</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Marks
              </label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="w-full h-10 px-3 border rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="datetime-local"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full h-10 px-3 border rounded-lg text-[13px]"
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
              className="w-full px-4 py-2 border !rounded-lg resize-none"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border !rounded-xl hover:bg-gray-200"
          >
            Cancel
          </button>
          <button
            disabled={loading}
            onClick={handleSubmit}
            className="flex-1 h-11 flex items-center justify-center gap-2 bg-blue-600 text-white font-bold !rounded-xl hover:bg-blue-700 disabled:bg-blue-400"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <span className="tracking-wide">
                Save<span className="hidden sm:inline"> Changes</span>
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
