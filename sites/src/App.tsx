import { Suspense } from "react";
import { LandingPage } from "./LandingPage";

export function App() {
  return (
    <Suspense fallback={null}>
      <LandingPage />
    </Suspense>
  );
}

export default App;
