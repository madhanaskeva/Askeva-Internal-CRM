// Builds the demo dataset from the plain arrays in data/ (projects, tasks, …). Every call
// returns a fresh deep copy, because migrations and reducers mutate the result.
import { changeRequests, communications, followups, MS, projects, tasks } from "../../data";
import { addDays } from "../helpers/date";

export const defaultMilestones = (start, offsets = [1, 3, 10, 14, 32, 40, 45]) =>
  MS.map((name, i) => ({ id: "M" + (i + 1), name, target: addDays(start, offsets[i]), actual: null }));

export function seed() {
  return structuredClone({
    projects,
    tasks,
    followups,
    crs: changeRequests,
    clientCommunications: communications,
  });
}
