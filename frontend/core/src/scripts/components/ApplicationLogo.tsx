import { ReactComponent as Logo } from "@/images/decopon-logo.svg?react";
import type { SVGAttributes } from "react";

export default function ApplicationLogo(props: SVGAttributes<SVGElement>) {
  return <Logo {...props} />;
}
