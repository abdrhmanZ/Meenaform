"use client";

import { 
  Globe, 
  Languages, 
  Rocket, 
  Shield, 
  FileText, 
  HeadphonesIcon,
  CheckCircle2,
  XCircle,
  Sparkles
} from "lucide-react";

const advantages = [
  {
    icon: Languages,
    title: "عربي 100%",
    description: "واجهة مستخدم عربية بالكامل مصممة من اليمين لليسار، بدون ترجمة آلية أو حلول وسط.",
    highlight: true,
  },
  {
    icon: Globe,
    title: "الأولى في الشرق الأوسط",
    description: "المنصة العربية الأولى المتخصصة في إنشاء الأحداث التفاعلية والاستبيانات الاحترافية.",
    highlight: true,
  },
  {
    icon: Rocket,
    title: "سهولة فائقة",
    description: "واجهة بديهية مصممة للمستخدم العربي. أنشئ حدثك في دقائق بدون أي خبرة تقنية.",
    highlight: false,
  },
  {
    icon: FileText,
    title: "تقارير PDF عربية",
    description: "صدّر تقاريرك بصيغة PDF احترافية مع دعم كامل للغة العربية والتنسيق من اليمين لليسار.",
    highlight: false,
  },
  {
    icon: Shield,
    title: "خصوصية وأمان",
    description: "بياناتك محمية على سيرفرات آمنة مع التزام كامل بمعايير حماية البيانات.",
    highlight: false,
  },
  {
    icon: HeadphonesIcon,
    title: "دعم فني عربي",
    description: "فريق دعم متخصص يتحدث لغتك ويفهم احتياجاتك. مساعدة فورية عند الحاجة.",
    highlight: false,
  },
];

const comparison = [
  { feature: "واجهة عربية أصلية", us: true, them: false },
  { feature: "تصميم من اليمين لليسار", us: true, them: false },
  { feature: "تقارير PDF بالعربي", us: true, them: false },
  { feature: "دعم فني بالعربي", us: true, them: false },
  { feature: "قوالب مخصصة للسوق العربي", us: true, them: false },
  { feature: "تحليلات وإحصائيات", us: true, them: true },
];

export default function WhyUsSection() {
  return (
    <section id="why-us" className="py-20 lg:py-28 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* العنوان */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-100 rounded-full text-[#1a56db] text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>لماذا نحن؟</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
            البديل العربي الأمثل{" "}
            <span className="text-[#1a56db]">لـ Google Forms</span>
          </h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            منصة مصممة خصيصاً للمستخدم العربي، بواجهة عربية أصلية وليست مترجمة، 
            مع كل المميزات التي تحتاجها لإنشاء أحداث تفاعلية احترافية.
          </p>
        </div>

        {/* المميزات */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {advantages.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className={`relative p-6 rounded-2xl border transition-all duration-300 hover:shadow-md ${
                  item.highlight 
                    ? "bg-gradient-to-br from-[#1a56db]/5 to-[#1a56db]/10 border-[#1a56db]/20 hover:border-[#1a56db]/40" 
                    : "bg-white border-gray-200 hover:border-gray-300"
                }`}
              >
                {item.highlight && (
                  <div className="absolute -top-3 right-4 px-3 py-1 bg-[#1a56db] text-white text-xs font-bold rounded-full">
                    مميز
                  </div>
                )}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                  item.highlight ? "bg-[#1a56db]" : "bg-blue-50"
                }`}>
                  <Icon className={`w-6 h-6 ${item.highlight ? "text-white" : "text-[#1a56db]"}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">{item.description}</p>
              </div>
            );
          })}
        </div>

        {/* جدول المقارنة */}
        <div className="max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
            مقارنة سريعة
          </h3>
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
              <div className="p-4 font-bold text-gray-900">الميزة</div>
              <div className="p-4 font-bold text-[#1a56db] text-center">مينا إيفنت</div>
              <div className="p-4 font-bold text-gray-500 text-center">Google Forms</div>
            </div>
            {/* Rows */}
            {comparison.map((row, index) => (
              <div 
                key={index} 
                className={`grid grid-cols-3 ${index !== comparison.length - 1 ? "border-b border-gray-100" : ""}`}
              >
                <div className="p-4 text-gray-700 text-sm">{row.feature}</div>
                <div className="p-4 flex justify-center">
                  {row.us ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
                <div className="p-4 flex justify-center">
                  {row.them ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

