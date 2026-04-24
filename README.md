# Progress-Hub

A lightweight project management tool inspired by [OpenProject](https://www.openproject.org/). Manage projects, track work packages, and drag tasks across a Kanban board.

Built as an **ASP.NET Core 2.1 Razor Pages** application that opens cleanly in **Visual Studio 2017** (15.9.x).

## Stack

- **Web**: ASP.NET Core 2.1 + Razor Pages
- **Auth**: ASP.NET Core Identity 2.1 (cookie-based) — with optional **LDAP / Active Directory** sign-in (Novell.Directory.Ldap.NETStandard)
- **Data**: Entity Framework Core 2.1 + **SQL Server** (LocalDB by default)
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

- Visual Studio 2017 (15.9.x) with the **ASP.NET and web development** workload
- **.NET Core 2.1 SDK** ([download](https://dotnet.microsoft.com/download/dotnet/2.1))
- **SQL Server LocalDB** (comes with the VS 2017 ASP.NET workload — nothing extra to install)

## Running with Visual Studio 2017

1. Open `ProgressHub.sln` in Visual Studio 2017.
2. (Optional) Confirm the connection string in `src/ProgressHub.Web/appsettings.json`:

   ```
   Server=(localdb)\mssqllocaldb;Database=ProgressHub;Trusted_Connection=True;MultipleActiveResultSets=true
   ```

3. Press **F5** to run. On first launch the app will:
   - create the `ProgressHub` database in LocalDB (`EnsureCreated`)
   - seed the demo user and sample project

4. Sign in with the demo account:
   - Email: `demo@example.com`
   - Password: `demo1234`

### Running from the command line

```
cd src/ProgressHub.Web
dotnet run
```

App listens on `https://localhost:5001` / `http://localhost:5000` by default.

### Using SQL Server in Docker instead of LocalDB

If you are on macOS/Linux or prefer not to use LocalDB, start SQL Server via the provided compose file:

```
docker compose up -d
```

Then update the connection string in `appsettings.json`:

```
Server=localhost,1433;Database=ProgressHub;User Id=sa;Password=Progress!Hub1;TrustServerCertificate=True
```

## Project layout

```
Progress-Hub/
├── ProgressHub.sln
├── docker-compose.yml      # optional: SQL Server 2019 Express (for non-Windows)
└── src/
    └── ProgressHub.Web/
        ├── Data/             # ApplicationDbContext, SeedData, ProjectAccess helpers
        ├── Models/           # ApplicationUser, Project, ProjectMember, WorkPackage, enums
        ├── Services/         # LdapOptions, LdapAuthenticator (optional AD sign-in)
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
        ├── Program.cs
        ├── Startup.cs
        ├── appsettings.json
        └── ProgressHub.Web.csproj
```

## LDAP / Active Directory sign-in

LDAP is **disabled by default**. When enabled the local Identity password flow is bypassed, the `Register` page is locked, and the demo seed account can no longer sign in.

To turn it on, fill in the `Ldap` section of `appsettings.json` (or use user-secrets / env vars):

```json
"Ldap": {
  "Enabled": true,
  "Server": "ldap.example.com",
  "Port": 389,
  "UseSsl": false,
  "BaseDn": "DC=example,DC=com",
  "SearchFilter": "(|(sAMAccountName={0})(mail={0})(uid={0}))",
  "SearchUserDn": "CN=svc-readonly,DC=example,DC=com",
  "SearchUserPassword": "***",
  "UsernameAttribute": "sAMAccountName",
  "EmailAttribute": "mail",
  "DisplayNameAttribute": "displayName"
}
```

Flow:

1. User submits username/email + password to `/Account/Login`.
2. The server opens an LDAP connection to `Server:Port` (optionally `UseSsl`), binds as `SearchUserDn` (or anonymously if empty), and runs `SearchFilter` under `BaseDn` to locate the user's DN. Leaving `UserDnPattern` (e.g. `"uid={0},ou=users,dc=example,dc=com"`) set skips the search and binds directly.
3. A second connection rebinds as the user with their password. If that bind succeeds, the caller is considered authenticated.
4. The app finds or **auto-provisions** a matching `ApplicationUser` (so projects / work packages can still reference them) and issues the normal ASP.NET Core Identity cookie. No LDAP password is ever stored.

Secrets: keep `SearchUserPassword` out of `appsettings.json` in real deployments — use `dotnet user-secrets` in development or environment variables in production (`Ldap__SearchUserPassword=...`).

## Authorization rules

| Action                                    | Who                 |
|-------------------------------------------|---------------------|
| See a project                             | Any project member  |
| Create/move/edit/delete work packages     | Any project member  |
| Edit or delete the project itself         | Project owner only  |
| Add or remove members                     | Project owner only  |

## Reset the database

**LocalDB:** delete the database via SQL Server Object Explorer in VS, or run:

```
sqllocaldb stop MSSQLLocalDB
sqllocaldb delete MSSQLLocalDB
sqllocaldb create MSSQLLocalDB
```

**Docker:**

```
docker compose down -v
```

Restart the app; it will rebuild the schema and re-seed demo data.
