using AutoMapper;
using EventMeena.Application.DTOs.Auth;
using EventMeena.Application.DTOs.Common;
using EventMeena.Application.Interfaces;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Domain.Entities;
using Microsoft.Extensions.Configuration;

namespace EventMeena.Application.Services.Implementations;

/// <summary>
/// Authentication service implementation
/// </summary>
public class AuthService : IAuthService
{
    private readonly IUnitOfWork _unitOfWork;
    private readonly IMapper _mapper;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;
    private readonly string _frontendUrl;

    public AuthService(
        IUnitOfWork unitOfWork,
        IMapper mapper,
        IJwtService jwtService,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _unitOfWork = unitOfWork;
        _mapper = mapper;
        _jwtService = jwtService;
        _emailService = emailService;
        _frontendUrl = configuration["FrontendUrl"] ?? "http://localhost:3000";
    }

    public async Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        if (await _unitOfWork.Users.EmailExistsAsync(request.Email))
            return ApiResponse<AuthResponse>.FailureResponse("البريد الإلكتروني مسجل مسبقاً");

        var user = new User
        {
            FullName = request.FullName,
            Email = request.Email.ToLower(),
            PasswordHash = HashPassword(request.Password),
            Phone = request.Phone,
            IsActive = true
        };

        await _unitOfWork.Users.AddAsync(user);
        await _unitOfWork.SaveChangesAsync();

        return await GenerateAuthResponse(user, "تم إنشاء الحساب بنجاح");
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);
        if (user == null || !VerifyPassword(request.Password, user.PasswordHash))
            return ApiResponse<AuthResponse>.FailureResponse("البريد الإلكتروني أو كلمة المرور غير صحيحة");

        if (!user.IsActive)
            return ApiResponse<AuthResponse>.FailureResponse("الحساب غير مفعل");

        user.LastLoginAt = DateTime.UtcNow;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return await GenerateAuthResponse(user, "تم تسجيل الدخول بنجاح");
    }

    public async Task<ApiResponse<AuthResponse>> RefreshTokenAsync(RefreshTokenRequest request)
    {
        var user = await _unitOfWork.Users.GetByRefreshTokenAsync(request.RefreshToken);
        if (user == null || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return ApiResponse<AuthResponse>.FailureResponse("رمز التحديث غير صالح أو منتهي الصلاحية");

        return await GenerateAuthResponse(user, "تم تحديث الرمز بنجاح");
    }

    public async Task<ApiResponse> LogoutAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            return ApiResponse.FailureResponse("المستخدم غير موجود");

        user.RefreshToken = null;
        user.RefreshTokenExpiryTime = null;
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم تسجيل الخروج بنجاح");
    }

    public async Task<ApiResponse<UserDto>> GetCurrentUserAsync(Guid userId)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            return ApiResponse<UserDto>.FailureResponse("المستخدم غير موجود");

        return ApiResponse<UserDto>.SuccessResponse(_mapper.Map<UserDto>(user));
    }

    public async Task<ApiResponse<UserDto>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            return ApiResponse<UserDto>.FailureResponse("المستخدم غير موجود");

        user.FullName = request.FullName;
        user.Phone = request.Phone;
        user.ProfileImage = request.ProfileImage;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<UserDto>.SuccessResponse(_mapper.Map<UserDto>(user), "تم تحديث الملف الشخصي بنجاح");
    }

    public async Task<ApiResponse> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _unitOfWork.Users.GetByIdAsync(userId);
        if (user == null)
            return ApiResponse.FailureResponse("المستخدم غير موجود");

        if (!VerifyPassword(request.CurrentPassword, user.PasswordHash))
            return ApiResponse.FailureResponse("كلمة المرور الحالية غير صحيحة");

        user.PasswordHash = HashPassword(request.NewPassword);
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم تغيير كلمة المرور بنجاح");
    }

    public async Task<ApiResponse> ForgotPasswordAsync(ForgotPasswordRequest request)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);

        // لأسباب أمنية، نعود برسالة نجاح حتى لو الإيميل غير موجود
        if (user == null)
        {
            return ApiResponse.SuccessResponse("إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور");
        }

        // إنشاء رمز إعادة التعيين
        var resetToken = Guid.NewGuid().ToString("N");
        user.PasswordResetToken = resetToken;
        user.PasswordResetTokenExpiry = DateTime.UtcNow.AddHours(1); // صالح لمدة ساعة

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        // إرسال البريد الإلكتروني
        var resetLink = $"{_frontendUrl}/reset-password?email={Uri.EscapeDataString(user.Email)}&token={resetToken}";

        await _emailService.SendPasswordResetEmailAsync(user.Email, user.FullName, resetLink);

        return ApiResponse.SuccessResponse("إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور");
    }

    public async Task<ApiResponse> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var user = await _unitOfWork.Users.GetByEmailAsync(request.Email);

        if (user == null)
            return ApiResponse.FailureResponse("البريد الإلكتروني غير مسجل");

        // التحقق من صلاحية الرمز
        if (user.PasswordResetToken != request.Token)
            return ApiResponse.FailureResponse("رمز إعادة التعيين غير صحيح");

        if (user.PasswordResetTokenExpiry == null || user.PasswordResetTokenExpiry < DateTime.UtcNow)
            return ApiResponse.FailureResponse("رمز إعادة التعيين منتهي الصلاحية");

        // تحديث كلمة المرور
        user.PasswordHash = HashPassword(request.NewPassword);
        user.PasswordResetToken = null;
        user.PasswordResetTokenExpiry = null;

        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse.SuccessResponse("تم إعادة تعيين كلمة المرور بنجاح");
    }

    // Helper methods
    private async Task<ApiResponse<AuthResponse>> GenerateAuthResponse(User user, string message)
    {
        var accessToken = _jwtService.GenerateAccessToken(user);
        var refreshToken = _jwtService.GenerateRefreshToken();

        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = _jwtService.GetRefreshTokenExpiration();
        _unitOfWork.Users.Update(user);
        await _unitOfWork.SaveChangesAsync();

        return ApiResponse<AuthResponse>.SuccessResponse(new AuthResponse
        {
            UserId = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            ProfileImage = user.ProfileImage,
            AccessToken = accessToken,
            RefreshToken = refreshToken,
            ExpiresAt = _jwtService.GetTokenExpiration()
        }, message);
    }

    private static string HashPassword(string password)
    {
        return BCrypt.Net.BCrypt.HashPassword(password);
    }

    private static bool VerifyPassword(string password, string hash)
    {
        return BCrypt.Net.BCrypt.Verify(password, hash);
    }
}

