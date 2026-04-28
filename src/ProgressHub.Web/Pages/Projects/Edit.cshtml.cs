using System;
using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ProgressHub.Web.Data;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Pages.Projects
{
    public class EditModel : PageModel
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public EditModel(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [BindProperty]
        public InputModel Input { get; set; }

        public class InputModel
        {
            public int Id { get; set; }

            [Required, StringLength(120)]
            public string Name { get; set; }

            [StringLength(2000)]
            public string Description { get; set; }
        }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var userId = _userManager.GetUserId(User);
            var (project, membership) = await ProjectAccess.LoadAsync(_db, id, userId);
            if (project == null) return NotFound();
            if (membership == null || membership.Role != ProjectRole.Owner) return Forbid();

            Input = new InputModel
            {
                Id = project.Id,
                Name = project.Name,
                Description = project.Description
            };
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid) return Page();
            var userId = _userManager.GetUserId(User);
            var membership = await ProjectAccess.GetMembershipAsync(_db, Input.Id, userId);
            if (membership == null || membership.Role != ProjectRole.Owner) return Forbid();

            var project = await _db.Projects.FindAsync(Input.Id);
            if (project == null) return NotFound();

            project.Name = Input.Name;
            project.Description = Input.Description;
            project.UpdatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();

            TempData["Status"] = "Project updated.";
            return RedirectToPage("./Board", new { id = project.Id });
        }
    }
}
