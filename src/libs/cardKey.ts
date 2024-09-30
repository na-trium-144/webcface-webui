// import * as cardKey で使う
export const value = (member: string, field: string) =>
  `${member}:value:${field}`;
export const view = (member: string, field: string) =>
  `${member}:view:${field}`;
export const image = (member: string, field: string) =>
  `${member}:image:${field}`;
export const text = (member: string) => `${member}:text`;
export const robotModel = (member: string, field: string) =>
  `${member}:robotModel:${field}`;
export const canvas3D = (member: string, field: string) =>
  `${member}:canvas3D:${field}`;
export const canvas2D = (member: string, field: string) =>
  `${member}:canvas2D:${field}`;
export const func = (member: string) => `${member}:func`;
export const log = (member: string, field: string) => `${member}:log:${field}`;
export const connectionInfo = () => ":connectionInfo";
export const about = () => ":about";
export const serverLog = () => ":serverLog";
export const launcher = () => ":launcher";
