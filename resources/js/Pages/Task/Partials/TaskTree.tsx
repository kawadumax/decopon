export default function TaskTree() {
    const tasks = ["aaa", "bbb", "ccc", "ddd", "eee", "fff", "ggg", "hhh"];

    return (
        <ul className="list-disc list-inside my-2">
            {tasks.map((task, index) => (
                <li
                    key={index}
                    className="pl-6 dark:text-gray-200 hover:bg-slate-600"
                >
                    <span>{task}</span>
                </li>
            ))}
        </ul>
    );
}
