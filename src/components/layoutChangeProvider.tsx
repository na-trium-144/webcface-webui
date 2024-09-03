import { createContext, ReactElement, useContext, useState } from "react";

interface LayoutChangeData {
  layoutChanging: boolean;
  setLayoutChanging: (changing: boolean) => void;
}
const LayoutChangeContext = createContext<LayoutChangeData>({
  layoutChanging: false,
  setLayoutChanging: () => undefined,
});
export const useLayoutChange = () => useContext(LayoutChangeContext);

export function LayoutChangeProvider(props: { children: ReactElement }) {
  const [layoutChanging, setLayoutChanging] = useState<boolean>(false);
  return (
    <LayoutChangeContext.Provider value={{ layoutChanging, setLayoutChanging }}>
      {props.children}
    </LayoutChangeContext.Provider>
  );
}
