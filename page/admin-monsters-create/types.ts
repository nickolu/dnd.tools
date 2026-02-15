export type AdminEntryMode = "manual" | "parse";

export type MonsterSize =
  | "Tiny"
  | "Small"
  | "Medium"
  | "Large"
  | "Huge"
  | "Gargantuan";

export type MonsterAdminFormState = {
  abilityCha: string;
  abilityCon: string;
  abilityDex: string;
  abilityInt: string;
  abilityStr: string;
  abilityWis: string;
  actionsJson: string;
  actor: string;
  alignment: string;
  armorClass: string;
  challengeRating: string;
  conditionImmunitiesText: string;
  createdBy: string;
  crNumeric: string;
  damageImmunitiesText: string;
  damageResistancesText: string;
  damageVulnerabilitiesText: string;
  hitPoints: string;
  id: string;
  isPublished: boolean;
  languagesText: string;
  legendaryActionsJson: string;
  name: string;
  passivePerception: string;
  proficiencyBonus: string;
  reactionsJson: string;
  savingThrowsText: string;
  schemaVersion: string;
  searchTokensText: string;
  senses: string;
  size: MonsterSize;
  skillsText: string;
  source: string;
  specialAbilitiesJson: string;
  speed: string;
  spellListText: string;
  spellSlotsText: string;
  type: string;
  updatedBy: string;
};
