import { MS } from "../../constants/crm";
import { addDays } from "../../utils/date";

/**
 * Generates default project milestone timelines from a start date.
 */
export const defaultMilestones = (start, offsets = [1, 3, 10, 14, 32, 40, 45]) =>
  MS.map((name, i) => ({ id: "M" + (i + 1), name, target: addDays(start, offsets[i]), actual: null }));
