"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import SigningModeChoice from "@/components/events/document-signing/SigningModeChoice";
import { useDocumentSigningBuilderStore } from "@/store/documentSigningBuilderStore";
import { SigningMode } from "@/types/document-signing";

// Dynamic import to avoid SSR issues with react-pdf
const DocumentSigningBuilder = dynamic(
  () => import("@/components/events/document-signing/DocumentSigningBuilder"),
  { ssr: false, loading: () => <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div> }
);

function DocumentSigningPageContent() {
  const router = useRouter();
  const [showModeChoice, setShowModeChoice] = useState(true);
  const { signingMode, setSigningMode, reset } = useDocumentSigningBuilderStore();

  const handleCancel = () => {
    reset();
    router.push("/dashboard/events");
  };

  const handleModeSelect = (mode: SigningMode) => {
    setSigningMode(mode);
    setShowModeChoice(false);
  };

  const handleBackToModeChoice = () => {
    reset();
    setShowModeChoice(true);
  };

  // عرض شاشة اختيار نوع التوقيع أولاً
  if (showModeChoice) {
    return (
      <SigningModeChoice
        onSelect={handleModeSelect}
        onBack={() => router.push("/dashboard/events/new")}
      />
    );
  }

  return (
    <DocumentSigningBuilder
      onCancel={handleCancel}
      onBackToModeChoice={handleBackToModeChoice}
    />
  );
}

export default function DocumentSigningPage() {
  return (
    <ProtectedRoute>
      <DocumentSigningPageContent />
    </ProtectedRoute>
  );
}
