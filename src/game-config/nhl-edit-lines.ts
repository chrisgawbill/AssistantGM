import type { ExtractedField, PipelineResult } from "@chrisgawbill/vision-engine";
import type { NhlRosterPlayer, PlayerField, PlayerPosition } from "../domain/player";

export type EditLinesSlot = "LW" | "C" | "RW" | "LD" | "RD";
export type EditLinesGroupKind = "forward-line" | "defense-pairing";

export type EditLinesGroup = {
  kind: EditLinesGroupKind;
  number: number;
  players: Partial<Record<EditLinesSlot, NhlRosterPlayer>>;
};

export type NhlEditLines = {
  screen: "nhl-27-edit-lines";
  forwardLines: EditLinesGroup[];
  defensePairings: EditLinesGroup[];
};

type EditLinesRegion = {
  id: string;
  kind: EditLinesGroupKind;
  number: number;
  slots: readonly EditLinesSlot[];
  fields: readonly ("name" | "position" | "overall")[];
};

/** Semantic regions only: the engine/detector supplies their actual image bounds. */
export const nhl27EditLinesConfiguration = {
  id: "nhl-27-edit-lines",
  label: "NHL 27 Franchise Mode Edit Lines",
  contentMayOccupyPartOfSourceImage: true,
  regions: [
    ...([1, 2, 3].map((number) => ({
      id: `forward-line-${number}`,
      kind: "forward-line",
      number,
      slots: ["LW", "C", "RW"],
      fields: ["name", "position", "overall"],
    })) as EditLinesRegion[]),
    ...([1, 2, 3].map((number) => ({
      id: `defense-pairing-${number}`,
      kind: "defense-pairing",
      number,
      slots: ["LD", "RD"],
      fields: ["name", "position", "overall"],
    })) as EditLinesRegion[]),
  ],
} as const;

const positions: Record<string, PlayerPosition> = {
  C: "C",
  CENTER: "C",
  CENTRE: "C",
  LW: "LW",
  RW: "RW",
  LD: "LD",
  RD: "RD",
};

const missing = (reason: string): ExtractedField => ({
  status: "missing",
  confidence: { score: 0, certainty: "missing", reasons: [reason] },
  reason,
});

function playerField<T>(field: ExtractedField | undefined, isValid: (value: unknown) => value is T): PlayerField<T> {
  const value = field ?? missing("Vision Engine did not return this Edit Lines field");
  if (value.status !== "known" || isValid(value.value)) return value as PlayerField<T>;
  return {
    ...value,
    status: "invalid",
    value: undefined,
    reason: "Value is not valid for an NHL Edit Lines player field",
  };
}

function positionField(field: ExtractedField | undefined): PlayerField<PlayerPosition> {
  const value = field ?? missing("Vision Engine did not return this Edit Lines position");
  if (value.status !== "known") return value as PlayerField<PlayerPosition>;
  const mapped = typeof value.value === "string" ? positions[value.value.trim().toUpperCase()] : undefined;
  return mapped
    ? { ...value, value: mapped }
    : { ...value, status: "invalid", value: undefined, reason: "Value is not a supported NHL player position" };
}

function mapPlayer(fields: Record<string, ExtractedField>, slot: EditLinesSlot): NhlRosterPlayer {
  return {
    name: playerField(fields[`${slot}.name`], (value): value is string => typeof value === "string" && value.trim().length > 0),
    position: positionField(fields[`${slot}.position`]),
    overall: playerField(fields[`${slot}.overall`], (value): value is number => typeof value === "number" && Number.isInteger(value)),
  };
}

export function mapNhl27EditLines(result: Pick<PipelineResult, "records">): NhlEditLines {
  const groups = nhl27EditLinesConfiguration.regions.map((region) => {
    const record = result.records.find(({ region: candidate }) => candidate.id === region.id);
    const players = Object.fromEntries(
      region.slots.map((slot) => [slot, mapPlayer(record?.fields ?? {}, slot)]),
    ) as Partial<Record<EditLinesSlot, NhlRosterPlayer>>;
    return { kind: region.kind, number: region.number, players };
  });

  return {
    screen: "nhl-27-edit-lines",
    forwardLines: groups.filter(({ kind }) => kind === "forward-line"),
    defensePairings: groups.filter(({ kind }) => kind === "defense-pairing"),
  };
}
