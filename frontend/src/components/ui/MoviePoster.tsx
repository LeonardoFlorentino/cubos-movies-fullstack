import { useState } from "react";
import clsx from "clsx";

interface MoviePosterProps {
  src?: string | null;
  title: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export function MoviePoster({
  src,
  title,
  className,
  imageClassName,
  fallbackClassName,
}: MoviePosterProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const normalizedSrc = src?.trim() || null;
  const shouldShowImage = Boolean(normalizedSrc) && failedSrc !== normalizedSrc;
  const titleInitial = title.trim().charAt(0).toUpperCase() || "C";

  if (shouldShowImage) {
    return (
      <img
        src={normalizedSrc ?? undefined}
        alt={title}
        onError={() => setFailedSrc(normalizedSrc)}
        className={clsx(
          "h-full w-full object-cover",
          imageClassName,
          className,
        )}
      />
    );
  }

  return (
    <div
      role="img"
      aria-label={`Poster padrão para ${title}`}
      className={clsx(
        "relative h-full w-full overflow-hidden bg-[radial-gradient(circle_at_top,#2e3350_0%,#171b2c_45%,#10131d_100%)]",
        className,
        fallbackClassName,
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(255,255,255,0.08),transparent_30%,transparent_70%,rgba(255,255,255,0.04))]" />
      <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-400/10 blur-2xl" />
      <div className="relative flex h-full items-center justify-center p-5 text-white">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-[28px] border border-white/10 bg-white/5 shadow-[0_18px_40px_rgba(7,10,20,0.35)] backdrop-blur-sm">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              className="h-10 w-10 text-white/88"
            >
              <rect
                x="4.25"
                y="5.25"
                width="15.5"
                height="13.5"
                rx="2.75"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M8 5.5v13M16 5.5v13M4.5 9.5h3M4.5 14.5h3M16.5 9.5h3M16.5 14.5h3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="m10.25 10 4 2-4 2.25z"
                fill="currentColor"
                stroke="none"
              />
            </svg>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/55">
              Sem poster
            </p>
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 text-sm font-bold text-white/80">
              {titleInitial}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
