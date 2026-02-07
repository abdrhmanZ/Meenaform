"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Save, Loader2 } from "lucide-react";
import WizardProgressBar from "./WizardProgressBar";

interface WizardLayoutProps {
  currentStep: number;
  children: ReactNode;
  onNext?: () => void;
  onPrevious?: () => void;
  onSaveDraft?: () => void;
  nextLabel?: string;
  previousLabel?: string;
  isNextDisabled?: boolean;
  showSaveDraft?: boolean;
  isSaving?: boolean;
}

const steps = [
  {
    number: 1,
    title: "المعلومات الأساسية",
    description: "الاسم والوصف",
  },
  {
    number: 2,
    title: "بناء الأقسام",
    description: "المكونات والمحتوى",
  },
  {
    number: 3,
    title: "ترتيب الأقسام",
    description: "تنظيم العرض",
  },
  {
    number: 4,
    title: "الإعدادات",
    description: "التفضيلات والخيارات",
  },
  {
    number: 5,
    title: "المعاينة",
    description: "المراجعة النهائية",
  },
];

export default function WizardLayout({
  currentStep,
  children,
  onNext,
  onPrevious,
  onSaveDraft,
  nextLabel = "التالي",
  previousLabel = "السابق",
  isNextDisabled = false,
  showSaveDraft = true,
  isSaving = false,
}: WizardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <WizardProgressBar currentStep={currentStep} steps={steps} />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Main Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
            {children}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between gap-4">
            {/* Previous Button */}
            <div>
              {currentStep > 1 && onPrevious && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onPrevious}
                  className="hover:bg-gray-50"
                >
                  <ArrowRight className="w-5 h-5 ml-2" />
                  {previousLabel}
                </Button>
              )}
            </div>

            {/* Save Draft & Next */}
            <div className="flex items-center gap-3">
              {/* Save Draft */}
              {showSaveDraft && onSaveDraft && currentStep < 5 && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onSaveDraft}
                  disabled={isSaving}
                  className="hover:bg-gray-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 ml-2" />
                  )}
                  {isSaving ? "جاري الحفظ..." : "حفظ كمسودة"}
                </Button>
              )}

              {/* Next Button */}
              {onNext && (
                <Button
                  size="lg"
                  onClick={onNext}
                  disabled={isNextDisabled || isSaving}
                  className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      {nextLabel}
                      <ArrowLeft className="w-5 h-5 mr-2" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

