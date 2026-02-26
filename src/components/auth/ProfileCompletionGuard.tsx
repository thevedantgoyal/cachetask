import { Navigate, useLocation } from "react-router-dom";
import { useExtendedProfile } from "@/hooks/useProfileManagement";
import { ConnectPlusLoader } from "@/components/ui/ConnectPlusLoader";

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
}

export const ProfileCompletionGuard = ({ children }: ProfileCompletionGuardProps) => {
  const { data: profile, isLoading } = useExtendedProfile();
  const location = useLocation();

  // Don't guard the complete-profile page itself or auth pages
  if (
    location.pathname === "/complete-profile" ||
    location.pathname === "/auth" ||
    location.pathname === "/reset-password"
  ) {
    return <>{children}</>;
  }

  if (isLoading) {
    return <ConnectPlusLoader variant="inline" message="Loading profile..." />;
  }

  // If profile exists and is not completed, redirect to complete-profile
  if (profile && !profile.profile_completed) {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};
