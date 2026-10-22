import mongoose, { Schema, Document, Model } from "mongoose";

export type SubmissionStatus =
  | "accepted"
  | "wrong_answer"
  | "compilation_error"
  | "runtime_error"
  | "time_limit_exceeded"
  | "service_unavailable";

export interface ITestEvaluationResult {
  testId: string;
  order: number;
  isHidden: boolean;
  passed: boolean;
  status: string;
  durationMs?: number;
  memoryKb?: number;
  input?: string; // Only populated for non-hidden tests
  expectedOutput?: string; // Only populated for non-hidden tests
  actualOutput?: string; // Only populated for non-hidden tests
  errorMessage?: string;
}

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  problemId?: mongoose.Types.ObjectId;
  language: string;
  codeSnapshot: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
  memoryKb?: number;
  testResults: ITestEvaluationResult[];
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): SafeSubmission;
}

export interface SafeSubmission {
  id: string;
  roomId: string;
  userId: string;
  problemId?: string;
  language: string;
  codeSnapshot: string;
  status: SubmissionStatus;
  passedTests: number;
  totalTests: number;
  runtimeMs?: number;
  memoryKb?: number;
  testResults: ITestEvaluationResult[];
  submittedAt: string;
  createdAt: string;
}

const TestEvaluationResultSchema = new Schema<ITestEvaluationResult>(
  {
    testId: { type: String, required: true },
    order: { type: Number, default: 0 },
    isHidden: { type: Boolean, default: false },
    passed: { type: Boolean, required: true },
    status: { type: String, required: true },
    durationMs: { type: Number },
    memoryKb: { type: Number },
    input: { type: String },
    expectedOutput: { type: String },
    actualOutput: { type: String },
    errorMessage: { type: String },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewRoom",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
      index: true,
    },
    language: {
      type: String,
      required: true,
    },
    codeSnapshot: {
      type: String,
      required: true,
      maxlength: [65536, "Code snapshot cannot exceed 64KB"],
    },
    status: {
      type: String,
      enum: [
        "accepted",
        "wrong_answer",
        "compilation_error",
        "runtime_error",
        "time_limit_exceeded",
        "service_unavailable",
      ],
      required: true,
      index: true,
    },
    passedTests: {
      type: Number,
      required: true,
      default: 0,
    },
    totalTests: {
      type: Number,
      required: true,
      default: 0,
    },
    runtimeMs: {
      type: Number,
    },
    memoryKb: {
      type: Number,
    },
    testResults: {
      type: [TestEvaluationResultSchema],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

SubmissionSchema.index({ roomId: 1, submittedAt: -1 });
SubmissionSchema.index({ userId: 1, submittedAt: -1 });

SubmissionSchema.methods.toSafeObject = function (): SafeSubmission {
  // Ensure hidden test cases never leak confidential inputs/outputs
  const sanitizedTestResults: ITestEvaluationResult[] = (this.testResults || []).map(
    (tr: ITestEvaluationResult) => {
      if (tr.isHidden) {
        return {
          testId: tr.testId,
          order: tr.order,
          isHidden: true,
          passed: tr.passed,
          status: tr.status,
          durationMs: tr.durationMs,
          memoryKb: tr.memoryKb,
          errorMessage: tr.passed ? undefined : "Hidden test did not produce expected output",
        };
      }
      return {
        testId: tr.testId,
        order: tr.order,
        isHidden: false,
        passed: tr.passed,
        status: tr.status,
        durationMs: tr.durationMs,
        memoryKb: tr.memoryKb,
        input: tr.input,
        expectedOutput: tr.expectedOutput,
        actualOutput: tr.actualOutput,
        errorMessage: tr.errorMessage,
      };
    }
  );

  return {
    id: this._id.toString(),
    roomId: this.roomId.toString(),
    userId: this.userId.toString(),
    problemId: this.problemId ? this.problemId.toString() : undefined,
    language: this.language,
    codeSnapshot: this.codeSnapshot,
    status: this.status,
    passedTests: this.passedTests,
    totalTests: this.totalTests,
    runtimeMs: this.runtimeMs,
    memoryKb: this.memoryKb,
    testResults: sanitizedTestResults,
    submittedAt: this.submittedAt ? this.submittedAt.toISOString() : new Date().toISOString(),
    createdAt: this.createdAt ? this.createdAt.toISOString() : new Date().toISOString(),
  };
};

export const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>("Submission", SubmissionSchema);
