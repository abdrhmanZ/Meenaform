using EventMeena.Application.DTOs.Common;
using EventMeena.Application.DTOs.DocumentSigning;
using EventMeena.Application.DTOs.Events;
using EventMeena.Application.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventMeena.API.Controllers;

/// <summary>
/// Document Signing management controller
/// توقيع الوثائق
/// </summary>
[Authorize]
public class DocumentSigningController : BaseApiController
{
    private readonly IDocumentSigningService _documentSigningService;
    private readonly IFileService _fileService;

    public DocumentSigningController(
        IDocumentSigningService documentSigningService,
        IFileService fileService)
    {
        _documentSigningService = documentSigningService;
        _fileService = fileService;
    }

    #region Event Operations

    /// <summary>
    /// إنشاء حدث توقيع وثيقة جديد
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ApiResponse<EventWithSignatureFieldsDto>>> CreateDocumentEvent(
        [FromForm] CreateDocumentEventRequest request,
        [FromForm] IFormFile document)
    {
        if (document == null || document.Length == 0)
            return BadRequestResponse<EventWithSignatureFieldsDto>("يجب رفع ملف PDF");

        // التحقق من نوع الملف
        var allowedTypes = new[] { "application/pdf" };
        if (!allowedTypes.Contains(document.ContentType.ToLower()))
            return BadRequestResponse<EventWithSignatureFieldsDto>("يجب أن يكون الملف من نوع PDF");

        // رفع الملف
        var uploadResult = await _fileService.UploadFileAsync(document, "documents");
        if (string.IsNullOrEmpty(uploadResult.FileUrl))
            return BadRequestResponse<EventWithSignatureFieldsDto>("فشل رفع الملف");

        var result = await _documentSigningService.CreateDocumentEventAsync(
            CurrentUserId,
            uploadResult.FileUrl,
            document.FileName,
            request);

        if (!result.Success)
            return BadRequestResponse<EventWithSignatureFieldsDto>(result.Message ?? "فشل إنشاء الحدث");

        return Created(result.Data!);
    }

    /// <summary>
    /// إنشاء حدث توقيع وثيقة جديد مع URL الوثيقة (بعد رفعها مسبقاً)
    /// </summary>
    [HttpPost("with-url")]
    public async Task<ActionResult<ApiResponse<EventWithSignatureFieldsDto>>> CreateDocumentEventWithUrl(
        [FromBody] CreateDocumentEventWithUrlRequest request)
    {
        if (string.IsNullOrEmpty(request.DocumentUrl))
            return BadRequestResponse<EventWithSignatureFieldsDto>("يجب تحديد رابط الوثيقة");

        var result = await _documentSigningService.CreateDocumentEventWithUrlAsync(
            CurrentUserId,
            request);

        if (!result.Success)
            return BadRequestResponse<EventWithSignatureFieldsDto>(result.Message ?? "فشل إنشاء الحدث");

        return Created(result.Data!);
    }

    /// <summary>
    /// تحديث حدث توقيع وثيقة
    /// </summary>
    [HttpPut("{eventId:guid}")]
    public async Task<ActionResult<ApiResponse<EventWithSignatureFieldsDto>>> UpdateDocumentEvent(
        Guid eventId,
        [FromBody] UpdateDocumentEventRequest request)
    {
        var result = await _documentSigningService.UpdateDocumentEventAsync(eventId, CurrentUserId, request);

        if (!result.Success)
            return BadRequestResponse<EventWithSignatureFieldsDto>(result.Message ?? "فشل تحديث الحدث");

        return Success(result.Data!);
    }

    /// <summary>
    /// الحصول على حدث توقيع
    /// </summary>
    [HttpGet("{eventId:guid}")]
    public async Task<ActionResult<ApiResponse<EventWithSignatureFieldsDto>>> GetDocumentEvent(Guid eventId)
    {
        var result = await _documentSigningService.GetDocumentEventAsync(eventId, CurrentUserId);

        if (!result.Success)
            return NotFoundResponse<EventWithSignatureFieldsDto>(result.Message ?? "الحدث غير موجود");

        return Success(result.Data!);
    }

    /// <summary>
    /// تحديث ملف الوثيقة
    /// </summary>
    [HttpPut("{eventId:guid}/document")]
    public async Task<ActionResult<ApiResponse>> UpdateDocument(
        Guid eventId,
        [FromForm] IFormFile document)
    {
        if (document == null || document.Length == 0)
            return BadRequestNoContent("يجب رفع ملف PDF");

        var allowedTypes = new[] { "application/pdf" };
        if (!allowedTypes.Contains(document.ContentType.ToLower()))
            return BadRequestNoContent("يجب أن يكون الملف من نوع PDF");

        var uploadResult = await _fileService.UploadFileAsync(document, "documents");
        if (string.IsNullOrEmpty(uploadResult.FileUrl))
            return BadRequestNoContent("فشل رفع الملف");

        var result = await _documentSigningService.UpdateDocumentUrlAsync(
            eventId,
            CurrentUserId,
            uploadResult.FileUrl,
            document.FileName);

        if (!result.Success)
            return BadRequestNoContent(result.Message ?? "فشل تحديث الوثيقة");

        return SuccessNoContent("تم تحديث الوثيقة بنجاح");
    }

    #endregion

    #region Signature Field Operations

    /// <summary>
    /// إضافة حقل توقيع
    /// </summary>
    [HttpPost("{eventId:guid}/fields")]
    public async Task<ActionResult<ApiResponse<SignatureFieldDto>>> AddSignatureField(
        Guid eventId,
        [FromBody] CreateSignatureFieldRequest request)
    {
        var result = await _documentSigningService.AddSignatureFieldAsync(eventId, CurrentUserId, request);

        if (!result.Success)
            return BadRequestResponse<SignatureFieldDto>(result.Message ?? "فشل إضافة حقل التوقيع");

        return Created(result.Data!);
    }

    /// <summary>
    /// تحديث حقل توقيع
    /// </summary>
    [HttpPut("fields/{fieldId:guid}")]
    public async Task<ActionResult<ApiResponse<SignatureFieldDto>>> UpdateSignatureField(
        Guid fieldId,
        [FromBody] UpdateSignatureFieldRequest request)
    {
        var result = await _documentSigningService.UpdateSignatureFieldAsync(fieldId, CurrentUserId, request);

        if (!result.Success)
            return BadRequestResponse<SignatureFieldDto>(result.Message ?? "فشل تحديث حقل التوقيع");

        return Success(result.Data!);
    }

    /// <summary>
    /// حذف حقل توقيع
    /// </summary>
    [HttpDelete("fields/{fieldId:guid}")]
    public async Task<ActionResult<ApiResponse>> DeleteSignatureField(Guid fieldId)
    {
        var result = await _documentSigningService.DeleteSignatureFieldAsync(fieldId, CurrentUserId);

        if (!result.Success)
            return BadRequestNoContent(result.Message ?? "فشل حذف حقل التوقيع");

        return SuccessNoContent("تم حذف حقل التوقيع بنجاح");
    }

    /// <summary>
    /// الحصول على جميع حقول التوقيع لحدث
    /// </summary>
    [HttpGet("{eventId:guid}/fields")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<SignatureFieldDto>>>> GetSignatureFields(Guid eventId)
    {
        var result = await _documentSigningService.GetSignatureFieldsAsync(eventId);

        if (!result.Success)
            return BadRequestResponse<List<SignatureFieldDto>>(result.Message ?? "فشل جلب حقول التوقيع");

        return Success(result.Data!);
    }

    #endregion

    #region Signature Operations

    /// <summary>
    /// الحصول على جميع التوقيعات لحدث
    /// </summary>
    [HttpGet("{eventId:guid}/signatures")]
    public async Task<ActionResult<ApiResponse<List<DocumentSignatureDto>>>> GetEventSignatures(Guid eventId)
    {
        var result = await _documentSigningService.GetEventSignaturesAsync(eventId, CurrentUserId);

        if (!result.Success)
            return BadRequestResponse<List<DocumentSignatureDto>>(result.Message ?? "فشل جلب التوقيعات");

        return Success(result.Data!);
    }

    /// <summary>
    /// الحصول على توقيعات رد معين
    /// </summary>
    [HttpGet("responses/{responseId:guid}/signatures")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<DocumentSignatureDto>>>> GetResponseSignatures(Guid responseId)
    {
        var result = await _documentSigningService.GetResponseSignaturesAsync(responseId);

        if (!result.Success)
            return BadRequestResponse<List<DocumentSignatureDto>>(result.Message ?? "فشل جلب التوقيعات");

        return Success(result.Data!);
    }

    #endregion

    #region Public Endpoints

    /// <summary>
    /// الحصول على حدث توقيع للمشاركة العامة
    /// </summary>
    [HttpGet("public/{shareCode}")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<EventWithSignatureFieldsDto>>> GetPublicDocumentEvent(string shareCode)
    {
        var result = await _documentSigningService.GetDocumentEventByShareCodeAsync(shareCode);

        if (!result.Success)
            return NotFoundResponse<EventWithSignatureFieldsDto>(result.Message ?? "الحدث غير موجود");

        return Success(result.Data!);
    }

    /// <summary>
    /// إرسال توقيع واحد
    /// </summary>
    [HttpPost("responses/{responseId:guid}/sign")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<DocumentSignatureDto>>> SubmitSignature(
        Guid responseId,
        [FromBody] SubmitSignatureRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _documentSigningService.SubmitSignatureAsync(
            responseId,
            request,
            ipAddress,
            userAgent);

        if (!result.Success)
            return BadRequestResponse<DocumentSignatureDto>(result.Message ?? "فشل إرسال التوقيع");

        return Created(result.Data!);
    }

    /// <summary>
    /// إرسال جميع التوقيعات مرة واحدة
    /// </summary>
    [HttpPost("sign-all")]
    [AllowAnonymous]
    public async Task<ActionResult<ApiResponse<List<DocumentSignatureDto>>>> SubmitAllSignatures(
        [FromBody] SubmitAllSignaturesRequest request)
    {
        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _documentSigningService.SubmitAllSignaturesAsync(
            request,
            ipAddress,
            userAgent);

        if (!result.Success)
            return BadRequestResponse<List<DocumentSignatureDto>>(result.Message ?? "فشل إرسال التوقيعات");

        return Created(result.Data!);
    }

    #endregion
}

