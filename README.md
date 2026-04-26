# Progress-Hub

A lightweight project management tool inspired by [OpenProject](https://www.openproject.org/). Manage projects, track work packages, and drag tasks across a Kanban board.

Built as an **ASP.NET Core 10 (LTS) Razor Pages** application that opens cleanly in **Visual Studio 2022 (17.14+)**.

## Stack

- **Web**: ASP.NET Core 10 + Razor Pages (Minimal Hosting)
- **Auth**: ASP.NET Core Identity 10 (cookie-based)
- **Data**: Entity Framework Core 10 + **SQLite** (file-based, zero-install)
- **Client**: hand-rolled CSS + [SortableJS](https://github.com/SortableJS/Sortable) + [Frappe Gantt](https://frappe.io/gantt) (CDN)

## Features

- Register / sign in / sign out
- Create, edit, delete projects
- Invite members by email, assign tasks to them
- Work packages with title, description, status, priority, assignee, start date, due date
- Kanban board (New / In Progress / Done) with drag-and-drop persistence
- Gantt timeline view (Frappe Gantt) with Day / Week / Month view modes
- Owner-only actions for project edit/delete and member management

## Prerequisites

- Visual Studio 2022 **17.14** or newer with the **ASP.NET and web development** workload
- **.NET 10 SDK** (10.0.7 or newer — [download](https://dotnet.microsoft.com/download/dotnet/10.0))

That's it — no database server to install. SQLite runs in-process and the data lives in a single `progress-hub.db` file next to the app.

## Running with Visual Studio 2022

1. Open `ProgressHub.sln` in Visual Studio 2022 (17.14+).
2. Press **F5**. On first launch the app will:
   - create `progress-hub.db` in the project's content root (`EnsureCreated`)
   - seed the demo user and sample project
3. Sign in with the demo account:
   - Email: `demo@example.com`
   - Password: `demo1234`

### Running from the command line

```
cd src/ProgressHub.Web
dotnet run
```

Listens on `https://localhost:5001` / `http://localhost:5000` by default.

### Choosing where the `.db` file lives

`appsettings.json` sets:

```
"DefaultConnection": "Data Source=progress-hub.db"
```

The path is relative to the app's content root. Use an absolute path (e.g. `Data Source=C:\data\progress-hub.db`) if you want to keep the file outside the project folder.

## Project layout

```
Progress-Hub/
├── ProgressHub.sln
└── src/
    └── ProgressHub.Web/
        ├── Data/             # ApplicationDbContext, SeedData, ProjectAccess helpers
        ├── Models/           # ApplicationUser, Project, ProjectMember, WorkPackage, enums
        ├── Pages/
        │   ├── Account/      # Login, Register, Logout
        │   ├── Projects/     # Index, Create, Edit, Delete, Board (Kanban), Gantt, Members
        │   │   └── WorkPackages/   # Create, Edit (delete via handler)
        │   ├── Shared/       # _Layout, _ValidationScriptsPartial
        │   └── Index.cshtml  # Landing
        ├── wwwroot/
        │   ├── css/site.css
        │   ├── js/kanban.js  # SortableJS wiring → POST /Projects/Board?handler=Move
        │   └── js/gantt.js   # Frappe Gantt initialisation + view-mode switcher
        ├── Program.cs        # Minimal Hosting (replaces Startup.cs)
        ├── appsettings.json
        └── ProgressHub.Web.csproj
```

## Authorization rules

| Action                                    | Who                 |
|-------------------------------------------|---------------------|
| See a project                             | Any project member  |
| Create/move/edit/delete work packages     | Any project member  |
| Edit or delete the project itself         | Project owner only  |
| Add or remove members                     | Project owner only  |

## Reset the database

Stop the app and delete the SQLite files:

```
del src\ProgressHub.Web\progress-hub.db*
```

(or via File Explorer — remove `progress-hub.db`, plus `.db-shm` and `.db-wal` if present). Restart the app; it will rebuild the schema and re-seed demo data.

## Upgrading from a previous .NET Core 2.1 build

If you have an old `progress-hub.db` from the .NET Core 2.1 version of this project, the app will automatically detect it on first launch (Identity / Projects tables missing or incomplete) and rebuild the schema from scratch — you'll see a warning in the log:

```
Stale or incomplete progress-hub.db detected; rebuilding schema from the model.
```

If you'd rather wipe it manually, just delete `src\ProgressHub.Web\progress-hub.db*` before pressing F5.

## Notes on the .NET 10 upgrade

- `Startup.cs` was merged into `Program.cs` using the Minimal Hosting model (`WebApplication.CreateBuilder`).
- `UseMvc()` was replaced with endpoint routing (`UseRouting` + `UseAuthentication` + `UseAuthorization` + `MapRazorPages`).
- The Kanban move endpoint accepts string-form `WorkPackageStatus` values; a global `JsonStringEnumConverter` is registered via `AddRazorPages().AddJsonOptions(...)`.
- The Gantt page now serializes timeline data with `System.Text.Json` (`JavaScriptEncoder.UnsafeRelaxedJsonEscaping`) and HTML-escapes `</` before embedding into the inline `<script>` tag.
- Schema is provisioned with `EnsureCreated()` plus a self-heal that drops and recreates the database when the four expected tables (`AspNetUsers`, `Projects`, `ProjectMembers`, `WorkPackages`) aren't all present. Switch to `Database.Migrate()` after running `dotnet ef migrations add Initial` if you need real schema evolution.
