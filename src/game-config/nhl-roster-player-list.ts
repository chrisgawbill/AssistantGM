import type {
  ExtractedField,
  PipelineRegionRequest,
  PipelineResult,
} from "@chrisgawbill/vision-engine";
import type { NhlRosterPlayer, PlayerField, PlayerPosition } from "../domain/player";

export const nhlRosterPlayerListScreen = {
  id: "nhl-franchise-roster-player-list",
  label: "NHL Franchise Mode roster player list",
  regions: [
    {
      region: { id: "player-list", bounds: { x: 0, y: 0, width: 1920, height: 1080 } },
      extraction: {
        fields: [
          { name: "playerName", type: "string", pattern: /Player:\s*([^\n]+)/i },
          { name: "position", type: "string", pattern: /Position:\s*([^\n]+)/i },
          { name: "overall", type: "number", pattern: /Overall:\s*(\d{1,3})/i },
        ],
      },
    },
  ] satisfies readonly PipelineRegionRequest[],
} as const;

const positions: Record<string, PlayerPosition> = {
  C: "C",
  CENTER: "C",
  CENTRE: "C",
  LW: "LW",
  RW: "RW",
  LD: "LD",
  RD: "RD",
  G: "G",
  GOALIE: "G",
};

function field<T>(value: ExtractedField, isValid: (value: unknown) => value is T): PlayerField<T> {
  if (value.status !== "known" || isValid(value.value)) return value as PlayerField<T>;
  return { ...value, status: "invalid", value: undefined, reason: "Value is not valid for an NHL player field" };
}

function positionField(value: ExtractedField): PlayerField<PlayerPosition> {
  if (value.status !== "known") return value as PlayerField<PlayerPosition>;
  const mapped = typeof value.value === "string" ? positions[value.value.trim().toUpperCase()] : undefined;
  return mapped ? { ...value, value: mapped } : {
    ...value,
    status: "invalid",
    value: undefined,
    reason: "Value is not a supported NHL player position",
  };
}

export function mapNhlRosterPlayer(result: Pick<PipelineResult, "fields">): NhlRosterPlayer {
  return {
    name: field(result.fields.playerName, (value): value is string => typeof value === "string" && value.length > 0),
    position: positionField(result.fields.position),
    overall: field(result.fields.overall, (value): value is number => typeof value === "number" && Number.isInteger(value)),
  };
}
