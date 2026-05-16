import icon from "../../assets/icon.png";

function HermesLogo({ size = 32 }: { size?: number }): React.JSX.Element {
  return (
    <img
      src={icon}
      width={size}
      height={size}
      className="rounded-lg shadow-sm"
      style={{ borderRadius: "22%" }}
      alt="Mercury"
    />
  );
}

export default HermesLogo;
