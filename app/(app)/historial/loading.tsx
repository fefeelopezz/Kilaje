import { CardsSkeleton } from "../skeletons";

export default function Loading() {
  return <CardsSkeleton width="max-w-4xl" cards={4} lines={1} />;
}
