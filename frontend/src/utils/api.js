// Small fetch wrapper for the ReliefChain FastAPI backend.
// All blockchain data shown in the UI comes from these calls.

const BASE = "/api";

async function request(path, { method = "GET", body, adminKey } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (adminKey) headers["X-Admin-Key"] = adminKey;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error("Cannot reach the ReliefChain backend. Is it running on port 8010?");
  }

  let data = null;
  try {
    data = await res.json();
  } catch {
    /* empty or non-JSON body */
  }
  if (!res.ok) {
    if (res.status === 502 || res.status === 504 || (res.status === 500 && !data)) {
      throw new Error("Cannot reach the ReliefChain backend. Is it running on port 8010?");
    }
    const detail = data?.detail;
    throw new Error(typeof detail === "string" ? detail : `Request failed (${res.status})`);
  }
  return data;
}

export const api = {
  health: () => request("/health"),
  campaigns: () => request("/campaigns"),
  campaign: (id) => request(`/campaigns/${id}`),
  donate: (id, donorName, amount) =>
    request(`/campaigns/${id}/donate`, { method: "POST", body: { donor_name: donorName, amount } }),
  stats: () => request("/stats"),
  verify: (hash) => request(`/verify/${encodeURIComponent(hash.trim())}`),

  adminLogin: (adminKey) => request("/admin/login", { method: "POST", body: { admin_key: adminKey } }),
  createCampaign: (adminKey, data) => request("/admin/campaigns", { method: "POST", body: data, adminKey }),
  allocate: (adminKey, id, data) => request(`/admin/campaigns/${id}/allocate`, { method: "POST", body: data, adminKey }),
  closeCampaign: (adminKey, id) => request(`/admin/campaigns/${id}/close`, { method: "POST", adminKey }),
};
