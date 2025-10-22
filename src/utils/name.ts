export function getFirstName(displayName?: string | null, email?: string | null): string {
  if (displayName) {
    const segments = displayName.trim().split(/\s+/);
    if (segments.length > 0 && segments[0].length > 0) {
      return capitalize(segments[0]);
    }
  }

  if (email) {
    const local = email.split("@")[0] ?? "";
    if (local) {
      return capitalize(local.replace(/[\W_]+/g, " "));
    }
  }

  return "Friend";
}

function capitalize(value: string): string {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
