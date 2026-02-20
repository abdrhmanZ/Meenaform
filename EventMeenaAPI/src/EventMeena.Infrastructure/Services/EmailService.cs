using EventMeena.Application.Services.Interfaces;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SendGrid;
using SendGrid.Helpers.Mail;

namespace EventMeena.Infrastructure.Services;

/// <summary>
/// Email service implementation using SendGrid
/// </summary>
public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly SendGridClient? _client;
    private readonly string _fromEmail;
    private readonly string _fromName;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
        var apiKey = _configuration["EmailSettings:SendGridApiKey"] ?? string.Empty;
        _client = !string.IsNullOrEmpty(apiKey) ? new SendGridClient(apiKey) : null;
        _fromEmail = _configuration["EmailSettings:FromEmail"] ?? "noreply@eventmeena.com";
        _fromName = _configuration["EmailSettings:FromName"] ?? "Event Meena";
    }

    /// <inheritdoc />
    public async Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlContent, string? plainTextContent = null)
    {
        if (_client == null)
        {
            _logger.LogWarning("SendGrid API Key is not configured. Email not sent to {Email}", toEmail);
            return false;
        }

        try
        {
            var from = new EmailAddress(_fromEmail, _fromName);
            var to = new EmailAddress(toEmail, toName);
            var msg = MailHelper.CreateSingleEmail(from, to, subject, plainTextContent ?? string.Empty, htmlContent);

            var response = await _client.SendEmailAsync(msg);

            if (response.IsSuccessStatusCode)
            {
                _logger.LogInformation("Email sent successfully to {Email}", toEmail);
                return true;
            }

            _logger.LogWarning("Failed to send email to {Email}. Status: {Status}", toEmail, response.StatusCode);
            return false;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}", toEmail);
            return false;
        }
    }

    /// <inheritdoc />
    public async Task<int> SendBulkEmailAsync(IEnumerable<(string Email, string Name)> recipients, string subject, string htmlContent, string? plainTextContent = null)
    {
        var successCount = 0;

        foreach (var (email, name) in recipients)
        {
            if (await SendEmailAsync(email, name, subject, htmlContent, plainTextContent))
            {
                successCount++;
            }

            // Add small delay to avoid rate limiting
            await Task.Delay(100);
        }

        _logger.LogInformation("Bulk email sent: {Success} of {Total} emails", successCount, recipients.Count());
        return successCount;
    }

    /// <inheritdoc />
    public async Task<bool> SendEventInvitationAsync(string toEmail, string toName, string eventTitle, string? eventDescription, string eventLink)
    {
        var subject = $"دعوة للمشاركة في: {eventTitle}";

        var htmlContent = $@"
        <div dir='rtl' style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #2563eb;'>مرحباً {toName}،</h2>
            <p>تمت دعوتك للمشاركة في:</p>
            <div style='background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;'>
                <h3 style='margin: 0 0 10px 0; color: #1f2937;'>{eventTitle}</h3>
                {(string.IsNullOrEmpty(eventDescription) ? "" : $"<p style='color: #6b7280; margin: 0;'>{eventDescription}</p>")}
            </div>
            <a href='{eventLink}' style='display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;'>
                المشاركة الآن
            </a>
            <p style='color: #6b7280; font-size: 14px;'>
                أو انسخ الرابط التالي:<br/>
                <a href='{eventLink}'>{eventLink}</a>
            </p>
            <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;'/>
            <p style='color: #9ca3af; font-size: 12px;'>
                هذا البريد مرسل من Event Meena
            </p>
        </div>";

        var plainText = $"مرحباً {toName}، تمت دعوتك للمشاركة في: {eventTitle}. للمشاركة، اضغط على الرابط: {eventLink}";

        return await SendEmailAsync(toEmail, toName, subject, htmlContent, plainText);
    }

    /// <inheritdoc />
    public async Task<bool> SendEventReminderAsync(string toEmail, string toName, string eventTitle, string eventLink, DateTime? endDate)
    {
        var subject = $"تذكير: {eventTitle}";

        var endDateText = endDate.HasValue
            ? $"<p style='color: #dc2626;'>ينتهي في: {endDate.Value:yyyy/MM/dd HH:mm}</p>"
            : "";

        var htmlContent = $@"
        <div dir='rtl' style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #2563eb;'>مرحباً {toName}،</h2>
            <p>هذا تذكير للمشاركة في:</p>
            <div style='background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #f59e0b;'>
                <h3 style='margin: 0 0 10px 0; color: #1f2937;'>{eventTitle}</h3>
                {endDateText}
            </div>
            <a href='{eventLink}' style='display: inline-block; background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;'>
                المشاركة الآن
            </a>
            <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;'/>
            <p style='color: #9ca3af; font-size: 12px;'>
                هذا البريد مرسل من Event Meena
            </p>
        </div>";

        var plainText = $"مرحباً {toName}، هذا تذكير للمشاركة في: {eventTitle}. للمشاركة، اضغط على الرابط: {eventLink}";

        return await SendEmailAsync(toEmail, toName, subject, htmlContent, plainText);
    }

    /// <inheritdoc />
    public async Task<bool> SendPasswordResetEmailAsync(string toEmail, string toName, string resetLink)
    {
        var subject = "إعادة تعيين كلمة المرور - Event Meena";

        var htmlContent = $@"
        <div dir='rtl' style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
            <h2 style='color: #2563eb;'>مرحباً {toName}،</h2>
            <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك.</p>
            <div style='background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid #dc2626;'>
                <p style='margin: 0; color: #7f1d1d;'>⚠️ إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذا البريد.</p>
            </div>
            <a href='{resetLink}' style='display: inline-block; background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;'>
                إعادة تعيين كلمة المرور
            </a>
            <p style='color: #6b7280; font-size: 14px;'>
                أو انسخ الرابط التالي:<br/>
                <a href='{resetLink}'>{resetLink}</a>
            </p>
            <p style='color: #dc2626; font-size: 14px;'>
                ⏰ هذا الرابط صالح لمدة ساعة واحدة فقط.
            </p>
            <hr style='border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;'/>
            <p style='color: #9ca3af; font-size: 12px;'>
                هذا البريد مرسل من Event Meena
            </p>
        </div>";

        var plainText = $"مرحباً {toName}، لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك. لإعادة التعيين، اضغط على الرابط: {resetLink}. هذا الرابط صالح لمدة ساعة واحدة فقط.";

        return await SendEmailAsync(toEmail, toName, subject, htmlContent, plainText);
    }
}

