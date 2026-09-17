import React from "react";
import { Button, Result, Space, Typography } from "antd";
import {
  HomeOutlined,
  ArrowLeftOutlined,
  ProjectOutlined,
  TeamOutlined,
  CheckSquareOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  DashboardOutlined,
  FileTextOutlined,
  CompassOutlined,
} from "@ant-design/icons";
import { useNavigate, useLocation } from "react-router-dom";

const { Text } = Typography;

interface NotFoundProps {
  isClientPortal?: boolean;
}

const NotFound: React.FC<NotFoundProps> = ({ isClientPortal = false }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const homePath = isClientPortal ? "/client-portal" : "/";

  const quickLinks = isClientPortal
    ? [
        { label: "Client Portal", path: "/client-portal", icon: <DashboardOutlined /> },
        { label: "Reports", path: "/client-portal/reports", icon: <FileTextOutlined /> },
      ]
    : [
        { label: "Projects", path: "/projects", icon: <ProjectOutlined /> },
        { label: "Clients", path: "/client", icon: <TeamOutlined /> },
        { label: "Tasks", path: "/task", icon: <CheckSquareOutlined /> },
        { label: "Attendance", path: "/attendence", icon: <CalendarOutlined /> },
        { label: "Worklog", path: "/worklog", icon: <ClockCircleOutlined /> },
      ];

  return (
    <div className="w-full">
      {/* Mobile View: Clean, non-overflowing, fully responsive */}
      <div className="flex flex-col items-center justify-center min-h-[70vh] py-6 px-3 md:hidden w-full">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 w-full max-w-sm text-center [&_.ant-result]:py-2 [&_.ant-result-image]:max-h-36 [&_.ant-result-image]:flex [&_.ant-result-image]:items-center [&_.ant-result-image]:justify-center [&_.ant-result-image_svg]:max-h-32 [&_.ant-result-title]:text-2xl [&_.ant-result-subtitle]:mt-1">
          <Result
            status="404"
            title={<span className="text-2xl font-bold text-slate-800">404</span>}
            subTitle={
              <div className="space-y-2 mt-1">
                <p className="text-sm font-semibold text-slate-700">
                  Oops! Page Not Found
                </p>
                <p className="text-xs text-slate-400">
                  The link might be broken, or the page may have been moved or removed.
                </p>
                <div className="pt-1">
                  <Text code className="text-xs text-slate-500 max-w-[220px] truncate inline-block">
                    {location.pathname}
                  </Text>
                </div>
              </div>
            }
            extra={
              <div className="flex flex-col gap-2.5 w-full mt-3">
                <Button
                  type="primary"
                  icon={<HomeOutlined />}
                  onClick={() => navigate(homePath)}
                  className="h-10 w-full rounded-xl font-medium shadow-sm bg-blue-600 hover:bg-blue-500 flex items-center justify-center"
                >
                  Back to Home
                </Button>
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(-1)}
                  className="h-10 w-full rounded-xl font-medium text-slate-700 border-slate-200 flex items-center justify-center"
                >
                  Go Back
                </Button>
              </div>
            }
          />
        </div>
      </div>

      {/* Web / Desktop View (Upgraded proper modern presentation) */}
      <div className="hidden md:flex items-center justify-center min-h-[calc(100vh-140px)] p-8">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 max-w-5xl w-full p-10 lg:p-14 transition-all">
          <div className="grid grid-cols-12 gap-10 items-center">
            {/* Left Content Column */}
            <div className="col-span-7 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-100/80 w-fit mb-4">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                Error 404 • Page Not Found
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-3">
                Lost your way?
              </h1>

              <p className="text-slate-600 text-sm lg:text-base leading-relaxed mb-5">
                The page you requested could not be found. It may have been moved, renamed, or might be temporarily unavailable.
              </p>

              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 rounded-xl px-4 py-2.5 mb-6 max-w-md">
                <span className="text-xs font-mono text-slate-400 select-none">Path:</span>
                <Text code className="text-xs text-slate-600 font-mono truncate flex-1 border-0 bg-transparent p-0">
                  {location.pathname}
                </Text>
              </div>

              <div className="flex items-center gap-3 mb-8">
                <Button
                  type="primary"
                  size="large"
                  icon={<HomeOutlined />}
                  onClick={() => navigate(homePath)}
                  className="h-11 px-6 rounded-xl font-medium shadow-sm bg-blue-600 hover:bg-blue-500"
                >
                  Back to Home
                </Button>
                <Button
                  size="large"
                  icon={<ArrowLeftOutlined />}
                  onClick={() => navigate(-1)}
                  className="h-11 px-5 rounded-xl font-medium text-slate-700 hover:text-blue-600 border-slate-200"
                >
                  Go Back
                </Button>
              </div>

              {/* Quick Navigation Shortcuts */}
              <div className="pt-6 border-t border-slate-100">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                  <CompassOutlined className="text-slate-400" />
                  Popular Destinations
                </div>
                <div className="flex flex-wrap gap-2">
                  {quickLinks.map((item) => (
                    <Button
                      key={item.path}
                      type="default"
                      size="middle"
                      icon={item.icon}
                      onClick={() => navigate(item.path)}
                      className="text-xs font-medium text-slate-600 hover:text-blue-600 hover:border-blue-400 rounded-lg px-3 py-1.5 h-8 flex items-center bg-slate-50/70 border-slate-200 hover:bg-white transition-all shadow-2xs"
                    >
                      {item.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Graphic Column */}
            <div className="col-span-5 flex items-center justify-center select-none">
              <div className="relative w-full max-w-[340px] aspect-square flex items-center justify-center">
                {/* Background decorative glowing rings */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-blue-50 via-indigo-50 to-sky-50 -z-10 animate-pulse" />
                <div className="absolute inset-6 rounded-full border border-dashed border-blue-200/70 -z-10" />

                {/* SVG Visual Composition */}
                <svg
                  className="w-4/5 h-4/5"
                  viewBox="0 0 240 240"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  {/* Subtle shadows & ground plane */}
                  <ellipse cx="120" cy="195" rx="75" ry="14" fill="#0f172a" fillOpacity="0.06" />

                  {/* Big Stylized '4' Left */}
                  <path
                    d="M55 140V122L85 80H100V122H112V136H100V155H85V136H55ZM85 122V103L69 122H85Z"
                    fill="#3b82f6"
                  />

                  {/* Center Compass / Radar Search Sphere */}
                  <g transform="translate(120, 118)">
                    <circle r="36" fill="url(#sphereGradient)" />
                    <circle r="36" stroke="#2563eb" strokeWidth="2" strokeOpacity="0.3" />
                    <circle r="26" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" strokeDasharray="3 3" />
                    {/* Crosshairs */}
                    <line x1="-36" y1="0" x2="36" y2="0" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3" />
                    <line x1="0" y1="-36" x2="0" y2="36" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.3" />
                    {/* Center glowing radar dot */}
                    <circle cx="6" cy="-8" r="4" fill="#60a5fa" />
                    <circle cx="6" cy="-8" r="8" stroke="#93c5fd" strokeWidth="1" strokeOpacity="0.6" />
                    <circle cx="0" cy="0" r="3" fill="#ffffff" />
                  </g>

                  {/* Big Stylized '4' Right */}
                  <path
                    d="M165 140V122L195 80H210V122H222V136H210V155H195V136H165ZM195 122V103L179 122H195Z"
                    fill="#3b82f6"
                  />

                  {/* Floating sparkles / badges */}
                  <circle cx="48" cy="65" r="3" fill="#60a5fa" />
                  <circle cx="195" cy="55" r="4" fill="#93c5fd" />
                  <circle cx="185" cy="175" r="2.5" fill="#3b82f6" />
                  <circle cx="55" cy="170" r="2" fill="#93c5fd" />

                  {/* Gradients */}
                  <defs>
                    <linearGradient id="sphereGradient" x1="-36" y1="-36" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#2563eb" />
                      <stop offset="1" stopColor="#1d4ed8" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
