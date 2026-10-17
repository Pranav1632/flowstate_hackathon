export interface Scenario {
  id: string;
  title: string;
  source: string;
  content: string;
  is_adversarial: boolean;
  target_lot: string;
}

export type ScenariosMap = Record<string, Scenario>;
