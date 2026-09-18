import type { ExtractedField } from "@chrisgawbill/vision-engine";

export type PlayerPosition = "C" | "LW" | "RW" | "LD" | "RD" | "G";

export type PlayerField<T> = Omit<ExtractedField, "value"> & { value?: T };

export type NhlRosterPlayer = {
  name: PlayerField<string>;
  position: PlayerField<PlayerPosition>;
  overall: PlayerField<number>;
};
