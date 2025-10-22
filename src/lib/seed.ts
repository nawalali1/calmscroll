export type FeedSeedKind = "quote" | "breath" | "task" | "reflection";

export type FeedSeedItem = {
  id: string;
  kind: FeedSeedKind;
  title: string;
  content: string;
  action?: string;
};

const baseSeeds: Omit<FeedSeedItem, "id">[] = [
  {
    kind: "quote",
    title: "Slow morning",
    content: "“Take time to deliberate, but when the time for action has arrived, stop thinking and go in.”",
    action: "Reflect for one minute.",
  },
  {
    kind: "breath",
    title: "Box breathing",
    content: "Inhale 4, hold 4, exhale 4, hold 4 — repeat for three rounds.",
  },
  {
    kind: "task",
    title: "Micro goal",
    content: "Identify one task that moves you 1% closer to your goal.",
    action: "Write it down and schedule it.",
  },
  {
    kind: "reflection",
    title: "Gratitude check-in",
    content: "List two things you’re grateful for today.",
  },
  {
    kind: "quote",
    title: "Stillness",
    content: "“Silence isn’t empty, it’s full of answers.”",
    action: "Sit quietly for 60 seconds.",
  },
  {
    kind: "breath",
    title: "4-7-8 reset",
    content: "Inhale 4, hold 7, exhale 8. Repeat twice to settle your nervous system.",
  },
  {
    kind: "task",
    title: "Clear path",
    content: "Declutter one item within reach.",
  },
  {
    kind: "reflection",
    title: "Energy scan",
    content: "Notice where your energy is highest and lowest right now.",
  },
  {
    kind: "quote",
    title: "Begin again",
    content: "“You are allowed to be both a masterpiece and a work in progress simultaneously.”",
  },
  {
    kind: "breath",
    title: "Extended exhale",
    content: "Inhale 3 seconds, exhale 6 seconds. Repeat five times.",
  },
  {
    kind: "task",
    title: "Tiny win",
    content: "Choose the easiest task on your list and complete it right now.",
  },
  {
    kind: "reflection",
    title: "Future self",
    content: "What does tomorrow-you need from present-you?",
  },
  {
    kind: "quote",
    title: "Rhythm",
    content: "“Step by step and the thing is done.” – Charles Atlas",
  },
  {
    kind: "breath",
    title: "Three sighs",
    content: "Take three deep sighs, letting your shoulders drop with each exhale.",
  },
  {
    kind: "task",
    title: "Focus frame",
    content: "Set a 15-minute timer and devote it to a single task.",
  },
  {
    kind: "reflection",
    title: "Gentle success",
    content: "What is one kind thing you did for yourself this week?",
  },
  {
    kind: "quote",
    title: "Soft pace",
    content: "“It is better to travel well than to arrive.” – Buddha",
  },
  {
    kind: "breath",
    title: "Counted inhale",
    content: "Inhale for 5, hold for 2, exhale for 5 — repeat four times.",
  },
  {
    kind: "task",
    title: "Inbox zero-ish",
    content: "Archive or reply to two messages lingering in your inbox.",
  },
  {
    kind: "reflection",
    title: "Mood check",
    content: "Name the emotion you’re feeling most strongly right now.",
  },
];

export const seedFeedItems: FeedSeedItem[] = Array.from({ length: 60 }).map((_, index) => {
  const template = baseSeeds[index % baseSeeds.length];
  return {
    ...template,
    id: `seed-${index + 1}`,
  };
});
