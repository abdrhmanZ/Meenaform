"use client";

import { Event } from "@/types/event";
import { Response, ComponentAnswer } from "@/types/response";
import { Component } from "@/types/component";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Star, Download, Image as ImageIcon, ExternalLink, Eye, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { filesService } from "@/lib/api/services";

interface ParticipantAnswersProps {
  event: Event;
  response: Response;
}

export default function ParticipantAnswers({ event, response }: ParticipantAnswersProps) {
  // Get all components from all sections
  const allComponents: Component[] = [];
  event.sections.forEach((section) => {
    section.components.forEach((component) => {
      allComponents.push(component);
    });
  });

  // Get answer for a component
  const getAnswer = (componentId: string): ComponentAnswer | undefined => {
    return response.answers.find((a) => a.componentId === componentId);
  };

  // Render answer based on component type
  const renderAnswer = (component: Component, answer?: ComponentAnswer) => {
    if (!answer || answer.answer === null || answer.answer === undefined || answer.answer === "") {
      return (
        <div className="text-gray-400 italic">
          لم يتم الإجابة على هذا السؤال
        </div>
      );
    }

    const settings = component.settings as any;

    switch (component.type) {
      case "question":
        return renderQuestionAnswer(settings.questionType, answer, settings);

      case "rating":
        return renderRatingAnswer(settings.ratingType, answer.answer, settings.maxRating || 5);

      case "pdf_upload":
      case "image_upload":
      case "video_upload":
        return renderFileAnswer(answer.answer);

      case "signature":
        return renderSignatureAnswer(answer.answer);

      case "table":
        return renderTableAnswer(answer.answer, settings);

      default:
        return <div className="text-gray-700">{String(answer.answer)}</div>;
    }
  };

  // Render question answer
  const renderQuestionAnswer = (questionType: string, answer: ComponentAnswer, settings: any) => {
    const value = answer.answer;

    switch (questionType) {
      case "short_text":
      case "long_text":
      case "email":
      case "phone":
      case "number":
        return <div className="text-gray-900 font-medium">{String(value)}</div>;

      case "single_choice":
      case "dropdown":
        return (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary"></div>
            <span className="text-gray-900 font-medium">{String(value)}</span>
          </div>
        );

      case "multiple_choice":
        const choices = Array.isArray(value) ? value : [value];
        return (
          <div className="space-y-2">
            {choices.map((choice, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-gray-900 font-medium">{String(choice)}</span>
              </div>
            ))}
          </div>
        );

      case "yes_no":
        return (
          <div className="flex items-center gap-2">
            {value === "yes" || value === "نعم" ? (
              <>
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-green-700 font-bold">نعم</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5 text-red-600" />
                <span className="text-red-700 font-bold">لا</span>
              </>
            )}
          </div>
        );

      case "url":
        return (
          <a
            href={String(value)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:underline font-medium"
          >
            <ExternalLink className="w-4 h-4" />
            {String(value)}
          </a>
        );

      case "date":
        return (
          <div className="text-gray-900 font-medium">
            {new Date(String(value)).toLocaleDateString("ar-EG")}
          </div>
        );

      case "time":
        return <div className="text-gray-900 font-medium">{String(value)}</div>;

      case "linear_scale":
        return (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: Number(value) }, (_, i) => (
                <div key={i} className="w-3 h-3 rounded-full bg-primary"></div>
              ))}
            </div>
            <span className="text-primary font-bold text-lg">{String(value)}</span>
            <span className="text-gray-600">/ {settings.maxScale || 10}</span>
          </div>
        );

      default:
        return <div className="text-gray-900 font-medium">{String(value)}</div>;
    }
  };

  // Render rating answer
  const renderRatingAnswer = (ratingType: string, value: any, maxRating: number) => {
    const rating = Number(value);

    switch (ratingType) {
      case "stars":
        return (
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {Array.from({ length: maxRating }, (_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"
                    }`}
                />
              ))}
            </div>
            <span className="text-gray-900 font-bold text-lg">
              {rating}/{maxRating}
            </span>
          </div>
        );

      case "numbers":
        return (
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-lg bg-primary text-white flex items-center justify-center font-bold text-xl">
              {rating}
            </div>
            <span className="text-gray-600">/ {maxRating}</span>
          </div>
        );

      case "emoji":
        const emojis = ["😢", "😕", "😐", "🙂", "😄"];
        return (
          <div className="flex items-center gap-3">
            <span className="text-4xl">{emojis[rating - 1] || "😐"}</span>
            <span className="text-gray-900 font-bold text-lg">
              {rating}/{maxRating}
            </span>
          </div>
        );

      default:
        return <div className="text-gray-900 font-bold text-lg">{rating}/{maxRating}</div>;
    }
  };

  // Handle file preview
  const handlePreview = (file: any) => {
    if (!file.fileData) return;

    // Open file in new window/tab
    const newWindow = window.open();
    if (newWindow) {
      const isImage = file.fileType?.startsWith("image/");
      const isPdf = file.fileType === "application/pdf";
      const isVideo = file.fileType?.startsWith("video/");

      if (isImage) {
        // For images, show in a simple HTML page
        newWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
            <head>
              <title>${file.fileName || "معاينة الصورة"}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  background: #f3f4f6;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                  font-family: 'Cairo', sans-serif;
                }
                img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 8px;
                  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .container {
                  text-align: center;
                }
                h2 {
                  color: #1f2937;
                  margin-bottom: 20px;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h2>${file.fileName || "معاينة الصورة"}</h2>
                <img src="${file.fileData}" alt="${file.fileName || "صورة"}" />
              </div>
            </body>
          </html>
        `);
      } else if (isPdf || isVideo) {
        // For PDF and video, use iframe or direct display
        newWindow.document.write(`
          <!DOCTYPE html>
          <html dir="rtl">
            <head>
              <title>${file.fileName || "معاينة الملف"}</title>
              <style>
                body {
                  margin: 0;
                  padding: 0;
                  overflow: hidden;
                }
                iframe, video {
                  width: 100%;
                  height: 100vh;
                  border: none;
                }
              </style>
            </head>
            <body>
              ${isVideo
            ? `<video controls autoplay><source src="${file.fileData}" type="${file.fileType}"></video>`
            : `<iframe src="${file.fileData}"></iframe>`
          }
            </body>
          </html>
        `);
      } else {
        // For other files, just open the data URL
        newWindow.location.href = file.fileData;
      }
    }
  };

  // Helper function to get file source (supports both URL and Base64)
  const getFileSource = (file: any): string | null => {
    // New format: URL
    if (file.fileUrl) {
      return filesService.getFullFileUrl(file.fileUrl);
    }
    // Old format: Base64
    if (file.fileData && file.fileData.startsWith("data:")) {
      return file.fileData;
    }
    return null;
  };

  // Render file answer
  const renderFileAnswer = (value: any) => {
    const files = Array.isArray(value) ? value : [value];

    return (
      <div className="space-y-3">
        {files.map((file: any, idx: number) => {
          const isImage = file.fileType?.startsWith("image/");
          const isVideo = file.fileType?.startsWith("video/");
          const fileSource = getFileSource(file);

          return (
            <div key={idx} className="space-y-3">
              {/* File Info Card */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                <div className="p-2 rounded-lg bg-blue-50">
                  {isImage ? (
                    <ImageIcon className="w-5 h-5 text-blue-600" />
                  ) : isVideo ? (
                    <Video className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Download className="w-5 h-5 text-blue-600" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{file.fileName || "ملف"}</p>
                  <p className="text-sm text-gray-600">
                    {file.fileSize ? (file.fileSize / 1024).toFixed(2) + " KB" : "حجم غير معروف"}
                  </p>
                </div>
                {fileSource && (
                  <div className="flex gap-2">
                    {/* Preview Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview({ ...file, fileData: fileSource })}
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      معاينة
                    </Button>

                    {/* Download Button */}
                    <a
                      href={fileSource}
                      download={file.fileName || "file"}
                      className="inline-flex"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 ml-2" />
                        تحميل
                      </Button>
                    </a>
                  </div>
                )}
              </div>

              {/* Image Preview (if image) */}
              {isImage && fileSource && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileSource}
                    alt={file.fileName || "صورة"}
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: "400px" }}
                  />
                </div>
              )}

              {/* Video Preview (if video) */}
              {isVideo && fileSource && (
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <video
                    src={fileSource}
                    controls
                    className="max-w-full h-auto rounded-lg"
                    style={{ maxHeight: "400px" }}
                  >
                    متصفحك لا يدعم تشغيل الفيديو
                  </video>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render signature answer
  const renderSignatureAnswer = (value: any) => {
    // Support both old format (signatureData) and new format (signatureUrl)
    const signatureSource = value?.signatureUrl
      ? filesService.getFullFileUrl(value.signatureUrl)
      : value?.signatureData;

    if (!value || !signatureSource) {
      return <div className="text-gray-400 italic">لا يوجد توقيع</div>;
    }

    return (
      <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={signatureSource}
          alt="توقيع المشارك"
          className="max-w-full h-auto"
          style={{ maxHeight: "200px" }}
        />
        {value.signedAt && (
          <p className="text-sm text-gray-600 mt-2">
            تم التوقيع في: {new Date(value.signedAt).toLocaleString("ar-EG")}
          </p>
        )}
      </div>
    );
  };

  // Render table answer
  const renderTableAnswer = (value: any, settings: any) => {
    if (!value || !value.rows || value.rows.length === 0) {
      return <div className="text-gray-400 italic">لا توجد بيانات</div>;
    }

    const columns = settings.columns || [];
    const rows = value.rows || [];

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-200 rounded-lg">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-2 text-right font-bold text-gray-900">
                #
              </th>
              {columns.map((col: any) => (
                <th
                  key={col.id}
                  className="border border-gray-200 px-4 py-2 text-center font-bold text-gray-900"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row: any, rowIdx: number) => (
              <tr key={row.rowId} className="hover:bg-gray-50">
                <td className="border border-gray-200 px-4 py-2 text-center font-medium text-gray-600">
                  {rowIdx + 1}
                </td>
                {columns.map((col: any) => (
                  <td
                    key={col.id}
                    className="border border-gray-200 px-4 py-2 text-center text-gray-900"
                  >
                    {row.cells[col.id] || "-"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Check if answer is correct (for quizzes)
  const isCorrectAnswer = (component: Component, answer?: ComponentAnswer): boolean | null => {
    if (!answer || event.type !== "quiz") return null;

    const settings = component.settings as any;
    if (!settings.correctAnswer) return null;

    // Compare answer with correct answer
    if (Array.isArray(answer.answer)) {
      return JSON.stringify(answer.answer.sort()) === JSON.stringify(settings.correctAnswer.sort());
    }

    return answer.answer === settings.correctAnswer;
  };

  return (
    <div className="space-y-6">
      {allComponents.map((component, index) => {
        // Skip display-only components
        if (component.type === "display" || component.type === "text" || component.type === "link") {
          return null;
        }

        const answer = getAnswer(component.id);
        const isCorrect = isCorrectAnswer(component, answer);
        const settings = component.settings as any;

        return (
          <Card key={component.id} className="p-4 sm:p-6">
            {/* Question Header */}
            <div className="flex items-start justify-between mb-3 sm:mb-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-3 mb-2">
                  <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-primary/10 text-primary font-bold text-xs sm:text-sm flex-shrink-0">
                    {index + 1}
                  </span>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                    {settings.label || settings.question || "سؤال بدون عنوان"}
                  </h3>
                </div>
                {settings.description && (
                  <p className="text-gray-600 text-sm mr-8 sm:mr-11">{settings.description}</p>
                )}
              </div>

              {/* Correct/Incorrect Badge (for quizzes) */}
              {isCorrect !== null && (
                <div className="flex-shrink-0">
                  {isCorrect ? (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">صحيح</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700">
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">خاطئ</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Answer */}
            <div className="mr-0 sm:mr-11 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              {renderAnswer(component, answer)}
            </div>

            {/* Points (for quizzes) */}
            {answer && answer.pointsEarned !== undefined && (
              <div className="mr-0 sm:mr-11 mt-3 flex items-center gap-2 text-sm">
                <span className="text-gray-600">النقاط المكتسبة:</span>
                <span className="font-bold text-primary">
                  {answer.pointsEarned}
                </span>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}

