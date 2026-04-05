import { useHexCrawlStore } from "../hooks/useHexCrawlStore";
import { ConfigPanel } from "./config-panel";
import { HexCrawlDisplay } from "./hex-crawl-display";

export function HexCrawlGenerator() {
  const generatedAt = useHexCrawlStore((s) => s.generatedAt);

  if (!generatedAt) {
    return <ConfigPanel />;
  }

  return <HexCrawlDisplay />;
}
