import { Layout } from "react-grid-layout";

const lsKey = "webcface-webui";
interface LS {
  layout: Layout[],
}
export function getLS() {
  const emptyLs: LS = {
    layout: [],
  };
  if (global != undefined && global.localStorage) {
    const lsItem = global.localStorage.getItem(lsKey) ;
    if(lsItem){
      const ls1 = JSON.parse(lsItem) as LS;
      if(typeof ls1 === "object" && ls1 && ls1.layout && Array.isArray(ls1.layout)){
        return ls1;
      }
    }
  }
  return emptyLs;
}

export function saveToLS(ls: LS) {
  if (global != undefined && global.localStorage) {
    global.localStorage.setItem(lsKey, JSON.stringify(ls));
  }
}
