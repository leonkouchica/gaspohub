import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthForm } from "@/components/auth/AuthForm";
import { useAuth } from "@/hooks/useAuth";
import { SEO } from "@/components/SEO";

const Auth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  if (user) {
    return null; // Prevent flash while redirecting
  }

  return (
    <>
      <SEO 
        title="Sign In"
        description="Sign in or create an account to book photographers, sell your photography services, and manage your orders."
        keywords="sign in, login, create account, photographer account"
      />
      <AuthForm />
    </>
  );
};

export default Auth;