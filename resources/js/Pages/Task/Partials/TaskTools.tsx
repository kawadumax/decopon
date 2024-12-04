import { Link } from "@inertiajs/react";

export const TaskTools = () => {
    // const [tasks, setTasks] = useState([]);
    // const [newTask, setNewTask] = useState('');
    // const addTask = () => {
    //     if (newTask.trim() !== '') {
    //         setTasks([...tasks, { text: newTask, completed: false }]);
    //         setNewTask('');
    //     }
    // };

    return (
        <Link
            href=""
            method="post"
            as="button"
            type="button"
            className="btn m-5 dark:text-gray-200 dark:bg-cyan-500"
        >
            Add Task
        </Link>
    );
};
