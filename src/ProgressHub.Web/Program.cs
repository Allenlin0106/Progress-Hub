using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ProgressHub.Web.Data;
using ProgressHub.Web.Models;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services
    .AddDefaultIdentity<ApplicationUser>(options =>
    {
        options.Password.RequiredLength = 6;
        options.Password.RequireNonAlphanumeric = false;
        options.Password.RequireUppercase = false;
        options.Password.RequireDigit = false;
        options.SignIn.RequireConfirmedAccount = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.LoginPath = "/Account/Login";
    options.LogoutPath = "/Account/Logout";
    options.AccessDeniedPath = "/Account/Login";
});

builder.Services
    .AddRazorPages(options =>
    {
        options.Conventions.AuthorizeFolder("/Projects");
        options.Conventions.AllowAnonymousToPage("/Index");
        options.Conventions.AllowAnonymousToFolder("/Account");
    })
    .AddJsonOptions(json =>
    {
        json.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<ApplicationDbContext>();
        db.Database.EnsureCreated();

        // EnsureCreated is a no-op when the .db file already exists, so a stale
        // file from an older build of the project (or a half-built one) leaves
        // Identity / Project tables missing. Detect that and rebuild from
        // scratch so first-time-after-upgrade just works.
        if (!await SchemaIsHealthyAsync(db))
        {
            logger.LogWarning("Stale or incomplete progress-hub.db detected; rebuilding schema from the model.");
            db.Database.EnsureDeleted();
            db.Database.EnsureCreated();
        }

        await SeedData.EnsureSeededAsync(services);
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database creation or seeding failed.");
    }
}

app.Run();

static async Task<bool> SchemaIsHealthyAsync(ApplicationDbContext db)
{
    var conn = db.Database.GetDbConnection();
    if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
    using var cmd = conn.CreateCommand();
    cmd.CommandText =
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name IN ('AspNetUsers','Projects','WorkPackages','ProjectMembers')";
    var count = Convert.ToInt32(await cmd.ExecuteScalarAsync());
    return count == 4;
}
