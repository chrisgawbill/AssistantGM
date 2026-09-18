import type { ExtractedField } from "@chrisgawbill/vision-engine";

export type DefenseSide = "LD" | "RD";

export type PlayerField<T> = Omit<ExtractedField, "value"> & { value?: T };

export type EditLinesDefensePlayer = {
  name: PlayerField<string>;
  displayedSide: PlayerField<DefenseSide>;
  overall: PlayerField<number>;
};

export type PairingImpact = number | string;

export type EditLinesDefensePairing = {
  left: EditLinesDefensePlayer;
  right: EditLinesDefensePlayer;
  chemistryOrImpact: PlayerField<PairingImpact>;
};

export type EditLinesDefenseEvenStrength = {
  pairings: readonly [
    EditLinesDefensePairing,
    EditLinesDefensePairing,
    EditLinesDefensePairing,
  ];
};
