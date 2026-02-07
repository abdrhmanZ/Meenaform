"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Users, ArrowLeft, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { SigningMode } from "@/types/document-signing";

interface SigningModeChoiceProps {
  onSelect: (mode: SigningMode) => void;
  onBack?: () => void;
}

export default function SigningModeChoice({
  onSelect,
  onBack,
}: SigningModeChoiceProps) {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.push("/dashboard/events/new");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={handleBack}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 ml-2" />
          العودة
        </Button>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            اختر نوع التوقيع
          </h1>
          <p className="text-lg text-gray-600">
            حدد عدد الموقّعين على الوثيقة
          </p>
        </div>

        {/* Choices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Single Signer */}
          <Card
            className="p-6 md:p-8 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:border-blue-400 hover:scale-[1.02]"
            onClick={() => onSelect("single")}
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-flex p-5 rounded-full bg-blue-50 mb-5 group-hover:bg-blue-100 transition-colors">
                <User className="w-12 h-12 md:w-14 md:h-14 text-blue-600" />
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                موقّع واحد
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-5 leading-relaxed text-sm md:text-base">
                شخص واحد فقط يوقّع على الوثيقة. مناسب للعقود الفردية والإقرارات.
              </p>

              {/* Features */}
              <ul className="text-sm text-gray-500 space-y-2 mb-5 text-right">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-500" />
                  توقيع واحد على الوثيقة
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-500" />
                  إعداد سريع وبسيط
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-500" />
                  مشاركة رابط واحد
                </li>
              </ul>

              {/* Button */}
              <Button
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                اختيار موقّع واحد
              </Button>
            </div>
          </Card>

          {/* Multi Signer */}
          <Card
            className="p-6 md:p-8 hover:shadow-xl transition-all duration-300 cursor-pointer group hover:border-purple-400 hover:scale-[1.02]"
            onClick={() => onSelect("multi")}
          >
            <div className="text-center">
              {/* Icon */}
              <div className="inline-flex p-5 rounded-full bg-purple-50 mb-5 group-hover:bg-purple-100 transition-colors">
                <Users className="w-12 h-12 md:w-14 md:h-14 text-purple-600" />
              </div>

              {/* Title */}
              <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-3">
                أكثر من موقّع
              </h2>

              {/* Description */}
              <p className="text-gray-600 mb-5 leading-relaxed text-sm md:text-base">
                عدة أشخاص يوقّعون على نفس الوثيقة. مناسب للعقود المشتركة والاتفاقيات.
              </p>

              {/* Features */}
              <ul className="text-sm text-gray-500 space-y-2 mb-5 text-right">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500" />
                  توقيعات متعددة على نفس الوثيقة
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500" />
                  كل موقّع يرى حقوله فقط
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-purple-500" />
                  تتبع حالة كل موقّع
                </li>
              </ul>

              {/* Button */}
              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                اختيار أكثر من موقّع
              </Button>
            </div>
          </Card>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-gray-500 mt-8">
          يمكنك تغيير هذا الإعداد لاحقاً قبل نشر الوثيقة
        </p>
      </div>
    </div>
  );
}

