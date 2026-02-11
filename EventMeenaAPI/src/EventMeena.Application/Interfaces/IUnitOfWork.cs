namespace EventMeena.Application.Interfaces;

/// <summary>
/// Unit of Work Interface
/// </summary>
public interface IUnitOfWork : IDisposable
{
    IUserRepository Users { get; }
    IEventRepository Events { get; }
    ISectionRepository Sections { get; }
    IComponentRepository Components { get; }
    IContactRepository Contacts { get; }
    IGroupRepository Groups { get; }
    IResponseRepository Responses { get; }
    IUserTemplateRepository UserTemplates { get; }
    ISendHistoryRepository SendHistories { get; }

    // Document Signing Repositories
    ISignatureFieldRepository SignatureFields { get; }
    IDocumentSignatureRepository DocumentSignatures { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task BeginTransactionAsync();
    Task CommitTransactionAsync();
    Task RollbackTransactionAsync();
    Task ExecuteInTransactionAsync(Func<Task> action);
}

