using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.EntityFrameworkCore;
using Newtonsoft.Json;
using ProgressHub.Web.Data;
using ProgressHub.Web.Models;

namespace ProgressHub.Web.Pages.Projects
{
    public class GanttModel : PageModel
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public GanttModel(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public Project Project { get; set; }
        public bool IsOwner { get; set; }
        public string TasksJson { get; set; } = "[]";

        public async Task<IActionResult> OnGetAsync(int id)
        {
            var userId = _userManager.GetUserId(User);
            var (project, membership) = await ProjectAccess.LoadAsync(_db, id, userId);
            if (project == null) return NotFound();
            if (membership == null) return Forbid();

            Project = project;
            IsOwner = membership.Role == ProjectRole.Owner;

            var packages = await _db.WorkPackages
                .Where(w => w.ProjectId == id && w.StartDate != null && w.DueDate != null)
                .Include(w => w.Assignee)
                .OrderBy(w => w.StartDate)
                .ThenBy(w => w.Id)
                .ToListAsync();

            var tasks = packages.Select(wp => new
            {
                id = wp.Id.ToString(),
                name = wp.Title + (wp.Assignee != null ? " · " + wp.Assignee.DisplayName : ""),
                start = wp.StartDate.Value.ToString("yyyy-MM-dd"),
                end = (wp.DueDate.Value < wp.StartDate.Value ? wp.StartDate.Value : wp.DueDate.Value)
                    .ToString("yyyy-MM-dd"),
                progress = ProgressFor(wp.Status),
                custom_class = "status-" + wp.Status
            }).ToList();

            TasksJson = JsonConvert.SerializeObject(tasks, new JsonSerializerSettings
            {
                StringEscapeHandling = StringEscapeHandling.EscapeHtml
            });
            return Page();
        }

        private static int ProgressFor(WorkPackageStatus status)
        {
            switch (status)
            {
                case WorkPackageStatus.New: return 0;
                case WorkPackageStatus.InProgress: return 50;
                case WorkPackageStatus.Done: return 100;
                default: return 0;
            }
        }
    }
}
