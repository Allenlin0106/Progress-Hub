using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ProgressHub.Web.Data;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Pages.Projects
{
    public class DeleteModel : PageModel
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public DeleteModel(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [BindProperty]
        public int Id { get; set; }

        public Project Project { get; set; }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var userId = _userManager.GetUserId(User);
            var (project, membership) = await ProjectAccess.LoadAsync(_db, id, userId);
            if (project == null) return NotFound();
            if (membership == null || membership.Role != ProjectRole.Owner) return Forbid();
            Project = project;
            Id = id;
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var userId = _userManager.GetUserId(User);
            var membership = await ProjectAccess.GetMembershipAsync(_db, Id, userId);
            if (membership == null || membership.Role != ProjectRole.Owner) return Forbid();

            var project = await _db.Projects.FindAsync(Id);
            if (project != null)
            {
                _db.Projects.Remove(project);
                await _db.SaveChangesAsync();
            }

            TempData["Status"] = "Project deleted.";
            return RedirectToPage("./Index");
        }
    }
}
