"use client";

import { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Wind, PencilLine, PlusCircle } from "lucide-react";
import Button from "@/components/ui/Button";
import { logEvent } from "@/utils/logger";

type QuickActionsProps = {
  onBreathe: () => void;
};

type ActionConfig = {
  key: string;
  label: string;
  icon: ReactNode;
  onPress: (helpers: { router: ReturnType<typeof useRouter>; openBreathe: () => void }) => void;
  variant: "primary" | "subtle";
};

const actions: ActionConfig[] = [
  {
    key: "breathe",
    label: "1-min breathe",
    icon: <Wind className="h-5 w-5" />,
    variant: "primary",
    onPress: ({ openBreathe }) => {
      logEvent("cta_breathe");
      openBreathe();
    },
  },
  {
    key: "note",
    label: "Write a note",
    icon: <PencilLine className="h-5 w-5" />,
    variant: "subtle",
    onPress: ({ router }) => {
      logEvent("cta_note");
      router.push("/notes?view=notes");
    },
  },
  {
    key: "task",
    label: "Add a task",
    icon: <PlusCircle className="h-5 w-5" />,
    variant: "subtle",
    onPress: ({ router }) => {
      logEvent("cta_task");
      router.push("/notes?view=tasks");
    },
  },
];

export function QuickActions({ onBreathe }: QuickActionsProps) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {actions.map((action) => (
        <Button
          key={action.key}
          type="button"
          variant={action.variant}
          size="md"
          className={`flex h-full w-full flex-col items-center justify-center gap-3 rounded-2xl px-5 py-6 text-center transition focus-visible:ring-offset-2 ${
            action.variant === "primary"
              ? "border border-transparent text-white"
              : "border border-[var(--card-border)] bg-white text-[var(--ink)] hover:border-[var(--accent)]"
          }`}
          onClick={() => action.onPress({ router, openBreathe: onBreathe })}
          aria-label={action.label}
        >
          <span
            className={`flex h-12 w-12 items-center justify-center rounded-full text-[var(--accent)] ${
              action.variant === "primary" ? "bg-white/20 text-white" : "bg-[var(--accent)]/15"
            }`}
            aria-hidden
          >
            {action.icon}
          </span>
          <span className="text-sm font-semibold">{action.label}</span>
        </Button>
      ))}
    </div>
  );
}

export default QuickActions;
