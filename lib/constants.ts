export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  (typeof window !== "undefined"
    ? window.location.origin
    : "http://localhost:3000");

export const getInviteLink = (inviteCode: string) => {
  return `${APP_URL}/signup?invite=${inviteCode}`;
};
