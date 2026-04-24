namespace ProgressHub.Web.Models
{
    public class ProjectMember
    {
        public int Id { get; set; }

        public int ProjectId { get; set; }
        public Project Project { get; set; }

        public string UserId { get; set; }
        public ApplicationUser User { get; set; }

        public ProjectRole Role { get; set; } = ProjectRole.Member;
    }
}
