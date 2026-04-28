using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Identity;

namespace ProgressHub.Web.Models
{
    public class ApplicationUser : IdentityUser
    {
        [Required]
        [StringLength(80)]
        public string DisplayName { get; set; }

        public ICollection<ProjectMember> Memberships { get; set; } = new List<ProjectMember>();
        public ICollection<Project> OwnedProjects { get; set; } = new List<Project>();
        public ICollection<WorkPackage> AssignedWorkPackages { get; set; } = new List<WorkPackage>();
    }
}
