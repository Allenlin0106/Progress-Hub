using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using ProgressHub.Web.Data;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Pages.Projects.WorkPackages
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

        public Project Project { get; set; }
        public List<ProjectMember> Members { get; set; } = new List<ProjectMember>();

        public class InputModel
        {
            [Required, StringLength(200)]
            public string Title { get; set; }

            [StringLength(5000)]
            public string Description { get; set; }

            public WorkPackageStatus Status { get; set; } = WorkPackageStatus.New;
            public WorkPackagePriority Priority { get; set; } = WorkPackagePriority.Normal;

            public string AssigneeId { get; set; }

            [DataType(DataType.Date)]
            public DateTime? DueDate { get; set; }
        }

        private async Task<bool> LoadAsync(int projectId)
        {
            var userId = _userManager.GetUserId(User);
            var (project, membership) = await ProjectAccess.LoadAsync(_db, projectId, userId);
            if (project == null || membership == null) return false;
            Project = project;
            Members = await _db.ProjectMembers
                .Where(m => m.ProjectId == projectId)
                .Include(m => m.User)
                .ToListAsync();
            return true;
        }

        public async Task<IActionResult> OnGetAsync(int projectId)
        {
            if (!await LoadAsync(projectId)) return Forbid();
            Input = new InputModel();
            return Page();
        }

        public async Task<IActionResult> OnPostAsync(int projectId)
        {
            if (!await LoadAsync(projectId)) return Forbid();
            if (!ModelState.IsValid) return Page();

            if (!string.IsNullOrEmpty(Input.AssigneeId) && Members.All(m => m.UserId != Input.AssigneeId))
            {
                ModelState.AddModelError("Input.AssigneeId", "Assignee must be a project member.");
                return Page();
            }

            var last = await _db.WorkPackages
                .Where(w => w.ProjectId == projectId && w.Status == Input.Status)
                .OrderByDescending(w => w.Position)
                .FirstOrDefaultAsync();

            var wp = new WorkPackage
            {
                ProjectId = projectId,
                Title = Input.Title,
                Description = Input.Description,
                Status = Input.Status,
                Priority = Input.Priority,
                AssigneeId = string.IsNullOrEmpty(Input.AssigneeId) ? null : Input.AssigneeId,
                DueDate = Input.DueDate,
                Position = last == null ? 0 : last.Position + 1
            };
            _db.WorkPackages.Add(wp);
            await _db.SaveChangesAsync();

            TempData["Status"] = "Work package created.";
            return RedirectToPage("/Projects/Board", new { id = projectId });
        }
    }
}
