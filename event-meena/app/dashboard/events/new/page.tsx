"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import { useEventsStore } from "@/store/eventsStore";
import { useEventBuilderStore } from "@/store/eventBuilderStore";
import { useToast } from "@/hooks/use-toast";

// Import Wizard Components
import InitialChoice from "@/components/events/create/InitialChoice";
import WizardLayout from "@/components/events/create/WizardLayout";
import Step1BasicInfo from "@/components/events/create/Step1BasicInfo";
import Step2SectionsBuilder from "@/components/events/create/Step2SectionsBuilder";
import Step3SectionsOrder from "@/components/events/create/Step3SectionsOrder";
import Step4EventSettings from "@/components/events/create/Step4EventSettings";
import Step5Preview from "@/components/events/create/Step5Preview";
import EventSuccessPage from "@/components/events/create/EventSuccessPage";

function NewEventPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { createEvent, isLoading } = useEventsStore();
  const {
    currentStep,
    title,
    sections,
    nextStep,
    previousStep,
    buildEvent,
    reset,
  } = useEventBuilderStore();

  const [showInitialChoice, setShowInitialChoice] = useState(true);
  const [createdEventId, setCreatedEventId] = useState<string | null>(null);
  const [createdEventShareCode, setCreatedEventShareCode] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialMount = useRef(true);

  // Reset store when navigating to this page (unless coming from template selection)
  useEffect(() => {
    // Check if coming from template selection (system or user template)
    const fromParam = searchParams.get('from');
    const fromTemplate = fromParam === 'template' || fromParam === 'user-template';

    if (isInitialMount.current) {
      // First mount
      isInitialMount.current = false;

      // If template is loaded (currentStep > 1 or sections exist), skip initial choice
      if (currentStep > 1 || sections.length > 0) {
        setShowInitialChoice(false);
      } else if (!fromTemplate) {
        // Only reset if starting from scratch and not from template
        reset();
        setShowInitialChoice(true);
      }
    } else {
      // Subsequent navigation to this page - always reset unless from template
      if (!fromTemplate) {
        reset();
        setShowInitialChoice(true);
        setCreatedEventId(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  const handleChooseTemplate = () => {
    router.push("/dashboard/events/templates");
  };

  const handleChooseFromScratch = () => {
    setShowInitialChoice(false);
  };

  const handleNext = () => {
    // Validation for each step
    if (currentStep === 1) {
      if (!title.trim()) {
        toast({
          title: "خطأ",
          description: "يرجى إدخال عنوان الحدث",
          variant: "destructive",
        });
        return;
      }
    }

    if (currentStep === 2) {
      // Check if all sections have at least one component
      const emptySections = sections.filter((s) => s.components.length === 0);
      if (emptySections.length > 0) {
        toast({
          title: "تنبيه",
          description: `يوجد ${emptySections.length} قسم فارغ. يُفضل إضافة مكونات لجميع الأقسام.`,
        });
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
      const event = buildEvent();
      event.status = "draft";
      const newEvent = await createEvent(event);
      toast({
        title: "تم الحفظ",
        description: "تم حفظ الحدث كمسودة بنجاح",
      });
      router.push(`/dashboard/events/${newEvent.id}`);
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل حفظ المسودة",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateEvent = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      const event = buildEvent();
      event.status = "active";
      const newEvent = await createEvent(event);
      setCreatedEventId(newEvent.id);
      setCreatedEventShareCode(newEvent.shareCode || "");
      toast({
        title: "نجح!",
        description: "تم إنشاء الحدث بنجاح",
      });
    } catch (error) {
      toast({
        title: "خطأ",
        description: "فشل إنشاء الحدث",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show Initial Choice
  if (showInitialChoice) {
    return (
      <InitialChoice
        onChooseTemplate={handleChooseTemplate}
        onChooseFromScratch={handleChooseFromScratch}
      />
    );
  }

  // Show Success Page
  if (createdEventId && createdEventShareCode) {
    return (
      <EventSuccessPage
        eventId={createdEventId}
        shareCode={createdEventShareCode}
        eventTitle={title}
      />
    );
  }

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
    return false;
  };

  return (
    <WizardLayout
      currentStep={currentStep}
      onNext={currentStep === 5 ? handleCreateEvent : handleNext}
      onPrevious={handlePrevious}
      onSaveDraft={handleSaveDraft}
      nextLabel={currentStep === 5 ? "إنشاء الحدث" : "التالي"}
      isNextDisabled={isNextDisabled()}
      showSaveDraft={currentStep < 5}
      isSaving={isSaving}
    >
      {renderStep()}
    </WizardLayout>
  );
}

export default function NewEventPage() {
  return (
    <ProtectedRoute>
      <NewEventPageContent />
    </ProtectedRoute>
  );
}

