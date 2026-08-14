import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const SmartRedirect = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const userPermissions = JSON.parse(localStorage.getItem("permissions") || "[]");

    // If user has no permissions at all
    if (userPermissions.length === 0) {
      // Redirect to login after 3 seconds (optional)
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 5000);
      return;
    }

    // If user has admin permission, redirect to default sales page (/)
    if (userPermissions.includes("admin")) {
      navigate("/", { replace: true });
      return;
    }

    const routePriority = [
      { path: "/", permission: "invoice" },
      { path: "/dashboard", permission: "dashboard" },
      { path: "/customer", permission: "customer" },
      { path: "/items", permission: "products" },
      { path: "/vendor", permission: "vendor" },
      { path: "/purchase-order", permission: "purchase" },
      { path: "/grn", permission: "grn" },
      { path: "/bom", permission: "bom" },
      { path: "/inventory", permission: "inventory" },
      { path: "/work-order", permission: "workorder" },
      { path: "/defective", permission: "defective" },
      { path: "/admin", permission: "admin" }
    ];

    const allowedRoute = routePriority.find(route =>
      userPermissions.includes(route.permission)
    );

    if (allowedRoute) {
      navigate(allowedRoute.path, { replace: true });
    } else {
      // If somehow they have permissions but no allowed route, fallback
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column'
    }}>
      <div>You don't have proper permission to access this site.</div>
      <div>Please conatct to Admin.</div>
      <div></div>
      <div>Redirecting to login...</div>
    </div>
  );
};

export default SmartRedirect;
