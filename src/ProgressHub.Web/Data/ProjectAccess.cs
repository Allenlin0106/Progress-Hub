using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Data
{
    public static class ProjectAccess
    {
        public static Task<ProjectMember> GetMembershipAsync(
            ApplicationDbContext db, int projectId, string userId)
        {
            return db.ProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == projectId && m.UserId == userId);
        }

        public static async Task<(Project project, ProjectMember membership)> LoadAsync(
            ApplicationDbContext db, int projectId, string userId)
        {
            var project = await db.Projects
                .Include(p => p.Owner)
                .FirstOrDefaultAsync(p => p.Id == projectId);
            if (project == null) return (null, null);

            var membership = await GetMembershipAsync(db, projectId, userId);
            return (project, membership);
        }
    }
}
