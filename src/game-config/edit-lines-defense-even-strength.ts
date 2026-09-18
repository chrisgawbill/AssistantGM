import type { ExtractedField, PipelineResult } from "@chrisgawbill/vision-engine";
import type {
  DefenseSide,
  EditLinesDefenseEvenStrength,
  EditLinesDefensePairing,
  EditLinesDefensePlayer,
  PairingImpact,
  PlayerField,
} from "../domain/player";

type EditLinesRegion = {
  id: `pairing-${1 | 2 | 3}`;
  extraction: {
    fields: readonly { name: string; type: "string" | "number"; pattern?: RegExp }[];
  };
};

const playerFields = (side: "left" | "right") => [
  { name: `${side}PlayerName`, type: "string" as const },
  { name: `${side}DisplayedSide`, type: "string" as const },
  { name: `${side}Overall`, type: "number" as const },
];

export const editLinesDefenseEvenStrengthScreen = {
  id: "edit-lines-defense-even-strength",
  label: "NHL 27 Franchise Mode Edit Lines — Defense / Even Strength",
  regions: [1, 2, 3].map((number) => ({
    id: `pairing-${number}` as `pairing-${1 | 2 | 3}`,
    extraction: {
      fields: [
        ...playerFields("left"),
        ...playerFields("right"),
        { name: "chemistryOrImpact", type: "string" as const },
      ],
    },
  })) as readonly EditLinesRegion[],
} as const;

const sides: Record<string, DefenseSide> = {
  LD: "LD",
  LEFT: "LD",
  RD: "RD",
  RIGHT: "RD",
};

function typedField<T>(field: ExtractedField, isValid: (value: unknown) => value is T): PlayerField<T> {
  if (field.status !== "known" || isValid(field.value)) return field as PlayerField<T>;
  return {
    ...field,
    status: "invalid",
    value: undefined,
    reason: "Value is not valid for an Edit Lines defense field",
  };
}

function sideField(field: ExtractedField): PlayerField<DefenseSide> {
  if (field.status !== "known") return field as PlayerField<DefenseSide>;
  const mapped = typeof field.value === "string" ? sides[field.value.trim().toUpperCase()] : undefined;
  return mapped
    ? { ...field, value: mapped }
    : { ...field, status: "invalid", value: undefined, reason: "Value is not a defense side" };
}

const stringField = (field: ExtractedField) =>
  typedField(field, (value): value is string => typeof value === "string" && value.trim().length > 0);

const overallField = (field: ExtractedField) =>
  typedField(field, (value): value is number => typeof value === "number" && Number.isInteger(value));

const impactField = (field: ExtractedField) =>
  typedField(field, (value): value is PairingImpact =>
    (typeof value === "string" && value.trim().length > 0) ||
    (typeof value === "number" && Number.isFinite(value)),
  );

function player(fields: Record<string, ExtractedField>, side: "left" | "right"): EditLinesDefensePlayer {
  return {
    name: stringField(fields[`${side}PlayerName`]),
    displayedSide: sideField(fields[`${side}DisplayedSide`]),
    overall: overallField(fields[`${side}Overall`]),
  };
}

function pairing(fields: Record<string, ExtractedField>): EditLinesDefensePairing {
  return {
    left: player(fields, "left"),
    right: player(fields, "right"),
    chemistryOrImpact: impactField(fields.chemistryOrImpact),
  };
}

export function mapEditLinesDefenseEvenStrength(
  result: Pick<PipelineResult, "regions">,
): EditLinesDefenseEvenStrength {
  return {
    pairings: [
      pairing(result.regions["pairing-1"]?.fields ?? {}),
      pairing(result.regions["pairing-2"]?.fields ?? {}),
      pairing(result.regions["pairing-3"]?.fields ?? {}),
    ],
  };
}
