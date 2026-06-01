  import React, { useState } from "react";
  import { AlertTriangle, Loader2, X } from "lucide-react";

  interface ConfirmDeleteDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => Promise<boolean | void>;
    title: string; // The name of the item (e.g., "Intro to React")
    dialogTitle?: string; // The header (e.g., "Delete Assignment")
    description?: React.ReactNode; // The warning message
    confirmText?: string; // Label for the red button
  }

  export const ConfirmDeleteDialog = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    dialogTitle = "Confirm Deletion",
    description,
    confirmText = "Delete",
  }: ConfirmDeleteDialogProps) => {
    const [isDeleting, setIsDeleting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
      setIsDeleting(true);
      try {
        const success = await onConfirm();
        if (success !== false) {
          onClose();
        }
      } catch (err) {
        console.error("Deletion logic failed", err);
      } finally {
        setIsDeleting(false);
      }
    };

    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Glass Backdrop */}
        <div
          className="absolute inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
          onClick={onClose}
        />

        {/* Dialog Box */}
        <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transform transition-all">
          <div className="p-6">
            <div className="flex items-start gap-4">
              {/* Warning Icon */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {dialogTitle}
                </h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                  {description ? (
                    description
                  ) : (
                    <>
                      Are you sure you want to delete{" "}
                      <span className="font-semibold text-gray-700">
                        "{title}"
                      </span>
                      ? This action cannot be undone.
                    </>
                  )}
                </p>
              </div>

              <button
                onClick={onClose}
                disabled={isDeleting}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-gray-50 px-6 py-4 flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-3 py-2 bg-white border hover:border-gray-200 text-gray-700 text-sm font-semibold !rounded-xl hover:!bg-gray-300/30 transition-all"
            >
              Cancel
            </button>

            <button
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 h-11 flex items-center justify-center gap-2 bg-red-600 text-white text-sm font-bold !rounded-xl transition-all duration-200 hover:bg-red-700 active:scale-[0.98] disabled:bg-red-400 disabled:cursor-not-allowed shadow-md shadow-red-200/50"
            >
              {isDeleting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2
                    className="w-4 h-4 animate-spin text-white/90"
                    strokeWidth={3}
                  />
                  <span className="tracking-wide">
                    Deleting<span className="hidden sm:inline">...</span>
                  </span>
                </div>
              ) : (
                <span className="tracking-wide">
                  {/* If text is "Delete Assignment", it hides " Assignment" on mobile */}
                  {confirmText === "Delete Assignment" ? (
                    <>
                      Delete
                      <span className="hidden sm:inline"> Assignment</span>
                    </>
                  ) : (
                    confirmText
                  )}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };
