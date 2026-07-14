export default function DisplayOptions({
  displayOptions,
  toggleDisplayOption,
  setDisplayOption,
}) {
  return (
    <section className="control-section">
      <h3>Display Options</h3>

      <button
        type="button"
        className={`display-option-button ${
          displayOptions.tacoPriceCard ? "active" : ""
        }`}
        onClick={() =>
          toggleDisplayOption("tacoPriceCard")
        }
      >
        {displayOptions.tacoPriceCard
          ? "✓ Taco Price Card"
          : "Use Taco Price Card"}
      </button>

      <div className="fit-mode-control">
        <span>Menu fit</span>

        <div className="fit-mode-buttons">
          {["normal", "compact", "extraCompact"].map((mode) => (
            <button
              key={mode}
              type="button"
              className={
                displayOptions.fitMode === mode
                  ? "active"
                  : ""
              }
              onClick={() =>
                setDisplayOption("fitMode", mode)
              }
            >
              {mode === "normal" && "Normal"}
              {mode === "compact" && "Compact"}
              {mode === "extraCompact" && "Extra compact"}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}