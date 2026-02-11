using EventMeena.Application.Interfaces;
using EventMeena.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage;

namespace EventMeena.Infrastructure.Repositories;

/// <summary>
/// Unit of Work Implementation
/// </summary>
public class UnitOfWork : IUnitOfWork
{
    private readonly ApplicationDbContext _context;
    private IDbContextTransaction? _transaction;

    private IUserRepository? _users;
    private IEventRepository? _events;
    private ISectionRepository? _sections;
    private IComponentRepository? _components;
    private IContactRepository? _contacts;
    private IGroupRepository? _groups;
    private IResponseRepository? _responses;
    private IUserTemplateRepository? _userTemplates;
    private ISendHistoryRepository? _sendHistories;
    private ISignatureFieldRepository? _signatureFields;
    private IDocumentSignatureRepository? _documentSignatures;

    public UnitOfWork(ApplicationDbContext context)
    {
        _context = context;
    }

    public IUserRepository Users =>
        _users ??= new UserRepository(_context);

    public IEventRepository Events =>
        _events ??= new EventRepository(_context);

    public ISectionRepository Sections =>
        _sections ??= new SectionRepository(_context);

    public IComponentRepository Components =>
        _components ??= new ComponentRepository(_context);

    public IContactRepository Contacts =>
        _contacts ??= new ContactRepository(_context);

    public IGroupRepository Groups =>
        _groups ??= new GroupRepository(_context);

    public IResponseRepository Responses =>
        _responses ??= new ResponseRepository(_context);

    public IUserTemplateRepository UserTemplates =>
        _userTemplates ??= new UserTemplateRepository(_context);

    public ISendHistoryRepository SendHistories =>
        _sendHistories ??= new SendHistoryRepository(_context);

    public ISignatureFieldRepository SignatureFields =>
        _signatureFields ??= new SignatureFieldRepository(_context);

    public IDocumentSignatureRepository DocumentSignatures =>
        _documentSignatures ??= new DocumentSignatureRepository(_context);

    public async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        return await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task BeginTransactionAsync()
    {
        _transaction = await _context.Database.BeginTransactionAsync();
    }

    public async Task CommitTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.CommitAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task RollbackTransactionAsync()
    {
        if (_transaction != null)
        {
            await _transaction.RollbackAsync();
            await _transaction.DisposeAsync();
            _transaction = null;
        }
    }

    public async Task ExecuteInTransactionAsync(Func<Task> action)
    {
        var strategy = _context.Database.CreateExecutionStrategy();
        await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                await action();
                await transaction.CommitAsync();
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        });
    }

    public void Dispose()
    {
        _transaction?.Dispose();
        _context.Dispose();
    }
}

