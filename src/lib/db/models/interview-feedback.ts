import mongoose, { Schema, Document, Model } from "mongoose";

export interface IApproachEvaluation {
  strengths: string[];
  weaknesses: string[];
  summary: string;
}

export interface ICodeCorrectness {
  passedTests: number;
  totalTests: number;
  passPercentage: number;
  notes: string;
}

export interface ICodeQuality {
  readabilityScore: number;
  maintainabilityScore: number;
  observations: string[];
}

export interface IComplexityFeedback {
  timeComplexity: string;
  spaceComplexity: string;
  notes: string;
}

export interface IEvidenceReferences {
  submissionId?: string;
  executedAt?: string;
  testSummary?: string;
}

export interface IInterviewFeedback extends Document {
  _id: mongoose.Types.ObjectId;
  roomId: mongoose.Types.ObjectId;
  candidateId: mongoose.Types.ObjectId;
  interviewerId: mongoose.Types.ObjectId;
  status: "generated" | "reviewed";
  problemId?: mongoose.Types.ObjectId;
  summary: string;
  approachEvaluation: IApproachEvaluation;
  codeCorrectness: ICodeCorrectness;
  algorithmicReasoning: string;
  codeQuality: ICodeQuality;
  edgeCaseAwareness: string;
  complexityAnalysis: IComplexityFeedback;
  recommendations: string[];
  interviewerNotes?: string;
  evidenceReferences: IEvidenceReferences;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): SafeInterviewFeedback;
}

export interface SafeInterviewFeedback {
  id: string;
  roomId: string;
  candidateId: string;
  interviewerId: string;
  status: "generated" | "reviewed";
  problemId?: string;
  summary: string;
  approachEvaluation: IApproachEvaluation;
  codeCorrectness: ICodeCorrectness;
  algorithmicReasoning: string;
  codeQuality: ICodeQuality;
  edgeCaseAwareness: string;
  complexityAnalysis: IComplexityFeedback;
  recommendations: string[];
  interviewerNotes?: string;
  evidenceReferences: IEvidenceReferences;
  generatedAt: string;
  updatedAt: string;
}

const ApproachSchema = new Schema<IApproachEvaluation>(
  {
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    summary: { type: String, required: true },
  },
  { _id: false }
);

const CorrectnessSchema = new Schema<ICodeCorrectness>(
  {
    passedTests: { type: Number, required: true, default: 0 },
    totalTests: { type: Number, required: true, default: 0 },
    passPercentage: { type: Number, required: true, default: 0 },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const QualitySchema = new Schema<ICodeQuality>(
  {
    readabilityScore: { type: Number, required: true, min: 1, max: 10, default: 7 },
    maintainabilityScore: { type: Number, required: true, min: 1, max: 10, default: 7 },
    observations: { type: [String], default: [] },
  },
  { _id: false }
);

const ComplexitySchema = new Schema<IComplexityFeedback>(
  {
    timeComplexity: { type: String, required: true },
    spaceComplexity: { type: String, required: true },
    notes: { type: String, default: "" },
  },
  { _id: false }
);

const EvidenceSchema = new Schema<IEvidenceReferences>(
  {
    submissionId: { type: String },
    executedAt: { type: String },
    testSummary: { type: String },
  },
  { _id: false }
);

const InterviewFeedbackSchema = new Schema<IInterviewFeedback>(
  {
    roomId: {
      type: Schema.Types.ObjectId,
      ref: "InterviewRoom",
      required: true,
    },
    candidateId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    interviewerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: ["generated", "reviewed"],
      default: "generated",
      required: true,
    },
    problemId: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
    },
    summary: {
      type: String,
      required: true,
    },
    approachEvaluation: {
      type: ApproachSchema,
      required: true,
    },
    codeCorrectness: {
      type: CorrectnessSchema,
      required: true,
    },
    algorithmicReasoning: {
      type: String,
      required: true,
    },
    codeQuality: {
      type: QualitySchema,
      required: true,
    },
    edgeCaseAwareness: {
      type: String,
      required: true,
    },
    complexityAnalysis: {
      type: ComplexitySchema,
      required: true,
    },
    recommendations: {
      type: [String],
      default: [],
    },
    interviewerNotes: {
      type: String,
      maxlength: 4096,
    },
    evidenceReferences: {
      type: EvidenceSchema,
      default: {},
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

InterviewFeedbackSchema.index({ roomId: 1 }, { unique: true });

InterviewFeedbackSchema.methods.toSafeObject = function (): SafeInterviewFeedback {
  return {
    id: this._id.toString(),
    roomId: this.roomId.toString(),
    candidateId: this.candidateId.toString(),
    interviewerId: this.interviewerId.toString(),
    status: this.status,
    problemId: this.problemId ? this.problemId.toString() : undefined,
    summary: this.summary,
    approachEvaluation: this.approachEvaluation,
    codeCorrectness: this.codeCorrectness,
    algorithmicReasoning: this.algorithmicReasoning,
    codeQuality: this.codeQuality,
    edgeCaseAwareness: this.edgeCaseAwareness,
    complexityAnalysis: this.complexityAnalysis,
    recommendations: this.recommendations || [],
    interviewerNotes: this.interviewerNotes,
    evidenceReferences: this.evidenceReferences || {},
    generatedAt: this.generatedAt ? this.generatedAt.toISOString() : new Date().toISOString(),
    updatedAt: this.updatedAt ? this.updatedAt.toISOString() : new Date().toISOString(),
  };
};

export const InterviewFeedback: Model<IInterviewFeedback> =
  mongoose.models.InterviewFeedback ||
  mongoose.model<IInterviewFeedback>("InterviewFeedback", InterviewFeedbackSchema);
