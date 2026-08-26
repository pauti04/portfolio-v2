// ----------------------------------------------------------------------------
// One thin marquee strip of system names between scenes. Pure CSS translateX
// loop over a duplicated track; static under prefers-reduced-motion. The
// names all appear elsewhere in real markup, so the strip is decorative.
// ----------------------------------------------------------------------------

const SYSTEMS = [
  "Reflight",
  "Bourse",
  "NetPulse",
  "CostDNA",
  "ChainCheck",
  "ChainCheck Action",
  "RasoiBot",
];

export default function Ticker() {
  return (
    <div
      aria-hidden="true"
      className="overflow-hidden border-y border-rule py-3 select-none"
    >
      <div className="ticker-track">
        {[0, 1].map((copy) => (
          <div key={copy} className="flex shrink-0 items-center">
            {SYSTEMS.map((name) => (
              <span
                key={name}
                className="credit-line px-7 whitespace-nowrap tracking-[0.28em]"
              >
                {name}&nbsp;&nbsp;·
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
