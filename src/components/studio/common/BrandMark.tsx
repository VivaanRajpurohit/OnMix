import Image from "next/image";

export function BrandMark({ className = "", size = 46, priority = false }: { className?: string; size?: number; priority?: boolean }) {
  return <Image className={className} src="/streamforge-logo.png" width={size} height={size} priority={priority} alt="" aria-hidden="true"/>;
}
