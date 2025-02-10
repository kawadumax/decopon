import { useApi } from "@/Hooks/useApi";
import { Tag } from "@/types";
import { useEffect, useState } from "react";

export const TaskTagList = () => {
    const [tags, setTags] = useState<Tag[]>([]);
    const api = useApi();
    useEffect(() => {
        // Initialize Tags
        api.get(route("api.tags.index"), (response) => {
            setTags(response.data.tags);
        });
    }, []);
    return (
        <>
            <h3 className="font-bold text-base sticky border-primary border-b-2 p-2 top-0">
                Latest Tags
            </h3>
            <ul className="text-primary font-bold">
                {tags
                    ? tags.map((tag, index) => {
                          return (
                              <li
                                  key={index}
                                  className="px-2 cursor-pointer hover:bg-stone-100"
                              >
                                  <span className="px-1 font-thin rounded border-1 border-primary bg-stone-100 mr-2">
                                      #
                                  </span>
                                  {tag.name}
                              </li>
                          );
                      })
                    : "No Tags There"}
            </ul>
        </>
    );
};
