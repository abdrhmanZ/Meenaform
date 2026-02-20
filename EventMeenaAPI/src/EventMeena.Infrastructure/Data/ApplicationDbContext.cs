using EventMeena.Domain.Common;
using EventMeena.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using System.Reflection;

namespace EventMeena.Infrastructure.Data;

/// <summary>
/// قاعدة بيانات التطبيق
/// </summary>
public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
        // جعل كل الـ queries بدون تتبع افتراضياً = أداء أفضل + ذاكرة أقل
        // العمليات اللي محتاجة تتبع (Add/Update/Delete) بتتعامل مع الـ ChangeTracker مباشرة
        ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
    }

    // DbSets
    public DbSet<User> Users => Set<User>();
    public DbSet<Event> Events => Set<Event>();
    public DbSet<Section> Sections => Set<Section>();
    public DbSet<Component> Components => Set<Component>();
    public DbSet<Contact> Contacts => Set<Contact>();
    public DbSet<Group> Groups => Set<Group>();
    public DbSet<ContactGroup> ContactGroups => Set<ContactGroup>();
    public DbSet<Response> Responses => Set<Response>();
    public DbSet<UserTemplate> UserTemplates => Set<UserTemplate>();
    public DbSet<SendHistory> SendHistories => Set<SendHistory>();

    // Document Signing DbSets
    public DbSet<SignatureField> SignatureFields => Set<SignatureField>();
    public DbSet<DocumentSignature> DocumentSignatures => Set<DocumentSignature>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // تطبيق جميع الـ Configurations من الـ Assembly
        modelBuilder.ApplyConfigurationsFromAssembly(Assembly.GetExecutingAssembly());
    }

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<AuditableEntity>())
        {
            switch (entry.State)
            {
                case EntityState.Added:
                    entry.Entity.CreatedAt = DateTime.UtcNow;
                    break;
                case EntityState.Modified:
                    entry.Entity.UpdatedAt = DateTime.UtcNow;
                    break;
            }
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}

