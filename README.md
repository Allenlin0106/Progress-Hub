# Progress-Hub

A lightweight project management tool inspired by [OpenProject](https://www.openproject.org/). Manage projects, track work packages, and drag tasks across a Kanban board.

Built as an **ASP.NET Core 2.2 Razor Pages** application so it opens cleanly in **Visual Studio 2017** (the last VS version to officially support .NET Core 2.2).

## Stack

- **Web**: ASP.NET Core 2.2 + Razor Pages
- **Auth**: ASP.NET Core Identity (cookie-based)
- **Data**: Entity Framework Core 2.2 + Npgsql (PostgreSQL)
- **Client**: Bootstrap-free hand-rolled CSS + [SortableJS](https://github.com/SortableJS/Sortable) (CDN) for Kanban drag-and-drop

## Features

- Register / sign in / sign out
- Create, edit, delete projects
- Invite members by email, assign tasks to them
- Work packages with title, description, status, priority, assignee, due date
- Kanban board (New / In Progress / Done) with drag-and-drop persistence
- Owner-only actions for project edit/delete and member management

## Prerequisites

- Visual Studio 2017 (15.9.x) with the **ASP.NET and web development** workload
- **.NET Core 2.2 SDK** ([download](https://dotnet.microsoft.com/download/dotnet/2.2))
- PostgreSQL 12+ (Docker Desktop recommended)

## Running with Visual Studio 2017

1. Start PostgreSQL:

   ```
   docker compose up -d
   ```

   (or install Postgres locally and create database `progress_hub` with user `progress` / password `progress`)

2. Open `ProgressHub.sln` in Visual Studio 2017.
3. Confirm the connection string in `src/ProgressHub.Web/appsettings.json` matches your Postgres instance.
4. Press **F5** to run. On first launch the app will:
   - create the database schema (`EnsureCreated`)
   - seed the demo user and sample project
5. Sign in with the demo account:
   - Email: `demo@example.com`
   - Password: `demo1234`

### Running from the command line

```
cd src/ProgressHub.Web
dotnet run
```

App listens on `https://localhost:5001` / `http://localhost:5000` by default.

## Project layout

```
Progress-Hub/
├── ProgressHub.sln
├── docker-compose.yml
└── src/
    └── ProgressHub.Web/
        ├── Data/             # ApplicationDbContext, SeedData, ProjectAccess helpers
        ├── Models/           # ApplicationUser, Project, ProjectMember, WorkPackage, enums
        ├── Pages/
        │   ├── Account/      # Login, Register, Logout
        │   ├── Projects/     # Index, Create, Edit, Delete, Board (Kanban), Members
        │   │   └── WorkPackages/   # Create, Edit (delete via handler)
        │   ├── Shared/       # _Layout, _ValidationScriptsPartial
        │   └── Index.cshtml  # Landing
        ├── wwwroot/
        │   ├── css/site.css
        │   └── js/kanban.js  # SortableJS wiring → POST /Projects/Board?handler=Move
        ├── Program.cs
        ├── Startup.cs
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

```
docker compose down -v
```

Restart the app; it will rebuild the schema and re-seed demo data.
