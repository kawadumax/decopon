import { Suspense } from "react";
import { Welcome } from "./Welcome";

export function App() {
  return (
    <Suspense fallback={null}>
      <Welcome />
    </Suspense>
  );
}

export default App;
