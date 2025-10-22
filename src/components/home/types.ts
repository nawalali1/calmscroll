import type { LucideIcon } from "lucide-react";

export type HabitStatus = "Completed" | "Pending" | "Missed";

export type HabitItem = {
  id: string;
  title: string;
  status: HabitStatus;
  time: string;
  icon: LucideIcon;
};
