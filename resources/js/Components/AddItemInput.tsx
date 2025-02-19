import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Plus } from "@mynaui/icons-react";
import React from "react";

interface AddItemInputProps {
	onAddItem: (itemName: string) => void;
	placeholder?: string;
	buttonText?: string;
}

const AddItemInput: React.FC<AddItemInputProps> = ({
	onAddItem,
	placeholder = "New Item Name",
	buttonText = "Add",
}) => {
	const [newItemName, setNewItemName] = React.useState("");

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNewItemName(e.target.value);
	};

	const handleAddNewItem = () => {
		if (newItemName.trim()) {
			onAddItem(newItemName.trim());
			setNewItemName("");
		}
	};

	const handleKeyDown = (event: React.KeyboardEvent) => {
		if (event.key === "Enter") {
			handleAddNewItem();
		}
	};

	return (
		<div className="flex justify-start gap-0 focus:ring-1">
			<Input
				className="rounded-r-none focus-visible:ring-0"
				placeholder={placeholder}
				value={newItemName}
				onChange={handleInputChange}
				onKeyDown={handleKeyDown}
			/>
			<Button className="rounded-l-none" onClick={handleAddNewItem}>
				<Plus /> {buttonText}
			</Button>
		</div>
	);
};

export default AddItemInput;
