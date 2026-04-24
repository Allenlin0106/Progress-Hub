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

        public Project Project { get; set; }
        public List<ProjectMember> Members { get; set; } = new List<ProjectMember>();

        public class InputModel
        {
            public int Id { get; set; }

            [Required, StringLength(200)]
            public string Title { get; set; }

            [StringLength(5000)]
            public string Description { get; set; }

            public WorkPackageStatus Status { get; set; }
            public WorkPackagePriority Priority { get; set; }

            public string AssigneeId { get; set; }

            [DataType(DataType.Date)]
            public DateTime? StartDate { get; set; }

            [DataType(DataType.Date)]
            public DateTime? DueDate { get; set; }
        }

        private async Task<(WorkPackage wp, bool ok)> LoadAsync(int id)
        {
            var userId = _userManager.GetUserId(User);
            var wp = await _db.WorkPackages
                .Include(w => w.Project)
                .FirstOrDefaultAsync(w => w.Id == id);
            if (wp == null) return (null, false);

            var membership = await ProjectAccess.GetMembershipAsync(_db, wp.ProjectId, userId);
            if (membership == null) return (wp, false);

            Project = wp.Project;
            Members = await _db.ProjectMembers
                .Where(m => m.ProjectId == wp.ProjectId)
                .Include(m => m.User)
                .ToListAsync();
            return (wp, true);
        }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var (wp, ok) = await LoadAsync(id);
            if (wp == null) return NotFound();
            if (!ok) return Forbid();

            Input = new InputModel
            {
                Id = wp.Id,
                Title = wp.Title,
                Description = wp.Description,
                Status = wp.Status,
                Priority = wp.Priority,
                AssigneeId = wp.AssigneeId,
                StartDate = wp.StartDate,
                DueDate = wp.DueDate
            };
            return Page();
        }

        public async Task<IActionResult> OnPostAsync()
        {
            var (wp, ok) = await LoadAsync(Input.Id);
            if (wp == null) return NotFound();
            if (!ok) return Forbid();
            if (!ModelState.IsValid) return Page();

            if (!string.IsNullOrEmpty(Input.AssigneeId) && Members.All(m => m.UserId != Input.AssigneeId))
            {
                ModelState.AddModelError("Input.AssigneeId", "Assignee must be a project member.");
                return Page();
            }

            wp.Title = Input.Title;
            wp.Description = Input.Description;
            wp.Priority = Input.Priority;
            wp.AssigneeId = string.IsNullOrEmpty(Input.AssigneeId) ? null : Input.AssigneeId;
            wp.StartDate = Input.StartDate;
            wp.DueDate = Input.DueDate;
            wp.UpdatedAt = DateTime.UtcNow;

            if (wp.Status != Input.Status)
            {
                var last = await _db.WorkPackages
                    .Where(w => w.ProjectId == wp.ProjectId && w.Status == Input.Status && w.Id != wp.Id)
                    .OrderByDescending(w => w.Position)
                    .FirstOrDefaultAsync();
                wp.Status = Input.Status;
                wp.Position = last == null ? 0 : last.Position + 1;
            }

            await _db.SaveChangesAsync();
            TempData["Status"] = "Work package saved.";
            return RedirectToPage("/Projects/Board", new { id = wp.ProjectId });
        }

        public async Task<IActionResult> OnPostDeleteAsync()
        {
            var (wp, ok) = await LoadAsync(Input.Id);
            if (wp == null) return NotFound();
            if (!ok) return Forbid();

            var projectId = wp.ProjectId;
            _db.WorkPackages.Remove(wp);
            await _db.SaveChangesAsync();
            TempData["Status"] = "Work package deleted.";
            return RedirectToPage("/Projects/Board", new { id = projectId });
        }
    }
}
