using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using ProgressHub.Web.Data;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Pages.Projects
{
    public class IndexModel : PageModel
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public IndexModel(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public class Row
        {
            public Project Project { get; set; }
            public int WorkPackageCount { get; set; }
            public int MemberCount { get; set; }
        }

        public List<Row> Projects { get; set; } = new List<Row>();

        public async Task OnGetAsync()
        {
            var userId = _userManager.GetUserId(User);
            Projects = await _db.ProjectMembers
                .Where(m => m.UserId == userId)
                .Select(m => new Row
                {
                    Project = m.Project,
                    WorkPackageCount = m.Project.WorkPackages.Count,
                    MemberCount = m.Project.Members.Count
                })
                .OrderByDescending(r => r.Project.UpdatedAt)
                .ToListAsync();
        }
    }
}
