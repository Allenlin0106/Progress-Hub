using System;
using System.ComponentModel.DataAnnotations;

namespace ProgressHub.Web.Models
{
    public class WorkPackage
    {
        public int Id { get; set; }

        public int ProjectId { get; set; }
        public Project Project { get; set; }

        [Required]
        [StringLength(200)]
        public string Title { get; set; }

        [StringLength(5000)]
        public string Description { get; set; }

        public WorkPackageStatus Status { get; set; } = WorkPackageStatus.New;
        public WorkPackagePriority Priority { get; set; } = WorkPackagePriority.Normal;

        public string AssigneeId { get; set; }
        public ApplicationUser Assignee { get; set; }

        public DateTime? DueDate { get; set; }
        public int Position { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
