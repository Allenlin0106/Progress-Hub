using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ProgressHub.Web.Data;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Pages.Projects
{
    public class CreateModel : PageModel
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public CreateModel(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        [BindProperty]
        public InputModel Input { get; set; }

        public class InputModel
        {
            [Required, StringLength(120)]
            public string Name { get; set; }

            [StringLength(2000)]
            public string Description { get; set; }
        }

        public void OnGet() { }

        public async Task<IActionResult> OnPostAsync()
        {
            if (!ModelState.IsValid) return Page();
            var userId = _userManager.GetUserId(User);

            var project = new Project
            {
                Name = Input.Name,
                Description = Input.Description,
                OwnerId = userId
            };
            project.Members.Add(new ProjectMember { UserId = userId, Role = ProjectRole.Owner });

            _db.Projects.Add(project);
            await _db.SaveChangesAsync();

            TempData["Status"] = "Project created.";
            return RedirectToPage("./Board", new { id = project.Id });
        }
    }
}
