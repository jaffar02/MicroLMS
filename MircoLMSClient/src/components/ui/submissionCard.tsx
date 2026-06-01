import { cn } from "@/lib/utils";
import { getFileName } from "@/pages/AssignmentDetailsLayout";
import { IconClockCheck } from "@tabler/icons-react";
import {
  CheckCircle2,
  Clock,
  Download,
  FileIcon,
  Paperclip,
  Timer,
} from "lucide-react";

export default function SubmissionCard({ submission, maxMarks, onGradeClick, onDownload }) {
  console.log(submission);
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-3 md:p-6 shadow-sm">
      {/* Header: Avatar, Info, and Grade Action */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Responsive Avatar: smaller on mobile */}
          <div className="w-10 h-10 md:w-12 md:h-12 shrink-0 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-base md:text-lg">
            {submission.studentEmail?.charAt(0).toUpperCase() || "S"}
          </div>

          <div className="min-w-0 flex-1">
            {/* Responsive Font Size: smaller on mobile to prevent overflow */}
            <h3 className="!text-base md:text-xl font-bold text-gray-800 truncate leading-tight">
              {submission.studentEmail}
            </h3>

            {/* Compact Date Badge */}
            <div className="flex items-center mt-1.5">
              <div className="flex items-center gap-1 px-2.5 py-0.5 md:px-3 md:py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-100 w-fit">
                <IconClockCheck
                  className="size-3.5 md:size-4 text-blue-600 shrink-0"
                  strokeWidth={2.5}
                />
                <span className="text-[11px] md:text-sm font-bold whitespace-nowrap">
                  {new Date(submission.submittedAt).toLocaleDateString(
                    "en-US",
                    {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    },
                  )}
                  <span className="mx-1 opacity-50">•</span>
                  {new Date(submission.submittedAt).toLocaleTimeString(
                    "en-US",
                    {
                      hour: "2-digit",
                      minute: "2-digit",
                    },
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-start">
          <div
            className={cn(
              "flex items-center gap-1.5 font-bold px-3 py-2 rounded-xl border transition-colors",
              submission.acquiredMarks !== null
                ? "text-green-600 bg-green-50 border-green-100"
                : "text-orange-600 bg-orange-50 border-orange-100",
            )}
          >
            {submission.acquiredMarks !== null ? (
              <CheckCircle2 size={18} />
            ) : (
              <Clock size={18} />
            )}
            <span>
              {submission.acquiredMarks !== null
                ? `${submission.acquiredMarks}/${maxMarks}`
                : `Pending/${maxMarks}`}
            </span>
          </div>
          <button
            onClick={() => onGradeClick(submission)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 !rounded-xl font-bold text-sm transition-all shadow-sm"
          >
            {submission.acquiredMarks !== null ? `Update` : `Grade`}
          </button>
        </div>
      </div>

      {/* Submitted Files */}
      <div className="mb-0">
        <p className="text-sm font-bold text-gray-700 pb-2">Submitted Files:</p>
        <div className="flex flex-wrap gap-3">
          {submission.files?.map((fileUrl, idx) => {
            // Use your existing helper to extract the clean name from the URL string
            const fileName = getFileName(fileUrl);
            return (
              <div
                key={idx}
                onClick={(e) => onDownload(e, fileUrl, fileName)}
                className="flex items-center gap-3 p-3 bg-gray-50 border !border-gray-200 rounded-xl hover:!border-blue-300 hover:!bg-white cursor-pointer transition-all group !shadow-sm"
              >
                <Paperclip
                  className="text-gray-500 group-hover:text-blue-600"
                  size={18}
                />
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-600 truncate max-w-[200px] md:max-w-md">
                  {fileName}
                </span>
                <Download
                  size={17}
                  className="text-header group-hover:text-blue-600"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
