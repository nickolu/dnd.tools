export type AdminEntryMode = "manual" | "parse";

export type SpellAdminFormState = {
  actor: string;
  attackType: "" | "melee" | "ranged";
  cantripScalingText: string;
  castingTime: string;
  classesText: string;
  componentMaterial: boolean;
  componentSomatic: boolean;
  componentVerbal: boolean;
  concentration: boolean;
  createdBy: string;
  damageType: string;
  descriptionText: string;
  diceBySlotText: string;
  duration: string;
  gpCost: string;
  higherLevelText: string;
  id: string;
  isPublished: boolean;
  level: string;
  materialText: string;
  name: string;
  publisher: string;
  range: string;
  ritual: boolean;
  saveAbility: "" | "str" | "dex" | "con" | "int" | "wis" | "cha";
  saveOnSuccess: string;
  schemaVersion: string;
  school:
    | "abjuration"
    | "conjuration"
    | "divination"
    | "enchantment"
    | "evocation"
    | "illusion"
    | "necromancy"
    | "transmutation";
  searchTokensText: string;
  source: string;
  tagsText: string;
  updatedBy: string;
};
