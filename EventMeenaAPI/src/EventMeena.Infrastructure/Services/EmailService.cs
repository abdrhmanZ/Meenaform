using EventMeena.Application.Services.Interfaces;
using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;

namespace EventMeena.Infrastructure.Services;

/// <summary>
/// Email service implementation using SMTP (Brevo/MailKit)
/// </summary>
public class EmailService : IEmailService
{
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpServer;
    private readonly int _smtpPort;
    private readonly string _smtpUsername;
    private readonly string _smtpPassword;
    private readonly string _fromEmail;
    private readonly string _fromName;
    private readonly bool _isConfigured;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _logger = logger;
        _smtpServer = configuration["EmailSettings:SmtpServer"] ?? string.Empty;
        _smtpPort = int.TryParse(configuration["EmailSettings:SmtpPort"], out var port) ? port : 587;
        _smtpUsername = configuration["EmailSettings:SmtpUsername"] ?? string.Empty;
        _smtpPassword = configuration["EmailSettings:SmtpPassword"] ?? string.Empty;
        _fromEmail = configuration["EmailSettings:FromEmail"] ?? "noreply@eventmeena.com";
        _fromName = configuration["EmailSettings:FromName"] ?? "Event Meena";

        _isConfigured = !string.IsNullOrEmpty(_smtpServer) && !string.IsNullOrEmpty(_smtpPassword);
    }

    /// <inheritdoc />
    public async Task<bool> SendEmailAsync(string toEmail, string toName, string subject, string htmlContent, string? plainTextContent = null)
    {
        if (!_isConfigured)
        {
            _logger.LogWarning("SMTP is not configured. Email not sent to {Email}", toEmail);
            return false;
        }

        try
        {
            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(_fromName, _fromEmail));
            message.To.Add(new MailboxAddress(toName, toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = htmlContent,
                TextBody = plainTextContent ?? string.Empty
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(_smtpServer, _smtpPort, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_smtpUsername, _smtpPassword);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation("Email sent successfully to {Email}", toEmail);
            return true;
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
