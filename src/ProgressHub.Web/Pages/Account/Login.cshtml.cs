using System;
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
    public class LoginModel : PageModel
    {
        private readonly SignInManager<ApplicationUser> _signInManager;
        private readonly UserManager<ApplicationUser> _userManager;
        private readonly LdapAuthenticator _ldap;

        public LoginModel(
            SignInManager<ApplicationUser> signInManager,
            UserManager<ApplicationUser> userManager,
            LdapAuthenticator ldap)
        {
            _signInManager = signInManager;
            _userManager = userManager;
            _ldap = ldap;
        }

        [BindProperty]
        public InputModel Input { get; set; }

        public string ReturnUrl { get; set; }
        public bool IsLdapEnabled => _ldap.IsEnabled;

        public class InputModel
        {
            [Required, Display(Name = "Username or email")]
            public string Email { get; set; }

            [Required, DataType(DataType.Password)]
            public string Password { get; set; }

            [Display(Name = "Remember me")]
            public bool RememberMe { get; set; }
        }

        public void OnGet(string returnUrl = null)
        {
            ReturnUrl = returnUrl;
        }

        public async Task<IActionResult> OnPostAsync(string returnUrl = null)
        {
            returnUrl = returnUrl ?? Url.Page("/Projects/Index");
            if (!ModelState.IsValid) return Page();

            if (_ldap.IsEnabled)
            {
                var ldapUser = _ldap.Authenticate(Input.Email, Input.Password);
                if (ldapUser == null)
                {
                    ModelState.AddModelError(string.Empty, "Invalid directory credentials.");
                    return Page();
                }

                var user = await FindOrProvisionLdapUserAsync(ldapUser);
                if (user == null)
                {
                    ModelState.AddModelError(string.Empty, "LDAP authentication succeeded but user provisioning failed.");
                    return Page();
                }

                await _signInManager.SignInAsync(user, Input.RememberMe);
                return LocalRedirect(returnUrl);
            }

            var result = await _signInManager.PasswordSignInAsync(
                Input.Email, Input.Password, Input.RememberMe, lockoutOnFailure: false);

            if (result.Succeeded) return LocalRedirect(returnUrl);

            ModelState.AddModelError(string.Empty, "Invalid email or password.");
            return Page();
        }

        private async Task<ApplicationUser> FindOrProvisionLdapUserAsync(LdapUserInfo ldapUser)
        {
            ApplicationUser user = null;
            if (!string.IsNullOrEmpty(ldapUser.Email))
            {
                user = await _userManager.FindByEmailAsync(ldapUser.Email);
            }
            if (user == null && !string.IsNullOrEmpty(ldapUser.Username))
            {
                user = await _userManager.FindByNameAsync(ldapUser.Username);
            }
            if (user != null)
            {
                if (!string.IsNullOrEmpty(ldapUser.DisplayName) && user.DisplayName != ldapUser.DisplayName)
                {
                    user.DisplayName = ldapUser.DisplayName;
                    await _userManager.UpdateAsync(user);
                }
                return user;
            }

            var userName = !string.IsNullOrEmpty(ldapUser.Username) ? ldapUser.Username : ldapUser.Email;
            var email = !string.IsNullOrEmpty(ldapUser.Email) ? ldapUser.Email : userName;

            user = new ApplicationUser
            {
                UserName = userName,
                Email = email,
                EmailConfirmed = true,
                DisplayName = !string.IsNullOrEmpty(ldapUser.DisplayName) ? ldapUser.DisplayName : userName
            };

            var randomPassword = Guid.NewGuid().ToString("N") + "!Aa1";
            var create = await _userManager.CreateAsync(user, randomPassword);
            if (!create.Succeeded) return null;
            return user;
        }
    }
}
