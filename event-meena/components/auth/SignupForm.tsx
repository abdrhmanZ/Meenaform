"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuthStore } from "@/store/authStore";
import PasswordStrength from "./PasswordStrength";

// قائمة الدول مع أكوادها وأعلامها
const countries = [
  { code: "+966", name: "السعودية", flag: "🇸🇦", phoneLength: 9 },
  { code: "+971", name: "الإمارات", flag: "🇦🇪", phoneLength: 9 },
  { code: "+20", name: "مصر", flag: "🇪🇬", phoneLength: 10 },
  { code: "+965", name: "الكويت", flag: "🇰🇼", phoneLength: 8 },
  { code: "+974", name: "قطر", flag: "🇶🇦", phoneLength: 8 },
  { code: "+973", name: "البحرين", flag: "🇧🇭", phoneLength: 8 },
  { code: "+968", name: "عُمان", flag: "🇴🇲", phoneLength: 8 },
  { code: "+962", name: "الأردن", flag: "🇯🇴", phoneLength: 9 },
  { code: "+961", name: "لبنان", flag: "🇱🇧", phoneLength: 8 },
  { code: "+212", name: "المغرب", flag: "🇲🇦", phoneLength: 9 },
  { code: "+216", name: "تونس", flag: "🇹🇳", phoneLength: 8 },
  { code: "+213", name: "الجزائر", flag: "🇩🇿", phoneLength: 9 },
  { code: "+249", name: "السودان", flag: "🇸🇩", phoneLength: 9 },
  { code: "+964", name: "العراق", flag: "🇮🇶", phoneLength: 10 },
  { code: "+967", name: "اليمن", flag: "🇾🇪", phoneLength: 9 },
  { code: "+218", name: "ليبيا", flag: "🇱🇾", phoneLength: 9 },
];

// Schema للتحقق من البيانات - متوافق مع Backend Validation
const signupSchema = z
  .object({
    name: z
      .string()
      .min(1, "الاسم مطلوب")
      .min(3, "الاسم يجب أن يكون 3 أحرف على الأقل"),
    email: z
      .string()
      .min(1, "البريد الإلكتروني مطلوب")
      .email("البريد الإلكتروني غير صحيح"),
    phone: z
      .string()
      .min(1, "رقم الجوال مطلوب")
      .regex(/^[0-9]{7,15}$/, "رقم الجوال غير صالح (يجب أن يحتوي على أرقام فقط)"),
    password: z
      .string()
      .min(1, "كلمة المرور مطلوبة")
      .min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      .regex(/[A-Z]/, "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل")
      .regex(/[a-z]/, "كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل")
      .regex(/[0-9]/, "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل"),
    confirmPassword: z.string().min(1, "تأكيد كلمة المرور مطلوب"),
    acceptTerms: z.boolean().refine((val) => val === true, {
      message: "يجب الموافقة على الشروط والأحكام",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "كلمة المرور غير متطابقة",
    path: ["confirmPassword"],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const { signup, isLoading, error, clearError } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countryCode, setCountryCode] = useState("+966"); // السعودية كافتراضي

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  const password = watch("password");

  // الحصول على معلومات الدولة المختارة
  const selectedCountry = countries.find((c) => c.code === countryCode);

  const onSubmit = async (data: SignupFormData) => {
    clearError();

    try {
      // دمج كود الدولة مع رقم الجوال
      const fullPhone = `${countryCode}${data.phone.replace(/^0+/, "")}`;
      await signup({ ...data, phone: fullPhone });
      router.push("/dashboard");
    } catch (error) {
      console.error("Signup error:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* رسالة الخطأ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* الاسم الكامل */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-gray-700 font-medium">
          الاسم الكامل
        </Label>
        <div className="relative">
          <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="name"
            type="text"
            placeholder="محمد أحمد"
            className="pr-10 h-12"
            {...register("name")}
            disabled={isLoading}
          />
        </div>
        {errors.name && (
          <p className="text-red-600 text-sm">{errors.name.message}</p>
        )}
      </div>

      {/* البريد الإلكتروني */}
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">
          البريد الإلكتروني
        </Label>
        <div className="relative">
          <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="email"
            type="email"
            placeholder="example@eventmeena.com"
            className="pr-10 h-12"
            {...register("email")}
            disabled={isLoading}
          />
        </div>
        {errors.email && (
          <p className="text-red-600 text-sm">{errors.email.message}</p>
        )}
      </div>

      {/* رقم الجوال */}
      <div className="space-y-2">
        <Label htmlFor="phone" className="text-gray-700 font-medium">
          رقم الجوال
        </Label>
        {/* حقل موحد: كود الدولة + رقم الجوال */}
        <div className="flex h-12 rounded-lg border border-gray-300 bg-white overflow-hidden focus-within:ring-2 focus-within:ring-[#1a56db] focus-within:border-[#1a56db] transition-all">
          {/* اختيار كود الدولة */}
          <Select
            value={countryCode}
            onValueChange={setCountryCode}
            disabled={isLoading}
          >
            <SelectTrigger className="h-full border-0 rounded-none bg-gray-50 hover:bg-gray-100 px-3 min-w-[100px] focus:ring-0 focus:outline-none shadow-none">
              <SelectValue>
                <span className="flex items-center gap-1.5">
                  <span className="text-lg">{selectedCountry?.flag}</span>
                  <span className="text-sm font-medium text-gray-700" dir="ltr">{countryCode}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-[300px] bg-white border border-gray-200 shadow-lg">
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code} className="cursor-pointer hover:bg-gray-50">
                  <span className="flex items-center justify-between w-full gap-3">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{country.flag}</span>
                      <span className="text-sm text-gray-900">{country.name}</span>
                    </span>
                    <span className="text-sm text-gray-500 font-medium" dir="ltr">{country.code}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* الفاصل */}
          <div className="w-px bg-gray-300 my-2"></div>

          {/* حقل رقم الجوال */}
          <input
            id="phone"
            type="tel"
            placeholder={selectedCountry?.phoneLength === 9 ? "51 234 5678" : "1234 5678"}
            className="flex-1 h-full px-3 text-sm bg-transparent border-0 outline-none focus:ring-0 placeholder:text-gray-400"
            dir="ltr"
            {...register("phone")}
            disabled={isLoading}
          />
        </div>
        {errors.phone && (
          <p className="text-red-600 text-sm">{errors.phone.message}</p>
        )}
      </div>

      {/* كلمة المرور */}
      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700 font-medium">
          كلمة المرور
        </Label>
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pr-10 pl-10 h-12"
            {...register("password")}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.password && (
          <p className="text-red-600 text-sm">{errors.password.message}</p>
        )}
        
        {/* مؤشر قوة كلمة المرور */}
        <PasswordStrength password={password} />
      </div>

      {/* تأكيد كلمة المرور */}
      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">
          تأكيد كلمة المرور
        </Label>
        <div className="relative">
          <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="••••••••"
            className="pr-10 pl-10 h-12"
            {...register("confirmPassword")}
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff className="w-5 h-5" />
            ) : (
              <Eye className="w-5 h-5" />
            )}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-red-600 text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>

      {/* الموافقة على الشروط */}
      <div className="flex items-start gap-2">
        <Controller
          name="acceptTerms"
          control={control}
          render={({ field }) => (
            <Checkbox
              id="acceptTerms"
              checked={field.value}
              onCheckedChange={field.onChange}
              className="mt-1"
            />
          )}
        />
        <Label
          htmlFor="acceptTerms"
          className="text-sm text-gray-600 cursor-pointer leading-relaxed"
        >
          أوافق على{" "}
          <Link href="/terms" className="text-[#1a56db] hover:text-[#1648c7] font-medium transition-colors">
            الشروط والأحكام
          </Link>{" "}
          و{" "}
          <Link href="/privacy" className="text-[#1a56db] hover:text-[#1648c7] font-medium transition-colors">
            سياسة الخصوصية
          </Link>
        </Label>
      </div>
      {errors.acceptTerms && (
        <p className="text-red-600 text-sm">{errors.acceptTerms.message}</p>
      )}

      {/* زر إنشاء الحساب */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full h-12 bg-[#1a56db] hover:bg-[#1648c7] disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-base font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            جاري إنشاء الحساب...
          </>
        ) : (
          "إنشاء حساب"
        )}
      </button>

      {/* رابط تسجيل الدخول */}
      <p className="text-center text-sm text-gray-600">
        لديك حساب بالفعل؟{" "}
        <Link
          href="/login"
          className="text-[#1a56db] font-semibold hover:text-[#1648c7] transition-colors"
        >
          تسجيل الدخول
        </Link>
      </p>
    </form>
  );
}

