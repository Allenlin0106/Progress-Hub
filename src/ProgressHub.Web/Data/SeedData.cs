using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.DependencyInjection;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Data
{
    public static class SeedData
    {
        public static async Task EnsureSeededAsync(IServiceProvider services)
        {
            var db = services.GetRequiredService<ApplicationDbContext>();
            var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();

            var demo = await EnsureUserAsync(userManager, "demo@example.com", "Demo User", "demo1234");
            var alice = await EnsureUserAsync(userManager, "alice@example.com", "Alice", "demo1234");

            if (db.Projects.Any()) return;

            var today = DateTime.UtcNow.Date;

            var project = new Project
            {
                Name = "Website Revamp",
                Description = "Redesign and relaunch the marketing site.",
                OwnerId = demo.Id
            };
            project.Members.Add(new ProjectMember { UserId = demo.Id, Role = ProjectRole.Owner });
            project.Members.Add(new ProjectMember { UserId = alice.Id, Role = ProjectRole.Member });
            project.WorkPackages.Add(new WorkPackage
            {
                Title = "Gather design references",
                Status = WorkPackageStatus.New,
                Priority = WorkPackagePriority.Normal,
                Position = 0,
                StartDate = today,
                DueDate = today.AddDays(3)
            });
            project.WorkPackages.Add(new WorkPackage
            {
                Title = "Write content brief",
                Status = WorkPackageStatus.New,
                Priority = WorkPackagePriority.Low,
                Position = 1,
                StartDate = today.AddDays(2),
                DueDate = today.AddDays(5)
            });
            project.WorkPackages.Add(new WorkPackage
            {
                Title = "Build homepage prototype",
                Status = WorkPackageStatus.InProgress,
                Priority = WorkPackagePriority.High,
                Position = 0,
                AssigneeId = alice.Id,
                StartDate = today.AddDays(4),
                DueDate = today.AddDays(10)
            });
            project.WorkPackages.Add(new WorkPackage
            {
                Title = "Set up staging environment",
                Status = WorkPackageStatus.InProgress,
                Priority = WorkPackagePriority.Normal,
                Position = 1,
                AssigneeId = demo.Id,
                StartDate = today.AddDays(6),
                DueDate = today.AddDays(9)
            });
            project.WorkPackages.Add(new WorkPackage
            {
                Title = "Archive legacy assets",
                Status = WorkPackageStatus.Done,
                Priority = WorkPackagePriority.Low,
                Position = 0,
                StartDate = today.AddDays(-5),
                DueDate = today.AddDays(-2)
            });

            db.Projects.Add(project);
            await db.SaveChangesAsync();
        }

        private static async Task<ApplicationUser> EnsureUserAsync(
            UserManager<ApplicationUser> userManager,
            string email,
            string displayName,
            string password)
        {
            var user = await userManager.FindByEmailAsync(email);
            if (user != null) return user;

            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                EmailConfirmed = true,
                DisplayName = displayName
            };
            var result = await userManager.CreateAsync(user, password);
            if (!result.Succeeded)
            {
                throw new InvalidOperationException(
                    "Failed to create seed user: " + string.Join(", ", result.Errors.Select(e => e.Description)));
            }
            return user;
        }
    }
}
