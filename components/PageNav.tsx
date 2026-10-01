export function PageNav(props: { current: "invoice" | "receipt" }) {
  return (
    <nav class="app-nav" aria-label="Pages">
      <a
        href="/"
        aria-current={props.current === "invoice" ? "page" : undefined}
      >
        Invoice
      </a>
      <a
        href="/receipts"
        aria-current={props.current === "receipt" ? "page" : undefined}
      >
        Receipt
      </a>
    </nav>
  );
}
