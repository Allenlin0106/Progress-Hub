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

namespace ProgressHub.Web.Pages.Projects
{
    public class MembersModel : PageModel
    {
        private readonly ApplicationDbContext _db;
        private readonly UserManager<ApplicationUser> _userManager;

        public MembersModel(ApplicationDbContext db, UserManager<ApplicationUser> userManager)
        {
            _db = db;
            _userManager = userManager;
        }

        public Project Project { get; set; }
        public bool IsOwner { get; set; }
        public List<ProjectMember> Members { get; set; } = new List<ProjectMember>();

        [BindProperty]
        public InputModel Input { get; set; }

        public class InputModel
        {
            [Required, EmailAddress]
            public string Email { get; set; }
        }

        private async Task<bool> LoadAsync(int id)
        {
            var userId = _userManager.GetUserId(User);
            var (project, membership) = await ProjectAccess.LoadAsync(_db, id, userId);
            if (project == null) return false;
            if (membership == null) return false;

            Project = project;
            IsOwner = membership.Role == ProjectRole.Owner;
            Members = await _db.ProjectMembers
                .Where(m => m.ProjectId == id)
                .Include(m => m.User)
                .OrderBy(m => m.Id)
                .ToListAsync();
            return true;
        }

        public async Task<IActionResult> OnGetAsync(int id)
        {
            if (!await LoadAsync(id)) return Forbid();
            return Page();
        }

        public async Task<IActionResult> OnPostAddAsync(int id)
        {
            if (!await LoadAsync(id)) return Forbid();
            if (!IsOwner) return Forbid();
            if (!ModelState.IsValid) return Page();

            var user = await _userManager.FindByEmailAsync(Input.Email);
            if (user == null)
            {
                ModelState.AddModelError("Input.Email", "No user with that email is registered.");
                return Page();
            }

            var exists = await _db.ProjectMembers
                .AnyAsync(m => m.ProjectId == id && m.UserId == user.Id);
            if (exists)
            {
                TempData["Error"] = "User is already a member.";
                return RedirectToPage(new { id });
            }

            _db.ProjectMembers.Add(new ProjectMember
            {
                ProjectId = id,
                UserId = user.Id,
                Role = ProjectRole.Member
            });
            await _db.SaveChangesAsync();
            TempData["Status"] = "Member added.";
            return RedirectToPage(new { id });
        }

        public async Task<IActionResult> OnPostRemoveAsync(int id, string userId)
        {
            if (!await LoadAsync(id)) return Forbid();
            if (!IsOwner) return Forbid();

            if (Project.OwnerId == userId)
            {
                TempData["Error"] = "Cannot remove the project owner.";
                return RedirectToPage(new { id });
            }

            var member = await _db.ProjectMembers
                .FirstOrDefaultAsync(m => m.ProjectId == id && m.UserId == userId);
            if (member != null)
            {
                _db.ProjectMembers.Remove(member);
                await _db.SaveChangesAsync();
                TempData["Status"] = "Member removed.";
            }
            return RedirectToPage(new { id });
        }
    }
}
