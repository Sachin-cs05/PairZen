import mongoose, { Schema, Document, Model } from "mongoose";

export type ProblemDifficulty = "easy" | "medium" | "hard";

export interface ITestCase {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
  explanation?: string;
  order: number;
}

export interface IProblem extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty;
  supportedLanguages: string[];
  starterCode: Map<string, string>;
  constraints: string[];
  testCases: ITestCase[];
  createdAt: Date;
  updatedAt: Date;
  toSafeObject(): SafeProblem;
}

export interface SafeTestCase {
  id: string;
  input?: string; // Only present if isHidden === false
  expectedOutput?: string; // Only present if isHidden === false
  isHidden: boolean;
  explanation?: string;
  order: number;
}

export interface SafeProblem {
  id: string;
  title: string;
  slug: string;
  description: string;
  difficulty: ProblemDifficulty;
  supportedLanguages: string[];
  starterCode: Record<string, string>;
  constraints: string[];
  testCases: SafeTestCase[]; // Hidden inputs/outputs strictly omitted
  sampleCases: SafeTestCase[];
  totalTestCases: number;
}

const TestCaseSchema = new Schema<ITestCase>(
  {
    id: { type: String, required: true },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    isHidden: { type: Boolean, default: false },
    explanation: { type: String },
    order: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProblemSchema = new Schema<IProblem>(
  {
    title: {
      type: String,
      required: [true, "Problem title is required"],
      trim: true,
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    slug: {
      type: String,
      required: [true, "Problem slug is required"],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, "Problem description is required"],
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
      required: true,
      index: true,
    },
    supportedLanguages: {
      type: [String],
      default: ["typescript", "javascript", "python", "java", "cpp", "go", "rust"],
    },
    starterCode: {
      type: Map,
      of: String,
      default: {},
    },
    constraints: {
      type: [String],
      default: [],
    },
    testCases: {
      type: [TestCaseSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);


ProblemSchema.methods.toSafeObject = function (): SafeProblem {
  const starterCodeObj: Record<string, string> = {};
  if (this.starterCode instanceof Map) {
    this.starterCode.forEach((value: string, key: string) => {
      starterCodeObj[key] = value;
    });
  } else if (this.starterCode && typeof this.starterCode === "object") {
    Object.assign(starterCodeObj, this.starterCode);
  }

  // Filter test cases: strictly omit input & expectedOutput for hidden cases
  const sanitizedTestCases: SafeTestCase[] = (this.testCases || []).map((tc: ITestCase) => {
    if (tc.isHidden) {
      return {
        id: tc.id,
        isHidden: true,
        order: tc.order,
      };
    }
    return {
      id: tc.id,
      input: tc.input,
      expectedOutput: tc.expectedOutput,
      isHidden: false,
      explanation: tc.explanation,
      order: tc.order,
    };
  });

  const sampleCases = sanitizedTestCases.filter((tc) => !tc.isHidden);

  return {
    id: this._id.toString(),
    title: this.title,
    slug: this.slug,
    description: this.description,
    difficulty: this.difficulty,
    supportedLanguages: this.supportedLanguages,
    starterCode: starterCodeObj,
    constraints: this.constraints || [],
    testCases: sanitizedTestCases,
    sampleCases,
    totalTestCases: (this.testCases || []).length,
  };
};

export const Problem: Model<IProblem> =
  mongoose.models.Problem || mongoose.model<IProblem>("Problem", ProblemSchema);
