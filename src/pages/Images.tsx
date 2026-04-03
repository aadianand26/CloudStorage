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
        <section className="px-6 pt-8 pb-12">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold mb-4 gradient-text">
                Images
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                View and manage all your image files
              </p>
            </div>

            <div className="mb-12">
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
