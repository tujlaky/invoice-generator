import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import InvoiceGenerator from "../islands/InvoiceGenerator.tsx";

export default define.page(function Home() {
  return (
    <>
      <Head>
        <title>Dutch invoice generator</title>
        <meta
          name="description"
          content="Create a Dutch invoice with VAT, preview, and PDF download."
        />
      </Head>
      <InvoiceGenerator />
    </>
  );
});
