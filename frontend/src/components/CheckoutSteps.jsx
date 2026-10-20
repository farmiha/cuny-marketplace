import { Link } from "react-router-dom";

const STEPS = [
  { n: 1, label: "Cart", to: "/cart" },
  { n: 2, label: "Checkout", to: "/checkout" },
  { n: 3, label: "Confirmation", to: null },
];

// current = 1 (cart), 2 (checkout) or 3 (confirmation)
export default function CheckoutSteps({ current }) {
  return (
    <ol className="steps" aria-label="Checkout progress">
      {STEPS.map((step, i) => {
        const state =
          step.n === current ? "current" : step.n < current ? "done" : "";
        const inner = (
          <>
            <span className="step-dot">{step.n < current ? "✓" : step.n}</span>
            {step.label}
          </>
        );
        return (
          <li key={step.n} className="step-wrap">
            {i > 0 && <span className="step-line" aria-hidden="true" />}
            {/* only the Cart step is clickable, and only while checking out */}
            {step.n === 1 && current === 2 ? (
              <Link to={step.to} className={`step ${state}`}>
                {inner}
              </Link>
            ) : (
              <span
                className={`step ${state}`}
                aria-current={step.n === current ? "step" : undefined}
              >
                {inner}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
