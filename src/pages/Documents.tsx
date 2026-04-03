import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { FileGrid } from "@/components/FileGrid";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";
const Documents = () => {
  const [searchTerm, setSearchTerm] = useState('');
  return <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="px-3 pt-4 pb-8 md:px-6 md:pt-6 md:pb-12">
          <div className="mx-auto w-full max-w-7xl space-y-4 md:space-y-6">
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
