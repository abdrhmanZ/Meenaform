"use client";

import { useEffect, useState } from "react";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import {
  FileText,
  Shield,
  BookOpen,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Scale,
  Lock,
  Users,
  AlertCircle,
  CheckCircle,
  Mail,
} from "lucide-react";

// Types
interface Section {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

interface FAQItem {
  question: string;
  answer: string;
}

// Navigation sections
const sections: Section[] = [
  {
    id: "terms",
    title: "الشروط والأحكام",
    icon: FileText,
    description: "شروط استخدام منصة مينا إيفنت",
  },
  {
    id: "privacy",
    title: "سياسة الخصوصية",
    icon: Shield,
    description: "كيف نحمي بياناتك ونتعامل معها",
  },
  {
    id: "usage",
    title: "سياسة الاستخدام",
    icon: BookOpen,
    description: "إرشادات الاستخدام المقبول للمنصة",
  },
  {
    id: "faq",
    title: "الأسئلة الشائعة",
    icon: HelpCircle,
    description: "إجابات على الأسئلة الأكثر شيوعاً",
  },
];

export default function LegalPage() {
  const [activeSection, setActiveSection] = useState("terms");
  const [openFAQs, setOpenFAQs] = useState<number[]>([]);

  // Handle hash navigation on mount
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && sections.find((s) => s.id === hash)) {
        setActiveSection(hash);
        setTimeout(() => {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    };

    // Handle initial hash on mount
    handleHashChange();

    // Listen for hash changes
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    window.history.pushState(null, "", `#${sectionId}`);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const toggleFAQ = (index: number) => {
    setOpenFAQs((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#1a56db] to-[#1e40af] pt-24 pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
              المعلومات القانونية
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              نلتزم بالشفافية في جميع سياساتنا. اطلع على الشروط والأحكام وسياسات
              الخصوصية والاستخدام الخاصة بمنصة مينا إيفنت
            </p>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 text-right ${
                  isActive
                    ? "bg-[#1a56db] text-white scale-105"
                    : "bg-white text-gray-700 hover:shadow-xl hover:-translate-y-1"
                }`}
              >
                <Icon className={`w-8 h-8 mb-3 ${isActive ? "text-white" : "text-[#1a56db]"}`} />
                <h3 className="font-bold text-sm sm:text-base mb-1">{section.title}</h3>
                <p className={`text-xs hidden sm:block ${isActive ? "text-blue-100" : "text-gray-500"}`}>
                  {section.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto space-y-16">
          {/* Terms Section */}
          <TermsSection id="terms" />

          {/* Privacy Section */}
          <PrivacySection id="privacy" />

          {/* Usage Section */}
          <UsageSection id="usage" />

          {/* FAQ Section */}
          <FAQSection id="faq" openFAQs={openFAQs} toggleFAQ={toggleFAQ} />
        </div>
      </div>

      <Footer />
    </div>
  );
}

// ============================================
// Terms and Conditions Section
// ============================================
function TermsSection({ id }: { id: string }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-[#1a56db]" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">الشروط والأحكام</h2>
            <p className="text-gray-500 text-sm">آخر تحديث: يناير 2026</p>
          </div>
        </div>

        <div className="prose prose-lg max-w-none text-gray-600 space-y-6">
          <div className="bg-blue-50 border-r-4 border-[#1a56db] p-4 rounded-lg">
            <p className="text-gray-700 m-0">
              باستخدامك لمنصة مينا إيفنت، فإنك توافق على الالتزام بهذه الشروط والأحكام.
              يرجى قراءتها بعناية قبل استخدام خدماتنا.
            </p>
          </div>

          <TermsItem
            icon={Scale}
            title="1. القبول بالشروط"
            content="عند إنشاء حساب أو استخدام أي من خدمات منصة مينا إيفنت، فإنك توافق على الالتزام بهذه الشروط والأحكام وجميع القوانين واللوائح المعمول بها في المملكة العربية السعودية. إذا كنت لا توافق على أي من هذه الشروط، يُرجى عدم استخدام خدماتنا."
          />

          <TermsItem
            icon={Users}
            title="2. الأهلية"
            content="يجب أن يكون عمرك 18 عاماً على الأقل لاستخدام خدماتنا. باستخدامك للمنصة، فإنك تُقر وتضمن أنك تستوفي متطلبات الأهلية هذه وأن لديك الصلاحية القانونية للدخول في هذه الاتفاقية."
          />

          <TermsItem
            icon={Lock}
            title="3. الحساب والأمان"
            content="أنت مسؤول عن الحفاظ على سرية معلومات حسابك وكلمة المرور الخاصة بك. يجب عليك إخطارنا فوراً بأي استخدام غير مصرح به لحسابك. نحتفظ بالحق في تعليق أو إنهاء حسابك في حالة انتهاك هذه الشروط."
          />

          <TermsItem
            icon={FileText}
            title="4. استخدام الخدمة"
            content="تمنحك منصة مينا إيفنت ترخيصاً محدوداً وغير حصري وغير قابل للتحويل لاستخدام خدماتنا لإنشاء الأحداث والاستبيانات والنماذج. يُحظر استخدام المنصة لأي أغراض غير قانونية أو ضارة أو مسيئة."
          />

          <TermsItem
            icon={AlertCircle}
            title="5. المحتوى والملكية الفكرية"
            content="جميع المحتويات التي تنشئها على المنصة تبقى ملكاً لك. ومع ذلك، تمنحنا ترخيصاً لاستخدام هذا المحتوى لغرض تقديم الخدمة. جميع حقوق الملكية الفكرية للمنصة نفسها (الشعارات، التصميم، الكود) مملوكة لشركة مينا لتقنية المعلومات."
          />

          <TermsItem
            icon={Scale}
            title="6. إخلاء المسؤولية"
            content="تُقدم الخدمة 'كما هي' دون أي ضمانات صريحة أو ضمنية. لا نضمن أن الخدمة ستكون متاحة دائماً أو خالية من الأخطاء. لن نكون مسؤولين عن أي أضرار مباشرة أو غير مباشرة ناتجة عن استخدام خدماتنا."
          />
        </div>
      </div>
    </section>
  );
}

function TermsItem({ icon: Icon, title, content }: { icon: React.ComponentType<{ className?: string }>; title: string; content: string }) {
  return (
    <div className="border-b border-gray-100 pb-6 last:border-0">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
          <Icon className="w-4 h-4 text-gray-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 leading-relaxed">{content}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// Privacy Policy Section
// ============================================
function PrivacySection({ id }: { id: string }) {
  const privacyPoints = [
    {
      title: "البيانات التي نجمعها",
      items: [
        "معلومات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف",
        "بيانات الاستخدام: كيفية تفاعلك مع المنصة",
        "محتوى الأحداث: الاستبيانات والنماذج التي تنشئها",
        "ردود المشاركين: البيانات المقدمة من المشاركين في أحداثك",
      ],
    },
    {
      title: "كيف نستخدم بياناتك",
      items: [
        "تقديم وتحسين خدماتنا",
        "التواصل معك بشأن حسابك وخدماتنا",
        "تحليل أنماط الاستخدام لتطوير المنصة",
        "حماية أمن المنصة ومستخدميها",
      ],
    },
    {
      title: "حماية بياناتك",
      items: [
        "تشفير البيانات أثناء النقل والتخزين",
        "وصول محدود للموظفين المصرح لهم فقط",
        "مراجعات أمنية دورية",
        "الامتثال لمعايير حماية البيانات المعمول بها",
      ],
    },
    {
      title: "حقوقك",
      items: [
        "الوصول إلى بياناتك الشخصية",
        "تصحيح البيانات غير الدقيقة",
        "حذف حسابك وبياناتك",
        "تصدير بياناتك بتنسيق قابل للقراءة",
      ],
    },
  ];

  return (
    <section id={id} className="scroll-mt-24">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">سياسة الخصوصية</h2>
            <p className="text-gray-500 text-sm">آخر تحديث: يناير 2026</p>
          </div>
        </div>

        <div className="bg-green-50 border-r-4 border-green-500 p-4 rounded-lg mb-8">
          <p className="text-gray-700">
            نحن في شركة مينا لتقنية المعلومات نلتزم بحماية خصوصيتك. توضح هذه السياسة
            كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {privacyPoints.map((point, index) => (
            <div key={index} className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                {point.title}
              </h3>
              <ul className="space-y-2">
                {point.items.map((item, idx) => (
                  <li key={idx} className="text-gray-600 text-sm flex items-start gap-2">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-8 p-5 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">ملفات تعريف الارتباط (Cookies)</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            نستخدم ملفات تعريف الارتباط لتحسين تجربتك على المنصة. تساعدنا هذه الملفات في
            تذكر تفضيلاتك وفهم كيفية استخدامك للمنصة. يمكنك التحكم في إعدادات ملفات تعريف
            الارتباط من خلال متصفحك.
          </p>
        </div>
      </div>
    </section>
  );
}


// ============================================
// Usage Policy Section
// ============================================
function UsageSection({ id }: { id: string }) {
  const allowedUses = [
    "إنشاء استبيانات واستطلاعات رأي مشروعة",
    "جمع آراء العملاء والموظفين",
    "إجراء اختبارات تعليمية وتقييمية",
    "تنظيم فعاليات وتسجيل المشاركين",
    "إنشاء نماذج تسجيل وطلبات",
    "جمع بيانات للأبحاث والدراسات",
  ];

  const prohibitedUses = [
    "جمع معلومات حساسة بدون موافقة صريحة",
    "إرسال رسائل مزعجة (Spam) للمشاركين",
    "انتحال هوية أشخاص أو جهات أخرى",
    "نشر محتوى غير قانوني أو مسيء",
    "محاولة اختراق أو تعطيل المنصة",
    "استخدام المنصة لأغراض احتيالية",
    "جمع بيانات القاصرين بدون إذن ولي الأمر",
    "مشاركة حسابك مع أطراف غير مصرح لها",
  ];

  return (
    <section id={id} className="scroll-mt-24">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">سياسة الاستخدام</h2>
            <p className="text-gray-500 text-sm">آخر تحديث: يناير 2026</p>
          </div>
        </div>

        <div className="bg-purple-50 border-r-4 border-purple-500 p-4 rounded-lg mb-8">
          <p className="text-gray-700">
            تهدف سياسة الاستخدام إلى ضمان بيئة آمنة ومحترمة لجميع مستخدمي منصة مينا إيفنت.
            يُرجى الالتزام بهذه الإرشادات للحفاظ على جودة الخدمة للجميع.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Allowed Uses */}
          <div className="bg-green-50 rounded-xl p-5 border border-green-100">
            <h3 className="text-lg font-semibold text-green-800 mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              الاستخدامات المسموح بها
            </h3>
            <ul className="space-y-3">
              {allowedUses.map((use, index) => (
                <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                  {use}
                </li>
              ))}
            </ul>
          </div>

          {/* Prohibited Uses */}
          <div className="bg-red-50 rounded-xl p-5 border border-red-100">
            <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              الاستخدامات المحظورة
            </h3>
            <ul className="space-y-3">
              {prohibitedUses.map((use, index) => (
                <li key={index} className="text-gray-700 text-sm flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                  {use}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-amber-800 mb-3 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            الإجراءات التأديبية
          </h3>
          <p className="text-gray-700 text-sm leading-relaxed">
            في حالة انتهاك سياسة الاستخدام، نحتفظ بالحق في اتخاذ الإجراءات المناسبة والتي قد تشمل:
            إرسال تحذير، تعليق الحساب مؤقتاً، أو إنهاء الحساب نهائياً. في الحالات الخطيرة،
            قد نبلغ الجهات المختصة.
          </p>
        </div>
      </div>
    </section>
  );
}


// ============================================
// FAQ Section
// ============================================
function FAQSection({ id, openFAQs, toggleFAQ }: { id: string; openFAQs: number[]; toggleFAQ: (index: number) => void }) {
  const faqs: FAQItem[] = [
    {
      question: "ما هي منصة مينا إيفنت؟",
      answer: "مينا إيفنت هي منصة سعودية متكاملة لإنشاء وإدارة الأحداث التفاعلية مثل الاستبيانات، الاختبارات، النماذج، والفعاليات. تتيح لك المنصة إنشاء أحداث احترافية بسهولة ومشاركتها مع جمهورك وتحليل النتائج.",
    },
    {
      question: "هل المنصة مجانية؟",
      answer: "نعم، منصة مينا إيفنت مجانية بالكامل حالياً. يمكنك الاستمتاع بجميع الميزات دون أي رسوم أو اشتراكات. نسعى لتقديم أفضل تجربة لمستخدمينا.",
    },
    {
      question: "كيف أنشئ حدث جديد؟",
      answer: "بعد تسجيل الدخول، انتقل إلى لوحة التحكم واضغط على 'إنشاء حدث جديد'. اختر نوع الحدث (استبيان، اختبار، نموذج، أو فعالية)، ثم أضف الأقسام والأسئلة باستخدام أدوات البناء السهلة. يمكنك معاينة الحدث قبل نشره.",
    },
    {
      question: "كيف أشارك الحدث مع المشاركين؟",
      answer: "بعد نشر الحدث، ستحصل على رابط مشاركة فريد وكود QR. يمكنك مشاركة الرابط عبر البريد الإلكتروني، وسائل التواصل الاجتماعي، أو أي قناة تفضلها. كما يمكنك إرسال دعوات مباشرة من المنصة.",
    },
    {
      question: "هل بيانات المشاركين آمنة؟",
      answer: "نعم، نأخذ أمان البيانات بجدية. نستخدم تشفير SSL لجميع الاتصالات، ونخزن البيانات في خوادم آمنة. نلتزم بأفضل ممارسات حماية البيانات ولا نشارك بياناتك مع أطراف ثالثة.",
    },
    {
      question: "هل يمكنني تصدير النتائج؟",
      answer: "نعم، يمكنك تصدير نتائج الأحداث بتنسيقات متعددة مثل Excel وPDF. تتضمن التقارير ملخصات إحصائية، رسوم بيانية، وتفاصيل كل رد على حدة.",
    },
    {
      question: "ماذا لو واجهت مشكلة تقنية؟",
      answer: "يمكنك التواصل مع فريق الدعم الفني عبر البريد الإلكتروني Contact@meena.sa أو الهاتف +966 55 045 5010. نسعى للرد على جميع الاستفسارات خلال 24 ساعة في أيام العمل.",
    },
    {
      question: "هل يمكنني تعديل أو حذف حدث بعد نشره؟",
      answer: "نعم، يمكنك تعديل إعدادات الحدث وأسئلته في أي وقت من لوحة التحكم. كما يمكنك إيقاف الحدث مؤقتاً أو حذفه نهائياً. لاحظ أن حذف الحدث سيؤدي إلى حذف جميع الردود المرتبطة به.",
    },
    {
      question: "هل المنصة تدعم اللغة العربية؟",
      answer: "نعم، المنصة مصممة بالكامل للمستخدم العربي مع دعم كامل للغة العربية واتجاه RTL. يمكنك إنشاء أحداث بالعربية أو الإنجليزية أو أي لغة أخرى.",
    },
    {
      question: "كيف أحذف حسابي؟",
      answer: "يمكنك حذف حسابك من إعدادات الحساب. سيؤدي ذلك إلى حذف جميع بياناتك وأحداثك نهائياً. ننصح بتصدير بياناتك المهمة قبل الحذف لأن هذا الإجراء لا يمكن التراجع عنه.",
    },
  ];

  return (
    <section id={id} className="scroll-mt-24">
      <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 lg:p-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <HelpCircle className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">الأسئلة الشائعة</h2>
            <p className="text-gray-500 text-sm">إجابات على الأسئلة الأكثر شيوعاً</p>
          </div>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-xl overflow-hidden transition-all duration-200 ${
                openFAQs.includes(index) ? "border-[#1a56db] bg-blue-50/50" : "border-gray-200"
              }`}
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full p-4 sm:p-5 text-right flex items-center justify-between gap-4 hover:bg-gray-50 transition-colors"
              >
                <span className="font-medium text-gray-900">{faq.question}</span>
                {openFAQs.includes(index) ? (
                  <ChevronUp className="w-5 h-5 text-[#1a56db] flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFAQs.includes(index) && (
                <div className="px-4 sm:px-5 pb-4 sm:pb-5">
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-gradient-to-br from-[#1a56db] to-[#1e40af] rounded-xl p-6 text-white text-center">
          <h3 className="text-xl font-bold mb-2">لم تجد إجابة لسؤالك؟</h3>
          <p className="text-blue-100 mb-4">فريق الدعم الفني جاهز لمساعدتك</p>
          <a
            href="mailto:Contact@meena.sa"
            className="inline-flex items-center gap-2 bg-white text-[#1a56db] px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            <Mail className="w-5 h-5" />
            تواصل معنا
          </a>
        </div>
      </div>
    </section>
  );
}
