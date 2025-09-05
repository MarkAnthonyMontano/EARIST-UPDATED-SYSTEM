import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const currentStep = parseInt(localStorage.getItem("currentStep") || "1");

    if (!token) {
      setIsAuthorized("no-token");
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userRole = payload.role;

      // 🔒 REQUIREMENTS UPLOADER LOCK
      if (
        location.pathname.startsWith("/requirements_uploader") &&
        currentStep < 6
      ) {
        setIsAuthorized("block-requirements");
        return;
      }

      // ✅ Role check
      if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized("unauthorized");
      }
    } catch (err) {
      console.error("ProtectedRoute error:", err);
      setIsAuthorized("no-token");
    }
  }, [allowedRoles, location.pathname]);

  // 🚦 States
  if (isAuthorized === null) return <div>Loading...</div>;
  if (isAuthorized === true) return children;

  if (isAuthorized === "block-requirements") {
    // 🚫 Stop users from accessing /requirements_uploader before finishing step 5
    return <Navigate to="/applicant_dashboard" replace />;
  }

  if (isAuthorized === "unauthorized") {
    return <Navigate to="/applicant_dashboard" replace />;
  }

  // 🚫 No token (not logged in)
  if (isAuthorized === "no-token") {
    return <Navigate to="/" replace />;
  }

  return null;
};

export default ProtectedRoute;
