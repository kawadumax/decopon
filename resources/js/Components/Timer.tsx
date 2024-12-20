import { useEffect, useState } from "react";

export const Timer = () => {
    const [currentTime, setCurrentTime] = useState<string>("");

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, "0");
            const minutes = now.getMinutes().toString().padStart(2, "0");
            setCurrentTime(`${hours}:${minutes}`);
        };

        updateTime(); // 初回実行
        const timerId = setInterval(updateTime, 60000); // 1分ごとに更新

        return () => clearInterval(timerId); // クリーンアップ
    }, []);
    return (
        <div>
            <span>{currentTime}</span>
        </div>
    );
};
