import { atom, PrimitiveAtom } from "jotai";
import { Task } from "../types";
import { splitAtom } from "jotai/utils";
// const countAtom = atom(0);

// const countryAtom = atom("Japan");

// const citiesAtom = atom(["Tokyo", "Kyoto", "Osaka"]);

// const animeAtom = atom([
//     {
//         title: "Ghost in the Shell",
//         year: 1995,
//         watched: true,
//     },
//     {
//         title: "Serial Experiments Lain",
//         year: 1998,
//         watched: false,
//     },
// ]);

export const tasksAtom = atom<Task[]>([]);
export const taskAtomsAtom = splitAtom(tasksAtom);
const selectedTaskBaseAtom = atom<PrimitiveAtom<Task> | PrimitiveAtom<null>>(atom(null));
export const taskSelectorAtom = atom(
    (get) => get(selectedTaskBaseAtom),
    (_get, set, newSelectedTaskAtom: PrimitiveAtom<Task> | PrimitiveAtom<null>) => {
        set(selectedTaskBaseAtom, newSelectedTaskAtom);
    }
);
