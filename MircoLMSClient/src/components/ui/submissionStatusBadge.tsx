import { CheckCircle2, Clock } from "lucide-react";
import { useEffect, useState } from "react";

export const SubmissionStatusBadge = ({ assignmentId }) => {
  const [isSubmitted, setIsSubmitted] = useState<boolean | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/submissions/${assignmentId}/getSubmissionStatus`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await response.json();
        setIsSubmitted(data); // Assuming backend returns true/false
      } catch (err) {
        setIsSubmitted(false);
      }
    };
    checkStatus();
  }, [assignmentId]);

  // While loading
  if (isSubmitted === null)
    return <div className="w-12 h-4 bg-gray-100 animate-pulse rounded" />;

  return (
    <div className="flex items-center self-center h-5 ml-2">
      {isSubmitted ? (
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
  );
};
