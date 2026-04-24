using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ProgressHub.Web.Models
{
    public class Project
    {
        public int Id { get; set; }

        [Required]
        [StringLength(120)]
        public string Name { get; set; }

        [StringLength(2000)]
        public string Description { get; set; }

        [Required]
        public string OwnerId { get; set; }
        public ApplicationUser Owner { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

        public ICollection<ProjectMember> Members { get; set; } = new List<ProjectMember>();
        public ICollection<WorkPackage> WorkPackages { get; set; } = new List<WorkPackage>();
    }
}
