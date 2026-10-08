import PageHeader from "../components/PageHeader";
import TransactionVerification from "../components/TransactionVerification";

export default function Verify() {
  return (
    <>
      <PageHeader
        eyebrow="Verification"
        title="Verify a blockchain transaction"
        subtitle="Enter a transaction hash. ReliefChain fetches it straight from the blockchain and decodes what the smart contract recorded."
      />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <TransactionVerification />
      </div>
    </>
  );
}
