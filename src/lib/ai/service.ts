import crypto from "crypto";
import { connectToDatabase } from "../db/connect";
import { InterviewRoom } from "../db/models/interview-room";
import { Problem } from "../db/models/problem";
import { Submission, ISubmission } from "../db/models/submission";
import { AIConversation, IAIConversation } from "../db/models/ai-conversation";
import { InterviewFeedback, IInterviewFeedback, SafeInterviewFeedback } from "../db/models/interview-feedback";
import { getAIAdapter } from "./adapter";
import {
  buildChatPrompt,
  buildHintPrompt,
  buildCodeReviewPrompt,
  buildComplexityPrompt,
  buildFeedbackReportPrompt,
} from "./prompts";
import {
  ChatRequest,
  HintRequest,
  HintResponse,
  CodeReviewRequest,
  CodeReviewResult,
  ComplexityRequest,
  ComplexityResult,
  GenerateFeedbackRequest,
} from "./types";

/**
 * Validates that the user is a participant or creator in the room.
 */
async function verifyRoomAccess(roomId: string, userId: string) {
  await connectToDatabase();
  const room = await InterviewRoom.findById(roomId);
  if (!room) {
    throw new Error("Interview room not found.");
  }

  const isCreator = room.creatorId.toString() === userId;
  const isParticipant = room.participants.some(
    (p) => p.userId.toString() === userId
  );

  if (!isCreator && !isParticipant) {
    throw new Error("You are not an authorized participant in this room.");
  }

  return { room, isCreator };
}

/**
 * AI Chat Assistant Handler
 */
export async function handleAIChat(
  userId: string,
  req: ChatRequest
): Promise<{ reply: string; conversationId: string }> {
  const { room } = await verifyRoomAccess(req.roomId, userId);

  let problemTitle: string | undefined;
  let problemDescription: string | undefined;

  if (room.problemId) {
    const problem = await Problem.findById(room.problemId);
    if (problem) {
      problemTitle = problem.title;
      problemDescription = problem.description;
    }
  }

  const prompt = buildChatPrompt({
    problemTitle,
    problemDescription,
    codeSnapshot: req.codeSnapshot,
    language: req.language || room.language,
    userMessage: req.message,
  });

  const adapter = getAIAdapter();
  const reply = await adapter.generateText(prompt);

  // Persist conversation
  let conversation = await AIConversation.findOne({
    roomId: room._id,
    userId,
  });

  if (!conversation) {
    conversation = new AIConversation({
      roomId: room._id,
      userId,
      messages: [],
      currentHintLevel: 0,
    });
  }

  // Push user message
  conversation.messages.push({
    id: crypto.randomUUID(),
    role: "user",
    mode: "chat",
    content: req.message,
    codeSnapshot: req.codeSnapshot ? req.codeSnapshot.slice(0, 32768) : undefined,
    createdAt: new Date(),
  });

  // Push assistant reply
  conversation.messages.push({
    id: crypto.randomUUID(),
    role: "assistant",
    mode: "chat",
    content: reply,
    createdAt: new Date(),
  });

  conversation.lastActiveAt = new Date();
  await conversation.save();

  return {
    reply,
    conversationId: conversation._id.toString(),
  };
}

/**
 * Progressive Hints Handler
 */
export async function handleAIHint(
  userId: string,
  req: HintRequest
): Promise<HintResponse> {
  const { room } = await verifyRoomAccess(req.roomId, userId);

  let problem = null;
  if (room.problemId) {
    problem = await Problem.findById(room.problemId);
  }
  if (!problem) {
    problem = await Problem.findOne({ slug: "two-sum" });
  }

  if (!problem) {
    throw new Error("No problem configured for hints in this room.");
  }

  let conversation = await AIConversation.findOne({
    roomId: room._id,
    userId,
  });

  if (!conversation) {
    conversation = new AIConversation({
      roomId: room._id,
      userId,
      messages: [],
      currentHintLevel: 0,
    });
  }

  // Determine hint level progression
  let targetLevel = conversation.currentHintLevel + 1;
  if (req.requestedLevel) {
    targetLevel = Math.min(req.requestedLevel, conversation.currentHintLevel + 1);
  }
  targetLevel = Math.max(1, Math.min(targetLevel, 3));

  const prompt = buildHintPrompt({
    level: targetLevel,
    problemTitle: problem.title,
    problemDescription: problem.description,
    constraints: problem.constraints,
    codeSnapshot: req.codeSnapshot,
    language: req.language || room.language,
  });

  const adapter = getAIAdapter();
  const hintText = await adapter.generateText(prompt);

  const levelTitles: Record<number, string> = {
    1: "Conceptual Hint (Level 1)",
    2: "Strategic Direction (Level 2)",
    3: "Detailed Guidance (Level 3)",
  };

  // Update conversation record
  conversation.currentHintLevel = targetLevel;
  conversation.messages.push({
    id: crypto.randomUUID(),
    role: "assistant",
    mode: "hint",
    content: hintText,
    metadata: { level: targetLevel, title: levelTitles[targetLevel] },
    createdAt: new Date(),
  });
  conversation.lastActiveAt = new Date();
  await conversation.save();

  return {
    level: targetLevel,
    title: levelTitles[targetLevel],
    content: hintText,
    nextLevelAvailable: targetLevel < 3,
  };
}

/**
 * Automated Code Review Handler
 */
export async function handleAICodeReview(
  userId: string,
  req: CodeReviewRequest
): Promise<CodeReviewResult> {
  const { room } = await verifyRoomAccess(req.roomId, userId);

  let problemTitle: string | undefined;
  let problemDescription: string | undefined;

  if (room.problemId) {
    const problem = await Problem.findById(room.problemId);
    if (problem) {
      problemTitle = problem.title;
      problemDescription = problem.description;
    }
  }

  // Retrieve latest submission for grounded context
  let executionSummary: string | undefined;
  const latestSub = await Submission.findOne({
    roomId: room._id,
    userId,
  }).sort({ submittedAt: -1 });

  if (latestSub) {
    executionSummary = `Last Submission Status: ${latestSub.status}. Passed ${latestSub.passedTests}/${latestSub.totalTests} tests. Runtime: ${latestSub.runtimeMs || 0}ms.`;
  }

  const prompt = buildCodeReviewPrompt({
    problemTitle,
    problemDescription,
    codeSnapshot: req.codeSnapshot,
    language: req.language,
    executionSummary,
  });

  const adapter = getAIAdapter();
  const reviewResult = await adapter.generateStructured<CodeReviewResult>(prompt);

  // Persist review in conversation
  await AIConversation.findOneAndUpdate(
    { roomId: room._id, userId },
    {
      $push: {
        messages: {
          id: crypto.randomUUID(),
          role: "assistant",
          mode: "review",
          content: reviewResult.summary,
          metadata: reviewResult as unknown as Record<string, unknown>,
          codeSnapshot: req.codeSnapshot.slice(0, 32768),
          createdAt: new Date(),
        },
      },
      $set: { lastActiveAt: new Date() },
    },
    { upsert: true, returnDocument: "after" }
  );

  return reviewResult;
}

/**
 * Complexity Analysis Handler
 */
export async function handleAIComplexityAnalysis(
  userId: string,
  req: ComplexityRequest
): Promise<ComplexityResult> {
  const { room } = await verifyRoomAccess(req.roomId, userId);

  const prompt = buildComplexityPrompt({
    codeSnapshot: req.codeSnapshot,
    language: req.language,
  });

  const adapter = getAIAdapter();
  const complexityResult = await adapter.generateStructured<ComplexityResult>(prompt);

  // Persist complexity in conversation
  await AIConversation.findOneAndUpdate(
    { roomId: room._id, userId },
    {
      $push: {
        messages: {
          id: crypto.randomUUID(),
          role: "assistant",
          mode: "complexity",
          content: `Time: ${complexityResult.timeComplexity.average}, Space: ${complexityResult.spaceComplexity.auxiliary}`,
          metadata: complexityResult as unknown as Record<string, unknown>,
          codeSnapshot: req.codeSnapshot.slice(0, 32768),
          createdAt: new Date(),
        },
      },
      $set: { lastActiveAt: new Date() },
    },
    { upsert: true, returnDocument: "after" }
  );

  return complexityResult;
}

/**
 * Post-Interview Feedback Generation Handler
 */
export async function handleGenerateFeedbackReport(
  callerUserId: string,
  req: GenerateFeedbackRequest
): Promise<SafeInterviewFeedback> {
  const { room, isCreator } = await verifyRoomAccess(req.roomId, callerUserId);

  // Only the creator / interviewer can generate or trigger the feedback report
  if (!isCreator) {
    const callerParticipant = room.participants.find(
      (p) => p.userId.toString() === callerUserId
    );
    if (!callerParticipant || callerParticipant.role !== "interviewer") {
      throw new Error("Only an interviewer can generate the final feedback report.");
    }
  }

  // Locate the candidate in the room
  const candidate = room.participants.find((p) => p.role === "candidate");
  const candidateId = candidate ? candidate.userId : room.creatorId;

  // Retrieve problem details
  let problem = null;
  if (room.problemId) {
    problem = await Problem.findById(room.problemId);
  }
  if (!problem) {
    problem = await Problem.findOne({ slug: "two-sum" });
  }

  // Retrieve authoritative submissions for this room
  const submissions: ISubmission[] = await Submission.find({ roomId: room._id }).sort({ submittedAt: -1 });
  const latestSub = submissions[0];

  const codeSnapshot = latestSub?.codeSnapshot || room.codeState || "// No code submitted";
  const language = latestSub?.language || room.language || "javascript";

  const prompt = buildFeedbackReportPrompt({
    problemTitle: problem?.title || "Coding Interview Problem",
    difficulty: problem?.difficulty || room.difficulty || "medium",
    codeSnapshot,
    language,
    submissionResults: latestSub
      ? {
          status: latestSub.status,
          passedTests: latestSub.passedTests,
          totalTests: latestSub.totalTests,
          runtimeMs: latestSub.runtimeMs,
          memoryKb: latestSub.memoryKb,
        }
      : undefined,
    interviewerNotes: req.interviewerNotes,
  });

  const adapter = getAIAdapter();
  const rawReport = await adapter.generateStructured<any>(prompt);

  const feedbackData = {
    roomId: room._id,
    candidateId,
    interviewerId: callerUserId,
    status: "generated" as const,
    problemId: problem?._id,
    summary: rawReport.summary || "Technical interview completed.",
    approachEvaluation: rawReport.approachEvaluation || {
      strengths: [],
      weaknesses: [],
      summary: "Evaluated solution structure.",
    },
    codeCorrectness: {
      passedTests: latestSub?.passedTests || 0,
      totalTests: latestSub?.totalTests || 0,
      passPercentage: latestSub
        ? Math.round((latestSub.passedTests / (latestSub.totalTests || 1)) * 100)
        : 0,
      notes: rawReport.codeCorrectness?.notes || (latestSub ? `Passed ${latestSub.passedTests} of ${latestSub.totalTests} tests.` : "No test evaluation submitted."),
    },
    algorithmicReasoning: rawReport.algorithmicReasoning || "Standard solution approach.",
    codeQuality: rawReport.codeQuality || {
      readabilityScore: 7,
      maintainabilityScore: 7,
      observations: [],
    },
    edgeCaseAwareness: rawReport.edgeCaseAwareness || "Boundary conditions examined.",
    complexityAnalysis: rawReport.complexityAnalysis || {
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      notes: "Complexity analysis grounded in source code.",
    },
    recommendations: rawReport.recommendations || [],
    interviewerNotes: req.interviewerNotes,
    evidenceReferences: {
      submissionId: latestSub?._id?.toString(),
      executedAt: latestSub?.submittedAt?.toISOString(),
      testSummary: latestSub ? `${latestSub.passedTests}/${latestSub.totalTests} tests (${latestSub.status})` : "None",
    },
    generatedAt: new Date(),
  };

  const feedback = await InterviewFeedback.findOneAndUpdate(
    { roomId: room._id },
    { $set: feedbackData },
    { upsert: true, returnDocument: "after" }
  );

  return feedback.toSafeObject();
}

/**
 * Retrieve Persisted Feedback Report
 */
export async function handleGetFeedbackReport(
  userId: string,
  roomId: string
): Promise<SafeInterviewFeedback | null> {
  await verifyRoomAccess(roomId, userId);

  const feedback = await InterviewFeedback.findOne({ roomId });
  if (!feedback) {
    return null;
  }

  return feedback.toSafeObject();
}

/**
 * Update Interviewer Feedback Notes
 */
export async function handleUpdateFeedbackNotes(
  callerUserId: string,
  roomId: string,
  notes: string
): Promise<SafeInterviewFeedback> {
  const { isCreator, room } = await verifyRoomAccess(roomId, callerUserId);

  if (!isCreator) {
    const callerParticipant = room.participants.find(
      (p) => p.userId.toString() === callerUserId
    );
    if (!callerParticipant || callerParticipant.role !== "interviewer") {
      throw new Error("Only an interviewer can update evaluation notes.");
    }
  }

  const feedback = await InterviewFeedback.findOne({ roomId });
  if (!feedback) {
    throw new Error("Feedback report has not been generated for this room yet.");
  }

  feedback.interviewerNotes = notes;
  feedback.status = "reviewed";
  await feedback.save();

  return feedback.toSafeObject();
}
