import AdminPanel from "../components/AdminPanel";
import PageHeader from "../components/PageHeader";

export default function Admin() {
  return (
    <>
      <PageHeader
        eyebrow="Relief organization"
        title="Admin Dashboard"
        subtitle="Create campaigns, record fund allocations and close campaigns. Each action is a smart-contract transaction that only the owner wallet can perform."
      />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <AdminPanel />
      </div>
    </>
  );
}
