using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Data
{
    public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<Project> Projects { get; set; }
        public DbSet<ProjectMember> ProjectMembers { get; set; }
        public DbSet<WorkPackage> WorkPackages { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            builder.Entity<Project>(e =>
            {
                e.HasOne(p => p.Owner)
                    .WithMany(u => u.OwnedProjects)
                    .HasForeignKey(p => p.OwnerId)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            builder.Entity<ProjectMember>(e =>
            {
                e.HasIndex(m => new { m.ProjectId, m.UserId }).IsUnique();
                e.HasOne(m => m.Project)
                    .WithMany(p => p.Members)
                    .HasForeignKey(m => m.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(m => m.User)
                    .WithMany(u => u.Memberships)
                    .HasForeignKey(m => m.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            builder.Entity<WorkPackage>(e =>
            {
                e.HasOne(w => w.Project)
                    .WithMany(p => p.WorkPackages)
                    .HasForeignKey(w => w.ProjectId)
                    .OnDelete(DeleteBehavior.Cascade);
                e.HasOne(w => w.Assignee)
                    .WithMany(u => u.AssignedWorkPackages)
                    .HasForeignKey(w => w.AssigneeId)
                    .OnDelete(DeleteBehavior.SetNull);
                e.HasIndex(w => new { w.ProjectId, w.Status, w.Position });
            });
        }
    }
}
