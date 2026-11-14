import { CardsSkeleton } from "../skeletons";

export default function Loading() {
  return <CardsSkeleton width="max-w-2xl" cards={1} lines={3} />;
}
