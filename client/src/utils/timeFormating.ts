import { DateTime } from "luxon";

export const formatDate = (date: string) => {
  const diffNow = DateTime.fromISO(date).diffNow().milliseconds;
  if (-diffNow < 10 * 1000) {
    return "Just now";
  }
  return DateTime.fromISO(date).toRelative();
};
