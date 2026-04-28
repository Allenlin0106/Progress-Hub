namespace ProgressHub.Web.Models
{
    public enum ProjectRole
    {
        Owner = 0,
        Member = 1
    }

    public enum WorkPackageStatus
    {
        New = 0,
        InProgress = 1,
        Done = 2
    }

    public enum WorkPackagePriority
    {
        Low = 0,
        Normal = 1,
        High = 2
    }
}
