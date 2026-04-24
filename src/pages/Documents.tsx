import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { FileGrid } from "@/components/FileGrid";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  return <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="page-shell">
          <div className="page-container">
            <div className="mb-0">
              <FileUpload />
            </div>

            <div>
              <FileGrid searchTerm={searchTerm} activeTab="documents" />
            </div>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>;
};
export default Documents;
