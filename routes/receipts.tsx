import { Head } from "fresh/runtime";
import { define } from "../utils.ts";
import ReceiptGenerator from "../islands/ReceiptGenerator.tsx";

export default define.page(function Receipts() {
  return (
    <>
      <Head>
        <title>Dutch receipt generator</title>
        <meta
          name="description"
          content="Create a Dutch receipt (kassabon) with VAT breakdown, preview, and PDF download."
        />
      </Head>
      <ReceiptGenerator />
    </>
  );
});
