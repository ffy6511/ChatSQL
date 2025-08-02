import "./ShinyText.css";

const ShinyText = ({
  text,
  disabled = false,
  speed = 5,
  className = "",
  styles = {},
}) => {
  const animationDuration = `${speed}s`;

  return (
    <div
      className={`shiny-text ${disabled ? "disabled" : ""} ${className}`}
      style={{ animationDuration, ...styles }}
    >
      {text}
    </div>
  );
};

export default ShinyText;
