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
const selectedTaskAtomBaseAtom = atom<PrimitiveAtom<Task>>();
export const selectedTaskAtomAtom = atom(
    (get) => get(selectedTaskAtomBaseAtom),
    (_get, set, newSelectedTaskAtom: PrimitiveAtom<Task>) => {
        set(selectedTaskAtomBaseAtom, newSelectedTaskAtom);
    }
);
