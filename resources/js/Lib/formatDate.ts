export const formatDate = (isoString: string): string => {
    const date = new Date(isoString);
    return date
        .toLocaleString("ja-JP", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
        })
        .replace(/\//g, "-");
};
