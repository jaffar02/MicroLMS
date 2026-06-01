export interface Submission {
  submissionId: number;
  assignmentId: number;
  studentEmail: string;
  submittedAt: string;
  files: string[];
  acquiredMarks: number | null;
}
