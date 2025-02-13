import Checkbox from "@/Components/Checkbox";
import { TagTableRow } from "@/Pages/Tag/Partials/TagTableRow";
import {
    Table,
    TableBody,
    TableCaption,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/Components/ui/table";
import { Tag } from "@/types";

export const TagTable = ({ tags }: { tags: Tag[] }) => {
    return (
        <Table>
            <TableCaption>A list of your tags</TableCaption>
            <TableHeader>
                <TableRow>
                    <TableHead>{<Checkbox></Checkbox>}</TableHead>
                    <TableHead>Tag Name</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>Updated At</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {tags.map((tag, index) => {
                    return (
                        <TagTableRow
                            key={index}
                            tag={tag}
                            onClick={() => {}}
                            onCheckedChange={() => {}}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};
