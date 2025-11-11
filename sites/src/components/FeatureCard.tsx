import { useState } from "react";

import { cn } from "../lib/cn";

export type FeatureLayout = "left" | "right";

export interface FeatureCardProps {
  title: string;
  description: string;
  videoSrc: string;
  fallbackImageSrc: string;
  layout: FeatureLayout;
}

export function FeatureCard({
  title,
  description,
  videoSrc,
  fallbackImageSrc,
  layout,
}: FeatureCardProps) {
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);

  const showFallbackImage = hasVideoError || !isVideoReady;
  const showVideo = !hasVideoError;

  return (
    <div
      className={cn(
        "flex gap-6 rounded-lg bg-stone-200 p-6 shadow-lg shadow-stone-300/50 transition dark:bg-stone-900/70 dark:shadow-none",
        layout === "left" ? "flex-row" : "flex-row-reverse",
      )}
    >
      <div className="w-1/2">
        <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
          <img
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              showFallbackImage ? "opacity-100" : "opacity-0",
            )}
            src={fallbackImageSrc}
            alt={title}
            loading="lazy"
            decoding="async"
          />
          <video
            className={cn(
              "absolute inset-0 h-full w-full object-cover transition-opacity duration-300",
              showVideo ? "opacity-100" : "opacity-0",
            )}
            autoPlay
            muted
            loop
            playsInline
            poster={fallbackImageSrc}
            preload="metadata"
            src={videoSrc}
            aria-label={title}
            onCanPlay={() => {
              setIsVideoReady(true);
            }}
            onError={() => {
              setHasVideoError(true);
            }}
          />
        </div>
      </div>
      <div className="w-1/2">
        <h3 className="mb-2 text-xl font-semibold">
          {title}
        </h3>
        <p>{description}</p>
      </div>
    </div>
  );
}

