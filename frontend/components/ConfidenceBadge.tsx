import clsx from "clsx";

const BAND_STYLES: Record<string, string> = {
  green: "bg-verified/10 text-verified border-verified/30",
  yellow: "bg-partial/10 text-partial border-partial/30",
  red: "bg-unverified/10 text-unverified border-unverified/30",
};

export default function ConfidenceBadge({ score, band }: { score: number; band: "green" | "yellow" | "red" }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
        BAND_STYLES[band]
      )}
    >
      <span
        className={clsx("w-1.5 h-1.5 rounded-full", {
          "bg-verified": band === "green",
          "bg-partial": band === "yellow",
          "bg-unverified": band === "red",
        })}
      />
      {score}% confidence
    </span>
  );
}
