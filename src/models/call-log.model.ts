import mongoose, { Schema, Document } from "mongoose";

export interface ICallLog extends Document {
  callSid: string;
  from: string;
  to: string;
  startTime: Date;
  endTime?: Date;
  status: "in-progress" | "completed" | "escalated" | "failed";
  turnCount: number;
  conversationHistory: Array<{ role: string; content: string }>;
  detectedLanguage: string;
  escalated: boolean;
  escalationReason?: string;
  resolved: boolean;
}

const callLogSchema = new Schema<ICallLog>(
  {
    callSid: { type: String, required: true, unique: true, index: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    startTime: { type: Date, required: true, default: Date.now },
    endTime: { type: Date },
    status: {
      type: String,
      enum: ["in-progress", "completed", "escalated", "failed"],
      default: "in-progress",
    },
    turnCount: { type: Number, default: 0 },
    conversationHistory: [
      {
        role: { type: String, enum: ["system", "user", "assistant"] },
        content: { type: String },
      },
    ],
    detectedLanguage: { type: String, default: "en" },
    escalated: { type: Boolean, default: false },
    escalationReason: { type: String },
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CallLog = mongoose.model<ICallLog>("CallLog", callLogSchema);
