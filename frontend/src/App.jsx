import { Component, useEffect } from "react";
import { Route, Routes, useLocation, Link } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Campaigns from "./pages/Campaigns";
import CampaignPage from "./pages/CampaignPage";
import Dashboard from "./pages/Dashboard";
import Transparency from "./pages/Transparency";
import Verify from "./pages/Verify";
import Admin from "./pages/Admin";
import About from "./pages/About";

/** Last line of defence: a render error shows a message instead of a blank page. */
class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-xl px-4 py-24 text-center">
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="mt-2 text-slate-600">{String(this.state.error.message || this.state.error)}</p>
          <button className="btn-primary mt-6" onClick={() => (window.location.href = "/")}>
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">Page not found</h1>
      <Link to="/" className="btn-primary mt-6">Go home</Link>
    </div>
  );
}

export default function App() {
  const location = useLocation();
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      <Navbar />
      <main className="flex-1">
        <ErrorBoundary key={location.pathname}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/campaigns/:id" element={<CampaignPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/transparency" element={<Transparency />} />
            <Route path="/verify" element={<Verify />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </ErrorBoundary>
      </main>
      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{ style: { borderRadius: "12px", fontSize: "14px" }, duration: 4500 }}
      />
    </div>
  );
}
