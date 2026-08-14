import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./Menu.css";

const Menu = ({ Icon, Title, path, badge }) => {
  const location = useLocation();

  const isActive =
    path === "/" ? location.pathname === "/" : location.pathname.startsWith(path);

  return (
    <li className={isActive ? "active" : ""}>
      <Link to={path} className={Title === "Logout" ? "logout" : ""}>
        {Icon}
        <span className="text">{Title}</span>
        {badge && <span className="badge">{badge}</span>}
      </Link>
    </li>
  );
};

export default Menu;
