export default function DisplayOptions({
  displayOptions,
  toggleDisplayOption,
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
    </section>
  );
}