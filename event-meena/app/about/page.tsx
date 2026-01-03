"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";
import Image from "next/image";
import {
  Building2,
  MapPin,
  Code2,
  ShoppingCart,
  Smartphone,
  Globe,
  Users,
  Target,
  Lightbulb,
  Award,
  Quote,
} from "lucide-react";

// الخدمات التقنية
const services = [
  {
    icon: Globe,
    title: "تطوير المواقع",
    description: "بناء مواقع إلكترونية احترافية ومتجاوبة مع جميع الأجهزة",
  },
  {
    icon: ShoppingCart,
    title: "المتاجر الإلكترونية",
    description: "إنشاء متاجر إلكترونية متكاملة مع أنظمة الدفع والشحن",
  },
  {
    icon: Smartphone,
    title: "تطبيقات الجوال",
    description: "تطوير تطبيقات iOS و Android بأحدث التقنيات",
  },
  {
    icon: Code2,
    title: "الحلول البرمجية",
    description: "أنظمة إدارة مخصصة وحلول برمجية متكاملة للشركات",
  },
];

// قيم الشركة
const values = [
  {
    icon: Target,
    title: "الجودة",
    description: "نلتزم بأعلى معايير الجودة في كل مشروع نقدمه",
  },
  {
    icon: Lightbulb,
    title: "الابتكار",
    description: "نسعى دائماً لتقديم حلول مبتكرة تواكب التطور التقني",
  },
  {
    icon: Users,
    title: "العميل أولاً",
    description: "نضع احتياجات عملائنا في صدارة أولوياتنا",
  },
  {
    icon: Award,
    title: "التميز",
    description: "نسعى للتميز في كل ما نقدمه من خدمات ومنتجات",
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <section className="pt-28 pb-16 bg-gradient-to-br from-[#1a56db] via-[#1e40af] to-[#1e3a8a] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Building2 className="w-5 h-5" />
              <span className="text-sm font-medium">شركة سعودية</span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              شركة مينا للمعلومات التقنية
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8">
              شريكك التقني الموثوق في رحلة التحول الرقمي
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-200">
              <MapPin className="w-5 h-5" />
              <span>القصيم، المملكة العربية السعودية</span>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                من نحن
              </h2>
              <div className="w-20 h-1 bg-[#1a56db] mx-auto rounded-full"></div>
            </div>
            <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 md:p-12 border border-gray-100">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-center">
                <span className="font-bold text-[#1a56db]">شركة مينا للمعلومات التقنية</span>{" "}
                هي شركة سعودية رائدة تنشط في منطقة القصيم، متخصصة في تقديم الحلول
                التقنية المتكاملة للأفراد والشركات. نسعى لتمكين عملائنا من تحقيق
                أهدافهم الرقمية من خلال فريق عمل محترف يمتلك الخبرة والشغف
                للابتكار.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              خدماتنا التقنية
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              نقدم مجموعة شاملة من الخدمات التقنية لتلبية جميع احتياجاتك الرقمية
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map((service, index) => (
              <div
                key={index}
                className="bg-white rounded-xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-[#1a56db]/20 group"
              >
                <div className="w-14 h-14 bg-[#1a56db]/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-[#1a56db] transition-colors duration-300">
                  <service.icon className="w-7 h-7 text-[#1a56db] group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{service.title}</h3>
                <p className="text-gray-600 text-sm">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Meena Event Product Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            <div className="bg-gradient-to-br from-[#1a56db] to-[#1e3a8a] rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
              </div>

              <div className="relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                      <Image
                        src="/logo.png"
                        alt="مينا إيفنت"
                        width={64}
                        height={64}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="text-center md:text-right flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold mb-4">
                      منصة مينا إيفنت
                    </h2>
                    <p className="text-blue-100 text-lg leading-relaxed">
                      تم تصميم وتطوير منصة{" "}
                      <span className="font-bold text-white">مينا إيفنت</span>{" "}
                      بالكامل من قبل فريق عمل شركة مينا للمعلومات التقنية.
                      المنصة هي ثمرة جهود فريقنا المتميز الذي يسعى دائماً لتقديم
                      حلول تقنية مبتكرة تخدم المجتمع السعودي والعربي.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              قيمنا
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              القيم التي نؤمن بها ونعمل وفقها في كل مشروع
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {values.map((value, index) => (
              <div
                key={index}
                className="text-center p-6"
              >
                <div className="w-16 h-16 bg-[#1a56db] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-[#1a56db]/20">
                  <value.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{value.title}</h3>
                <p className="text-gray-600 text-sm">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CEO Quote Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 md:p-12 relative">
              <Quote className="absolute top-6 right-6 w-12 h-12 text-[#1a56db]/20" />

              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-[#1a56db] to-[#1e3a8a] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <span className="text-3xl font-bold text-white">أ</span>
                </div>

                <blockquote className="text-xl md:text-2xl text-gray-700 leading-relaxed mb-8 font-medium">
                  "نؤمن في مينا بأن التقنية هي مفتاح التطور، ونسعى دائماً لتقديم حلول
                  تقنية مبتكرة تساهم في نمو الأعمال وتطوير المجتمع. هدفنا هو أن نكون
                  الشريك التقني الأول الذي يثق به عملاؤنا في رحلتهم نحو التحول الرقمي."
                </blockquote>

                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-xl font-bold text-gray-900">أحمد الشايع</h3>
                  <p className="text-[#1a56db] font-medium">المدير التنفيذي</p>
                  <p className="text-gray-500 text-sm mt-1">شركة مينا للمعلومات التقنية</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-[#1a56db] to-[#1e3a8a] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            هل لديك مشروع تقني؟
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            تواصل معنا اليوم ودعنا نساعدك في تحويل فكرتك إلى واقع رقمي متميز
          </p>
          <a
            href="mailto:Contact@meena.sa"
            className="inline-flex items-center gap-2 bg-white text-[#1a56db] px-8 py-3 rounded-xl font-bold hover:bg-blue-50 transition-colors duration-300"
          >
            تواصل معنا
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
