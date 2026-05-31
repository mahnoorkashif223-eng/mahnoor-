import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/components/protected-route";
import Layout from "@/components/layout";
import SignIn from "@/pages/sign-in";
import SignUp from "@/pages/sign-up";
import Organizations from "@/pages/organizations";
import CreateOrganization from "@/pages/create-organization";
import OrganizationDetail from "@/pages/organization-detail";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/sign-in" element={<SignIn />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/organizations" element={<Organizations />} />
                <Route path="/organizations/new" element={<CreateOrganization />} />
                <Route path="/organizations/:id" element={<OrganizationDetail />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to="/organizations" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
