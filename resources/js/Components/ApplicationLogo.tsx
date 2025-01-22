import { SVGAttributes } from "react";
import { ReactComponent as Logo } from "/public/images/logo.svg?react";

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
    return <Logo {...props} />;
}
