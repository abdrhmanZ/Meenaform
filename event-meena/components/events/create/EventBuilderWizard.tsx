"use client";

import { useState } from "react";
import { useEventBuilderStore } from "@/store/eventBuilderStore";
import { useToast } from "@/hooks/use-toast";
import WizardLayout from "./WizardLayout";
import Step1BasicInfo from "./Step1BasicInfo";
import Step2SectionsBuilder from "./Step2SectionsBuilder";
import Step3SectionsOrder from "./Step3SectionsOrder";
import Step4EventSettings from "./Step4EventSettings";
import Step5Preview from "./Step5Preview";

interface EventBuilderWizardProps {
  mode?: "create" | "edit";
  eventId?: string;
  onComplete: () => Promise<void>;
}

export default function EventBuilderWizard({
  mode = "create",
  eventId,
  onComplete,
}: EventBuilderWizardProps) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const {
    currentStep,
    title,
    nextStep,
    previousStep,
    areAllSectionsComplete,
    getIncompleteSectionsInfo,
  } = useEventBuilderStore();

  const handleNext = () => {
    // Validate sections completion for step 2
    if (currentStep === 2) {
      if (!areAllSectionsComplete()) {
        const info = getIncompleteSectionsInfo();
        toast({
          title: "لا يمكن المتابعة",
          description: `يجب إكمال جميع الأقسام قبل المتابعة. تم إكمال ${info.completed} من ${info.total} أقسام.`,
          variant: "destructive",
        });
        return;
      }
    }

    nextStep();
  };

  const handlePrevious = () => {
    previousStep();
  };

  const handleSaveDraft = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onComplete();
      toast({
        title: "تم الحفظ",
        description: mode === "edit" ? "تم حفظ التعديلات بنجاح" : "تم حفظ الحدث كمسودة بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حفظ التعديلات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await onComplete();
      toast({
        title: "نجح!",
        description: mode === "edit" ? "تم تحديث الحدث بنجاح" : "تم إنشاء الحدث بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: mode === "edit" ? "فشل تحديث الحدث" : "فشل إنشاء الحدث",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Render current step
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1BasicInfo />;
      case 2:
        return <Step2SectionsBuilder />;
      case 3:
        return <Step3SectionsOrder />;
      case 4:
        return <Step4EventSettings />;
      case 5:
        return <Step5Preview />;
      default:
        return <Step1BasicInfo />;
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 1) {
      return !title.trim();
    }
    if (currentStep === 2) {
      return !areAllSectionsComplete();
    }
    return false;
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      onNext={currentStep === 5 ? handleFinalSubmit : handleNext}
      onPrevious={handlePrevious}
      onSaveDraft={handleSaveDraft}
      nextLabel={currentStep === 5 ? (mode === "edit" ? "حفظ التعديلات" : "إنشاء الحدث") : "التالي"}
      isNextDisabled={isNextDisabled()}
      showSaveDraft={currentStep < 5}
      isSaving={isSaving}
    >
      {renderStep()}
    </WizardLayout>
  );
}

