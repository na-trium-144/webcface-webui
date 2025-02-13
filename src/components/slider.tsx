import ReactSlider from "react-slider";

interface Props {
  className?: string;
  style?: object;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange?: (value: number) => void;
  onAfterChange?: (value: number) => void;
  disabled?: boolean;
}
export function Slider(props: Props) {
  return (
    <div
      className={(props.className || "") + " inline-block h-5 my-1.5"}
      style={props.style}
    >
      <ReactSlider
        {...props}
        className="inline-block w-full h-full "
        renderTrack={(p) => (
          <div
            {...p}
            className={
              p.className +
              " absolute inset-0 my-1.5 bg-neutral-300 rounded-full"
            }
          />
        )}
        renderThumb={(p) => (
          <div
            {...p}
            className={
              p.className +
              " absolute h-full aspect-square rounded-full " +
              "bg-green-600 hover:bg-green-500 active:bg-green-500 " +
              "cursor-grab active:cursor-grabbing"
            }
          />
        )}
      />
    </div>
  );
}
