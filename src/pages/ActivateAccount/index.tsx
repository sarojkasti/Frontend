import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { Button, Result, Spin } from "antd";
import { activateAccount } from "@/service/auth.service";

const ActivateAccountPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string>("The activation link is invalid or has expired.");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("No activation token provided.");
      return;
    }

    activateAccount(token)
      .then(() => {
        setStatus("success");
      })
      .catch((err: any) => {
        setStatus("error");
        const msg =
          err?.response?.data?.message ||
          "The activation link is invalid or has expired. If your account is already active, please log in.";
        setErrorMessage(msg);
      });
  }, [token]);

  if (status === "loading") {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <div style={{ textAlign: "center" }}>
          <Spin size="large" />
          <p style={{ marginTop: 16, color: "#6b7280" }}>Activating your account...</p>
        </div>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <Result
          status="success"
          title="Account Activated Successfully!"
          subTitle="Your account has been activated. You can now log in with your credentials."
          extra={[
            <Button type="primary" key="login">
              <Link to="/login">Go to Login</Link>
            </Button>,
          ]}
        />
      </div>
    );
  }

  return (
    <div style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
      <Result
        status="error"
        title="Activation Failed"
        subTitle={errorMessage}
        extra={[
          <Button type="primary" key="login">
            <Link to="/login">Return to Login</Link>
          </Button>,
        ]}
      />
    </div>
  );
};

export default ActivateAccountPage;
