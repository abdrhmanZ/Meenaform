"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Event, EventFormData, EventType, EventStatus } from "@/types/event";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { FileText, HelpCircle, ClipboardList, Target, PenTool } from "lucide-react";

interface EventFormProps {
  event?: Event;
  onSubmit: (data: EventFormData) => Promise<void>;
  isLoading?: boolean;
}

const eventFormSchema = z.object({
  title: z
    .string()
    .min(1, "العنوان مطلوب")
    .min(3, "العنوان يجب أن يكون 3 أحرف على الأقل"),
  description: z
    .string()
    .min(1, "الوصف مطلوب")
    .min(10, "الوصف يجب أن يكون 10 أحرف على الأقل"),
  type: z.enum(["survey", "poll", "form", "quiz", "document_signing"], {
    message: "نوع الحدث مطلوب",
  }),
  status: z.enum(["draft", "active", "archived"], {
    message: "حالة الحدث مطلوبة",
  }),
  settings: z.object({
    allowMultipleResponses: z.boolean(),
    showResultsToParticipants: z.boolean(),
    requireLogin: z.boolean(),
    enableCaptcha: z.boolean(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
  }),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

const eventTypes = [
  {
    value: "survey" as EventType,
    label: "استبيان",
    icon: FileText,
    description: "جمع آراء وملاحظات مفصلة",
  },
  {
    value: "poll" as EventType,
    label: "استطلاع رأي",
    icon: HelpCircle,
    description: "سؤال سريع مع خيارات محددة",
  },
  {
    value: "form" as EventType,
    label: "نموذج",
    icon: ClipboardList,
    description: "جمع معلومات وبيانات",
  },
  {
    value: "quiz" as EventType,
    label: "اختبار",
    icon: Target,
    description: "اختبار المعرفة والمهارات",
  },
  {
    value: "document_signing" as EventType,
    label: "توقيع وثيقة",
    icon: PenTool,
    description: "رفع وثيقة PDF للتوقيع الإلكتروني",
  },
];

export default function EventForm({ event, onSubmit, isLoading }: EventFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description,
          type: event.type,
          status: event.status,
          settings: event.settings,
        }
      : {
          title: "",
          description: "",
          type: "survey",
          status: "draft",
          settings: {
            allowMultipleResponses: false,
            showResultsToParticipants: true,
            requireLogin: false,
            enableCaptcha: false,
          },
        },
  });

  const selectedType = watch("type");
  const settings = watch("settings");

  const handleFormSubmit = async (data: EventFormValues) => {
    await onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* المعلومات الأساسية */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          المعلومات الأساسية
        </h3>

        {/* العنوان */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="title">عنوان الحدث *</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="مثال: استبيان رضا العملاء 2025"
          />
          {errors.title && (
            <p className="text-sm text-red-600">{errors.title.message}</p>
          )}
        </div>

        {/* الوصف */}
        <div className="space-y-2 mb-4">
          <Label htmlFor="description">الوصف *</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="اكتب وصفاً مختصراً للحدث..."
            rows={4}
          />
          {errors.description && (
            <p className="text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        {/* نوع الحدث */}
        <div className="space-y-2 mb-4">
          <Label>نوع الحدث *</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {eventTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.value;

              return (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setValue("type", type.value)}
                  className={`p-4 border-2 rounded-lg text-right transition-all ${
                    isSelected
                      ? "border-primary bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Icon
                      className={`w-6 h-6 ${
                        isSelected ? "text-primary" : "text-gray-400"
                      }`}
                    />
                    <div>
                      <p
                        className={`font-semibold ${
                          isSelected ? "text-primary" : "text-gray-900"
                        }`}
                      >
                        {type.label}
                      </p>
                      <p className="text-sm text-gray-500">{type.description}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          {errors.type && (
            <p className="text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        {/* الحالة */}
        <div className="space-y-2">
          <Label htmlFor="status">الحالة *</Label>
          <Select
            value={watch("status")}
            onValueChange={(value) => setValue("status", value as EventStatus)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="draft">مسودة</SelectItem>
              <SelectItem value="active">نشط</SelectItem>
              <SelectItem value="closed">منتهي</SelectItem>
            </SelectContent>
          </Select>
          {errors.status && (
            <p className="text-sm text-red-600">{errors.status.message}</p>
          )}
        </div>
      </Card>

      {/* الإعدادات */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">الإعدادات</h3>

        <div className="space-y-4">
          {/* السماح بردود متعددة */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="allowMultipleResponses"
              checked={settings.allowMultipleResponses}
              onCheckedChange={(checked) =>
                setValue("settings.allowMultipleResponses", checked as boolean)
              }
            />
            <Label htmlFor="allowMultipleResponses" className="cursor-pointer">
              السماح بردود متعددة من نفس المستخدم
            </Label>
          </div>

          {/* عرض النتائج للمشاركين */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="showResultsToParticipants"
              checked={settings.showResultsToParticipants}
              onCheckedChange={(checked) =>
                setValue("settings.showResultsToParticipants", checked as boolean)
              }
            />
            <Label
              htmlFor="showResultsToParticipants"
              className="cursor-pointer"
            >
              عرض النتائج للمشاركين بعد الإرسال
            </Label>
          </div>

          {/* طلب تسجيل الدخول */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="requireLogin"
              checked={settings.requireLogin}
              onCheckedChange={(checked) =>
                setValue("settings.requireLogin", checked as boolean)
              }
            />
            <Label htmlFor="requireLogin" className="cursor-pointer">
              طلب تسجيل الدخول قبل المشاركة
            </Label>
          </div>

          {/* تفعيل CAPTCHA */}
          <div className="flex items-center gap-3">
            <Checkbox
              id="enableCaptcha"
              checked={settings.enableCaptcha}
              onCheckedChange={(checked) =>
                setValue("settings.enableCaptcha", checked as boolean)
              }
            />
            <Label htmlFor="enableCaptcha" className="cursor-pointer">
              تفعيل CAPTCHA للحماية من الروبوتات
            </Label>
          </div>
        </div>
      </Card>

      {/* الأزرار */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isLoading} className="flex-1">
          {isLoading ? "جاري الحفظ..." : event ? "تحديث الحدث" : "إنشاء الحدث"}
        </Button>
        <Button type="button" variant="outline" disabled={isLoading}>
          إلغاء
        </Button>
      </div>
    </form>
  );
}

