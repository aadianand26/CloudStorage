import { useState } from "react";
import { FileUpload } from "@/components/FileUpload";
import { FileGrid } from "@/components/FileGrid";
import { AiInsights } from "@/components/AiInsights";
import { RecentActivity } from "@/components/RecentActivity";
import { DuplicateDetection } from "@/components/DuplicateDetection";
import { PricingOverview } from "@/components/PricingOverview";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/components/DashboardLayout";

const Index = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  return (
    <ProtectedRoute>
      <DashboardLayout onSearch={setSearchTerm}>
        <section className="px-3 md:px-6 pt-4 md:pt-6 pb-8 md:pb-12">
          <div className="max-w-7xl mx-auto space-y-4 md:space-y-6">
            {/* File Upload Zone */}
            <FileUpload />

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
              <div className="lg:col-span-2 space-y-4 md:space-y-6">
                {/* File Grid */}
                <FileGrid searchTerm={searchTerm} activeTab={activeTab} />
                
                {/* AI Recommendations */}
                <AiInsights />
              </div>
              
              <div className="space-y-4 md:space-y-6">
                {/* Recent Activity */}
                <RecentActivity />
                
                {/* Duplicate Detection */}
                <DuplicateDetection />
                
                {/* Pricing Overview */}
                <PricingOverview />
              </div>
            </div>
          </div>
        </section>
      </DashboardLayout>
    </ProtectedRoute>
  );
};

export default Index;
