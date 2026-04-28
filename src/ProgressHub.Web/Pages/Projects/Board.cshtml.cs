using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Antiforgery;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using ProgressHub.Web.Data;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Pages.Projects
{
    public class BoardModel : PageModel
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly IAntiforgery _antiforgery;

        public BoardModel(ApplicationDbContext db, UserManager<ApplicationUser> userManager, IAntiforgery antiforgery)
        {
            _db = db;
            _userManager = userManager;
            _antiforgery = antiforgery;
        }

        public Project Project { get; set; }
        public bool IsOwner { get; set; }
        public string AntiForgeryToken { get; set; }
        public List<Column> Columns { get; set; } = new List<Column>();

        public class Column
        {
            public WorkPackageStatus Status { get; set; }
            public string StatusKey => Status.ToString();
            public string Label { get; set; }
            public List<WorkPackage> Items { get; set; } = new List<WorkPackage>();
        }

        public class MoveInput
        {
            public int Id { get; set; }
            public WorkPackageStatus Status { get; set; }
            public int Position { get; set; }
        }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var userId = _userManager.GetUserId(User);
            var (project, membership) = await ProjectAccess.LoadAsync(_db, id, userId);
            if (project == null) return NotFound();
            if (membership == null) return Forbid();

            Project = project;
            IsOwner = membership.Role == ProjectRole.Owner;
            AntiForgeryToken = _antiforgery.GetAndStoreTokens(HttpContext).RequestToken;

            var packages = await _db.WorkPackages
                .Where(w => w.ProjectId == id)
                .Include(w => w.Assignee)
                .OrderBy(w => w.Position)
                .ThenBy(w => w.Id)
                .ToListAsync();

            Columns = new List<Column>
            {
                new Column { Status = WorkPackageStatus.New, Label = "New" },
                new Column { Status = WorkPackageStatus.InProgress, Label = "In Progress" },
                new Column { Status = WorkPackageStatus.Done, Label = "Done" },
            };
            foreach (var wp in packages)
            {
                Columns.First(c => c.Status == wp.Status).Items.Add(wp);
            }

            return Page();
        }

        public async Task<IActionResult> OnPostMoveAsync(int id, [FromBody] MoveInput input)
        {
            var userId = _userManager.GetUserId(User);
            var membership = await ProjectAccess.GetMembershipAsync(_db, id, userId);
            if (membership == null) return Forbid();

            var wp = await _db.WorkPackages.FirstOrDefaultAsync(w => w.Id == input.Id && w.ProjectId == id);
            if (wp == null) return NotFound();

            var siblings = await _db.WorkPackages
                .Where(w => w.ProjectId == id && w.Status == input.Status && w.Id != input.Id)
                .OrderBy(w => w.Position)
                .ToListAsync();

            var clamped = input.Position < 0 ? 0 : input.Position > siblings.Count ? siblings.Count : input.Position;
            var ordered = new List<WorkPackage>(siblings);
            ordered.Insert(clamped, wp);

            for (var i = 0; i < ordered.Count; i++)
            {
                var current = ordered[i];
                if (current.Id == wp.Id)
                {
                    wp.Status = input.Status;
                    wp.Position = i;
                    wp.UpdatedAt = System.DateTime.UtcNow;
                }
                else if (current.Position != i)
                {
                    current.Position = i;
                }
            }

            await _db.SaveChangesAsync();
            return new JsonResult(new { ok = true });
        }
    }
}
