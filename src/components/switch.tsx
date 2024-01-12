import ReactSwitch from "react-switch";

interface Props {
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: bool) => void;
}
export function Switch(props: Props) {
  return (
    <label>
      <ReactSwitch
        className="translate-y-1"
        onChange={props.onChange}
        checked={props.checked}
        disabled={props.disabled}
        height={14}
        width={36}
        handleDiameter={20}
        onHandleColor="#4c6"
        offHandleColor="#4c6"
      />
    </label>
  );
}
