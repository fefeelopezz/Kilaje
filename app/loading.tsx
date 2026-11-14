import { CardsSkeleton } from "./(app)/skeletons";

// Se ve al abrir una página directamente, mientras se lee la sesión (antes de que aparezca la barra lateral).
export default function Loading() {
  return <CardsSkeleton cards={2} lines={2} />;
}
