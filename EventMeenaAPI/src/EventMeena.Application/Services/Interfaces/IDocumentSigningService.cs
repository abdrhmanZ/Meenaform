using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.DocumentSigning;
using EventMeena.Application.DTOs.Events;

namespace EventMeena.Application.Services.Interfaces;

/// <summary>
/// خدمة توقيع الوثائق
/// </summary>
public interface IDocumentSigningService
{
    #region Event Operations

    /// <summary>
    /// إنشاء حدث توقيع وثيقة جديد
    /// </summary>
    Task<ApiResponse<EventWithSignatureFieldsDto>> CreateDocumentEventAsync(
        Guid userId,
        string documentUrl,
        string documentFileName,
        CreateDocumentEventRequest request);

    /// <summary>
    /// إنشاء حدث توقيع وثيقة جديد مع URL الوثيقة (بعد رفعها مسبقاً)
    /// </summary>
    Task<ApiResponse<EventWithSignatureFieldsDto>> CreateDocumentEventWithUrlAsync(
        Guid userId,
        CreateDocumentEventWithUrlRequest request);

    /// <summary>
    /// تحديث حدث توقيع وثيقة
    /// </summary>
    Task<ApiResponse<EventWithSignatureFieldsDto>> UpdateDocumentEventAsync(
        Guid eventId,
        Guid userId,
        UpdateDocumentEventRequest request);

    /// <summary>
    /// الحصول على حدث توقيع مع حقول التوقيع
    /// </summary>
    Task<ApiResponse<EventWithSignatureFieldsDto>> GetDocumentEventAsync(Guid eventId, Guid userId);

    /// <summary>
    /// الحصول على حدث توقيع للمشاركة العامة
    /// </summary>
    Task<ApiResponse<EventWithSignatureFieldsDto>> GetDocumentEventByShareCodeAsync(string shareCode);

    #endregion

    #region Signature Field Operations

    /// <summary>
    /// إضافة حقل توقيع
    /// </summary>
    Task<ApiResponse<SignatureFieldDto>> AddSignatureFieldAsync(
        Guid eventId,
        Guid userId,
        CreateSignatureFieldRequest request);

    /// <summary>
    /// تحديث حقل توقيع
    /// </summary>
    Task<ApiResponse<SignatureFieldDto>> UpdateSignatureFieldAsync(
        Guid fieldId,
        Guid userId,
        UpdateSignatureFieldRequest request);

    /// <summary>
    /// حذف حقل توقيع
    /// </summary>
    Task<ApiResponse> DeleteSignatureFieldAsync(Guid fieldId, Guid userId);

    /// <summary>
    /// الحصول على جميع حقول التوقيع لحدث
    /// </summary>
    Task<ApiResponse<List<SignatureFieldDto>>> GetSignatureFieldsAsync(Guid eventId);

    #endregion

    #region Signature Operations

    /// <summary>
    /// إرسال توقيع واحد
    /// </summary>
    Task<ApiResponse<DocumentSignatureDto>> SubmitSignatureAsync(
        Guid responseId,
        SubmitSignatureRequest request,
        string? ipAddress,
        string? userAgent);

    /// <summary>
    /// إرسال جميع التوقيعات مرة واحدة
    /// </summary>
    Task<ApiResponse<List<DocumentSignatureDto>>> SubmitAllSignaturesAsync(
        SubmitAllSignaturesRequest request,
        string? ipAddress,
        string? userAgent);

    /// <summary>
    /// الحصول على جميع التوقيعات لحدث
    /// </summary>
    Task<ApiResponse<List<DocumentSignatureDto>>> GetEventSignaturesAsync(Guid eventId, Guid userId);

    /// <summary>
    /// الحصول على توقيعات رد معين
    /// </summary>
    Task<ApiResponse<List<DocumentSignatureDto>>> GetResponseSignaturesAsync(Guid responseId);

    #endregion

    #region PDF Operations

    /// <summary>
    /// تحديث رابط الوثيقة
    /// </summary>
    Task<ApiResponse> UpdateDocumentUrlAsync(Guid eventId, Guid userId, string documentUrl, string fileName);

    #endregion
}

