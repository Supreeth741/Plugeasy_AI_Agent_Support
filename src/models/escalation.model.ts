import mongoose, { Schema, Document } from "mongoose";

export interface IEscalation extends Document {
  callSid: string;
  reason: string;
  callerPhone: string;
  callTranscript: Array<{ role: string; content: string }>;
  chatHistory: Array<{
    role: "admin" | "ai";
    content: string;
    timestamp: Date;
  }>;
  status: "open" | "resolved";
  createdAt: Date;
  resolvedAt?: Date;
}

const escalationSchema = new Schema<IEscalation>(
  {
    callSid: { type: String, required: true, index: true },
    reason: { type: String, required: true },
    callerPhone: { type: String, required: true },
    callTranscript: [
      {
        role: { type: String },
        content: { type: String },
      },
    ],
    chatHistory: [
      {
        role: { type: String, enum: ["admin", "ai"] },
        content: { type: String },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    status: {
      type: String,
      enum: ["open", "resolved"],
      default: "open",
    },
    resolvedAt: { type: Date },
  },
  { timestamps: true },
);

export const Escalation = mongoose.model<IEscalation>(
  "Escalation",
  escalationSchema,
);
