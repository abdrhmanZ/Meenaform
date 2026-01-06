using System.Reflection;
using System.Text;
using EventMeena.API.Middleware;
using EventMeena.Application.Interfaces;
using EventMeena.Application.Mappings;
using EventMeena.Application.Services.Implementations;
using EventMeena.Application.Services.Interfaces;
using EventMeena.Infrastructure.Data;
using EventMeena.Infrastructure.Repositories;
using EventMeena.Infrastructure.Services;
using EventMeena.API.Services;
using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// ===========================================
// 1. Add Controllers with JSON Options
// ===========================================
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Use camelCase for JSON property names (matches JavaScript conventions)
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        // Also handle incoming requests with case-insensitive matching
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
    });
builder.Services.AddEndpointsApiExplorer();

// ===========================================
// 2. Swagger Configuration
// ===========================================
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "EventMeena API",
        Version = "v1",
        Description = @"
## واجهة برمجة التطبيقات لمنصة Event Meena

منصة EventMeena هي منصة عربية متكاملة لإنشاء وإدارة الفعاليات التفاعلية بما في ذلك:
- **الاستبيانات** (Surveys)
- **الاختبارات** (Quizzes)
- **النماذج** (Forms)
- **الفعاليات** (Events)

### المصادقة
جميع نقاط النهاية (عدا Public) تتطلب مصادقة JWT.
استخدم `/api/auth/login` للحصول على التوكن، ثم أضفه في الـ Header بالصيغة:
`Authorization: Bearer {token}`
",
        Contact = new OpenApiContact
        {
            Name = "فريق Event Meena",
            Email = "support@eventmeena.com",
            Url = new Uri("https://eventmeena.com")
        },
        License = new OpenApiLicense
        {
            Name = "MIT License",
            Url = new Uri("https://opensource.org/licenses/MIT")
        }
    });

    // JWT Authentication in Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = @"أدخل التوكن JWT في الحقل أدناه.

مثال: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

ملاحظة: لا تكتب 'Bearer' قبل التوكن، سيتم إضافتها تلقائياً.",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Include XML Comments
    var xmlFilename = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFilename);
    if (File.Exists(xmlPath))
    {
        options.IncludeXmlComments(xmlPath);
    }

    // Include Application Layer XML Comments
    var applicationXmlPath = Path.Combine(AppContext.BaseDirectory, "EventMeena.Application.xml");
    if (File.Exists(applicationXmlPath))
    {
        options.IncludeXmlComments(applicationXmlPath);
    }

    // Group endpoints by controller tag
    options.TagActionsBy(api => new[] { api.GroupName ?? api.ActionDescriptor.RouteValues["controller"] });
    options.DocInclusionPredicate((docName, description) => true);
});

// ===========================================
// 3. Database Configuration
// ===========================================
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        b =>
        {
            b.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
            b.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery);
        }));

// ===========================================
// 4. Repository Registration
// ===========================================
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();

// ===========================================
// 5. AutoMapper Configuration
// ===========================================
builder.Services.AddAutoMapper(typeof(MappingProfile).Assembly);

// ===========================================
// 6. FluentValidation Configuration
// ===========================================
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<MappingProfile>();

// ===========================================
// 7. Application Services Registration
// ===========================================
builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<IJwtService, JwtService>();
builder.Services.AddScoped<ICurrentUserService, CurrentUserService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEventService, EventService>();
builder.Services.AddScoped<ISectionService, SectionService>();
builder.Services.AddScoped<IComponentService, ComponentService>();
builder.Services.AddScoped<IContactService, ContactService>();
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddScoped<IResponseService, ResponseService>();
builder.Services.AddScoped<ITemplateService, TemplateService>();
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<ISendEventService, SendEventService>();
builder.Services.AddScoped<IFileService, FileService>();

// ===========================================
// 8. JWT Authentication Configuration
// ===========================================
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"] ?? "DefaultSecretKeyForDevelopment12345678901234567890";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"] ?? "EventMeenaAPI",
        ValidAudience = jwtSettings["Audience"] ?? "EventMeenaClient",
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };
});

builder.Services.AddAuthorization();

// ===========================================
// 9. CORS Configuration
// ===========================================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(builder.Configuration["FrontendUrl"] ?? "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// ===========================================
// Configure the HTTP request pipeline
// ===========================================

// CORS must be first to handle preflight OPTIONS requests
app.UseCors("AllowFrontend");

// Enable Swagger in Development and Production (for API documentation)
app.UseSwagger(options =>
{
    options.RouteTemplate = "swagger/{documentName}/swagger.json";
});

app.UseSwaggerUI(options =>
{
    options.SwaggerEndpoint("/swagger/v1/swagger.json", "EventMeena API v1");
    options.RoutePrefix = "swagger";
    options.DocumentTitle = "EventMeena API Documentation";
    options.DefaultModelsExpandDepth(2);
    options.DefaultModelRendering(Swashbuckle.AspNetCore.SwaggerUI.ModelRendering.Model);
    options.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
    options.EnableFilter();
    options.EnableDeepLinking();
    options.DisplayRequestDuration();
});

// Global Exception Handling Middleware
app.UseMiddleware<ExceptionMiddleware>();

// Skip HTTPS redirection for HTTP-only deployment
// app.UseHttpsRedirection();

// Static Files for uploaded files (images, videos, pdfs, signatures)
app.UseStaticFiles();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
