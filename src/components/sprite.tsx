import { artUrl, spriteUrl } from "~/lib/sprites";

type Props = {
  dex: number;
  shiny?: boolean;
  art?: boolean;
  className?: string;
};

function hideOnError(e: React.SyntheticEvent<HTMLImageElement>) {
  (e.currentTarget as HTMLImageElement).style.display = "none";
}

export function Sprite({ dex, shiny, art, className = "h-8 w-8" }: Props) {
  const src = art ? artUrl(dex, { shiny }) : spriteUrl(dex, { shiny });
  return <img src={src} alt="" className={className} onError={hideOnError} />;
}
