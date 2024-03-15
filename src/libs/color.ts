// todo: tailwindcssの色名、htmlのではない
export const colorName = [
  "inherit",
  "black",
  "white",
  "slate",
  "grey",
  "zinc",
  "neutral",
  "stone",
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
];

// todo: 色がてきとう
export const colorNameHover = [
  "inherit",
  "dimgray",
  "whitesmoke",
  "darkgray", // grayより明るい
  "darkgray", // todo: slate, gray, zinc, neutral, stone の違い is 何
  "darkgray",
  "darkgray",
  "darkgray",
  "#f44", // <- red #ff0000
  "#fc4", // <- orange #ffa500
  "", // <- amber 
  "#ff4", // <- yellow #ffff00
  "#4f4", // <- lime #00ff00
  "#484", // <- green #008000
  "", // emerald
  "#488", // <- teal #008080
  "#4ff", // <- cyan #00ffff
  "#cff", // sky skyblue#87ceeb
  "#44f", // blue #0000ff
  "#94c", // <- indigo #4b0082
  "#fcf", // <- #ee82ee
  "#848", // <- purple #800080
  "#f4f", // <- #ff00ff
  "#fde", // <- #ffc0cb
  "", // <- rose
];
const buttonColorClass = [
  [
    "border-inherit-300 bg-inherit-100 hover:bg-inherit-200 active:bg-inherit-300 ",
    "text-inherit-500 ",
  ],
  [
    "border-neutral-900 bg-neutral-700 hover:bg-neutral-800 active:bg-neutral-900 ",
    "text-black ",
  ],
  // ["border-black-300 bg-black-100 hover:bg-black-200 active:bg-black-300 ", "text-black-500"],
  [
    "border-neutral-200 bg-white hover:bg-neutral-100 active:bg-neutral-200 ",
    "text-neutral-400 ",
  ],
  // ["border-white-300 bg-white-100 hover:bg-white-200 active:bg-white-300 ", "text-white-500"],
  [
    "border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 ",
    "text-slate-500 ",
  ],
  [
    "border-grey-300 bg-grey-100 hover:bg-grey-200 active:bg-grey-300 ",
    "text-grey-500 ",
  ],
  [
    "border-zinc-300 bg-zinc-100 hover:bg-zinc-200 active:bg-zinc-300 ",
    "text-zinc-500 ",
  ],
  [
    "border-neutral-300 bg-neutral-100 hover:bg-neutral-200 active:bg-neutral-300 ",
    "text-neutral-500 ",
  ],
  [
    "border-stone-300 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 ",
    "text-stone-500 ",
  ],
  [
    "border-red-300 bg-red-100 hover:bg-red-200 active:bg-red-300 ",
    "text-red-500 ",
  ],
  [
    "border-orange-300 bg-orange-100 hover:bg-orange-200 active:bg-orange-300 ",
    "text-orange-500 ",
  ],
  [
    "border-amber-300 bg-amber-100 hover:bg-amber-200 active:bg-amber-300 ",
    "text-amber-500 ",
  ],
  [
    "border-yellow-300 bg-yellow-100 hover:bg-yellow-200 active:bg-yellow-300 ",
    "text-yellow-500 ",
  ],
  [
    "border-lime-300 bg-lime-100 hover:bg-lime-200 active:bg-lime-300 ",
    "text-lime-500 ",
  ],
  [
    "border-green-300 bg-green-100 hover:bg-green-200 active:bg-green-300 ",
    "text-green-500 ",
  ],
  [
    "border-emerald-300 bg-emerald-100 hover:bg-emerald-200 active:bg-emerald-300 ",
    "text-emerald-500 ",
  ],
  [
    "border-teal-300 bg-teal-100 hover:bg-teal-200 active:bg-teal-300 ",
    "text-teal-500 ",
  ],
  [
    "border-cyan-300 bg-cyan-100 hover:bg-cyan-200 active:bg-cyan-300 ",
    "text-cyan-500 ",
  ],
  [
    "border-sky-300 bg-sky-100 hover:bg-sky-200 active:bg-sky-300 ",
    "text-sky-500 ",
  ],
  [
    "border-blue-300 bg-blue-100 hover:bg-blue-200 active:bg-blue-300 ",
    "text-blue-500 ",
  ],
  [
    "border-indigo-300 bg-indigo-100 hover:bg-indigo-200 active:bg-indigo-300 ",
    "text-indigo-500 ",
  ],
  [
    "border-violet-300 bg-violet-100 hover:bg-violet-200 active:bg-violet-300 ",
    "text-violet-500 ",
  ],
  [
    "border-purple-300 bg-purple-100 hover:bg-purple-200 active:bg-purple-300 ",
    "text-purple-500 ",
  ],
  [
    "border-fuchsia-300 bg-fuchsia-100 hover:bg-fuchsia-200 active:bg-fuchsia-300 ",
    "text-fuchsia-500 ",
  ],
  [
    "border-pink-300 bg-pink-100 hover:bg-pink-200 active:bg-pink-300 ",
    "text-pink-500 ",
  ],
  [
    "border-rose-300 bg-rose-100 hover:bg-rose-200 active:bg-rose-300 ",
    "text-rose-500 ",
  ],
];

export const bgButtonColorClass = (c: number) => buttonColorClass[c][0];
export const textColorClass = (c: number) => buttonColorClass[c][1];
