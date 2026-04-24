using System.ComponentModel.DataAnnotations;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using ProgressHub.Web.Models;
using ProgressHub.Web.Services;

namespace ProgressHub.Web.Pages.Account
{
    [AllowAnonymous]
    public class RegisterModel : PageModel
    {
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly LdapAuthenticator _ldap;

        public RegisterModel(
            UserManager<ApplicationUser> userManager,
            SignInManager<ApplicationUser> signInManager,
            LdapAuthenticator ldap)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _ldap = ldap;
        }

        [BindProperty]
        public InputModel Input { get; set; }

        public bool IsLdapEnabled => _ldap.IsEnabled;

        public class InputModel
        {
            [Required, StringLength(80), Display(Name = "Display name")]
            public string DisplayName { get; set; }

            [Required, EmailAddress]
            public string Email { get; set; }

            [Required, StringLength(100, MinimumLength = 6)]
            [DataType(DataType.Password)]
            public string Password { get; set; }
        }

        public IActionResult OnGet() => Page();

        public async Task<IActionResult> OnPostAsync()
        {
            if (_ldap.IsEnabled)
            {
                return RedirectToPage("/Account/Login");
            }
            if (!ModelState.IsValid) return Page();

            var user = new ApplicationUser
            {
                UserName = Input.Email,
                Email = Input.Email,
                DisplayName = Input.DisplayName,
                EmailConfirmed = true
            };

            var result = await _userManager.CreateAsync(user, Input.Password);
            if (result.Succeeded)
            {
                await _signInManager.SignInAsync(user, isPersistent: false);
                return RedirectToPage("/Projects/Index");
            }

            foreach (var err in result.Errors)
            {
                ModelState.AddModelError(string.Empty, err.Description);
            }
            return Page();
        }
    }
}
