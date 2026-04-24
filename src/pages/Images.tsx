import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { FileGrid } from "@/components/FileGrid";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";

const Images = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="page-shell">
          <div className="page-container">
            <div className="mb-6 text-center md:mb-10">
              <h1 className="mb-3 text-3xl font-bold gradient-text sm:text-4xl">
                Images
              </h1>
              <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base md:text-lg">
                View and manage all your image files
              </p>
            </div>

            <div className="mb-4 md:mb-6">
              <FileUpload />
            </div>

            <div>
              <FileGrid searchTerm={searchTerm} activeTab="images" />
            </div>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Images;
