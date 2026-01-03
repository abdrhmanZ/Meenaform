"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: "المميزات", href: "#features" },
      { name: "كيف يعمل", href: "#how-it-works" },
      { name: "القوالب", href: "/dashboard/events/templates" },
    ],
    company: [
      { name: "من نحن", href: "/about" },
      { name: "المدونة", href: "#blog" },
    ],
    legal: [
      { name: "الشروط والأحكام", href: "/legal#terms" },
      { name: "سياسة الخصوصية", href: "/legal#privacy" },
      { name: "سياسة الاستخدام", href: "/legal#usage" },
      { name: "الأسئلة الشائعة", href: "/legal#faq" },
    ],
  };

  const socialLinks = [
    { name: "Facebook", icon: Facebook, href: "#" },
    { name: "Twitter", icon: Twitter, href: "#" },
    { name: "Instagram", icon: Instagram, href: "#" },
    { name: "LinkedIn", icon: Linkedin, href: "#" },
  ];

  return (
    <footer className="bg-[#0f172a]">
      {/* القسم العلوي - اللوجو والوصف */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-12 lg:pt-16 pb-10">
        <div className="text-center mb-10 pb-8 border-b border-gray-800/50">
          {/* اللوجو - مطابق للـ Header */}
          <Link href="/" className="inline-flex items-center gap-2.5 group mb-4">
            <Image
              src="/logo.png"
              alt="مينا إيفنت"
              width={40}
              height={40}
              className="rounded-lg"
            />
            <span className="text-2xl font-bold text-white">
              مينا <span className="text-[#1a56db]">إيفنت</span>
            </span>
          </Link>
          <p className="text-gray-400 text-sm leading-relaxed">
            منصة سعودية متكاملة لإنشاء الأحداث التفاعلية والاستبيانات والاختبارات بكل سهولة واحترافية. منتج من شركة مينا للمعلومات التقنية.
          </p>
        </div>

        {/* القسم الأوسط - 4 أعمدة متساوية */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
          {/* المنتج */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center md:text-right">المنتج</h3>
            <ul className="space-y-3 text-center md:text-right">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#1a56db] text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* الشركة */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center md:text-right">الشركة</h3>
            <ul className="space-y-3 text-center md:text-right">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#1a56db] text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* القانونية */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center md:text-right">القانونية</h3>
            <ul className="space-y-3 text-center md:text-right">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-[#1a56db] text-sm transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* تواصل معنا */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-center md:text-right">تواصل معنا</h3>
            <ul className="space-y-3 text-center md:text-right">
              <li>
                <a
                  href="mailto:Contact@meena.sa"
                  className="text-gray-400 hover:text-[#1a56db] text-sm transition-colors inline-flex items-center gap-2 justify-center md:justify-start"
                >
                  <Mail className="w-4 h-4" />
                  <span>Contact@meena.sa</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+966550455010"
                  dir="ltr"
                  className="text-gray-400 hover:text-[#1a56db] text-sm transition-colors inline-flex flex-row-reverse items-center gap-2 justify-center md:justify-end"
                >
                  <Phone className="w-4 h-4" />
                  <span>+966 55 045 5010</span>
                </a>
              </li>
              <li>
                <div className="text-gray-400 text-sm inline-flex items-center gap-2 justify-center md:justify-start">
                  <MapPin className="w-4 h-4 flex-shrink-0" />
                  <span>القصيم، بريدة</span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* القسم السفلي */}
      <div className="border-t border-gray-800/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* حقوق الملكية */}
            <p className="text-gray-500 text-xs sm:text-sm order-2 sm:order-1" suppressHydrationWarning>
              © {currentYear} جميع الحقوق محفوظة لشركة مينا لتقنية المعلومات
            </p>

            {/* وسائل التواصل الاجتماعي */}
            <div className="flex items-center gap-1 order-1 sm:order-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-gray-500 hover:text-[#1a56db] hover:bg-gray-800/50 transition-all"
                    aria-label={social.name}
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

