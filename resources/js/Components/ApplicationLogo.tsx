import { ImgHTMLAttributes } from "react";

export default function ApplicationLogo(
    props: ImgHTMLAttributes<HTMLImageElement>
) {
    return (
        <img
            src="/images/decopon-icon-300x300.png"
            alt="Application Logo"
            {...props}
        />
    );
}
