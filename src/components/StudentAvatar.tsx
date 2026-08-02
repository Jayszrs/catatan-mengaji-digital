interface StudentAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  className?: string;
  textClassName?: string;
}

export function StudentAvatar({
  name,
  photoUrl,
  className = "h-16 w-16 rounded-2xl",
  textClassName = "text-2xl",
}: StudentAvatarProps) {
  const initials = (name || "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  return (
    <div
      className={`${className} shrink-0 overflow-hidden bg-gradient-to-br from-[#1b4332] to-[#2dc653] shadow-md`}
    >
      {photoUrl ? (
        // URL berasal dari bucket Supabase runtime; domainnya mengikuti project pengguna.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt={`Foto ${name || "siswa"}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div
          className={`flex h-full w-full items-center justify-center font-black text-white ${textClassName}`}
        >
          {initials || "?"}
        </div>
      )}
    </div>
  );
}
