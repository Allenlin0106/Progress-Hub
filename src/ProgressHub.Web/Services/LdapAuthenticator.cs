using System;
using System.Linq;
using System.Text;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Novell.Directory.Ldap;

namespace ProgressHub.Web.Services
{
    public class LdapAuthenticator
    {
        private readonly LdapOptions _options;
        private readonly ILogger<LdapAuthenticator> _logger;

        public LdapAuthenticator(IOptions<LdapOptions> options, ILogger<LdapAuthenticator> logger)
        {
            _options = options.Value;
            _logger = logger;
        }

        public bool IsEnabled =>
            _options != null && _options.Enabled && !string.IsNullOrEmpty(_options.Server);

        public LdapUserInfo Authenticate(string usernameOrEmail, string password)
        {
            if (!IsEnabled) return null;
            if (string.IsNullOrEmpty(usernameOrEmail) || string.IsNullOrEmpty(password)) return null;

            string userDn = null;
            LdapEntry userEntry = null;

            try
            {
                using (var conn = new LdapConnection())
                {
                    conn.SecureSocketLayer = _options.UseSsl;
                    conn.ConnectionTimeout = _options.TimeoutMs;
                    conn.Connect(_options.Server, _options.Port);

                    if (!string.IsNullOrEmpty(_options.UserDnPattern))
                    {
                        userDn = _options.UserDnPattern.Replace("{0}", usernameOrEmail);
                    }
                    else
                    {
                        if (!string.IsNullOrEmpty(_options.SearchUserDn))
                        {
                            conn.Bind(_options.SearchUserDn, _options.SearchUserPassword);
                        }

                        var filter = _options.SearchFilter.Replace("{0}", LdapEscape(usernameOrEmail));
                        var attrs = new[]
                        {
                            _options.UsernameAttribute,
                            _options.EmailAttribute,
                            _options.DisplayNameAttribute
                        }
                        .Where(a => !string.IsNullOrEmpty(a))
                        .Distinct()
                        .ToArray();

                        var results = conn.Search(
                            _options.BaseDn,
                            LdapConnection.ScopeSub,
                            filter,
                            attrs,
                            false);

                        if (!results.HasMore())
                        {
                            return null;
                        }
                        userEntry = results.Next();
                        userDn = userEntry.Dn;
                    }
                }

                using (var userConn = new LdapConnection())
                {
                    userConn.SecureSocketLayer = _options.UseSsl;
                    userConn.ConnectionTimeout = _options.TimeoutMs;
                    userConn.Connect(_options.Server, _options.Port);

                    try
                    {
                        userConn.Bind(userDn, password);
                    }
                    catch (LdapException bindEx)
                    {
                        _logger.LogInformation("LDAP bind failed for {User}: {Message}", usernameOrEmail, bindEx.Message);
                        return null;
                    }

                    if (userEntry == null && !string.IsNullOrEmpty(_options.BaseDn))
                    {
                        try
                        {
                            var filter = _options.SearchFilter.Replace("{0}", LdapEscape(usernameOrEmail));
                            var attrs = new[]
                            {
                                _options.UsernameAttribute,
                                _options.EmailAttribute,
                                _options.DisplayNameAttribute
                            }
                            .Where(a => !string.IsNullOrEmpty(a))
                            .Distinct()
                            .ToArray();

                            var r = userConn.Search(_options.BaseDn, LdapConnection.ScopeSub, filter, attrs, false);
                            if (r.HasMore()) userEntry = r.Next();
                        }
                        catch (LdapException)
                        {
                            // directory didn't let us read attributes; proceed with fallbacks
                        }
                    }
                }

                return new LdapUserInfo
                {
                    Username = GetAttr(userEntry, _options.UsernameAttribute) ?? usernameOrEmail,
                    Email = GetAttr(userEntry, _options.EmailAttribute)
                            ?? (usernameOrEmail.Contains("@") ? usernameOrEmail : null),
                    DisplayName = GetAttr(userEntry, _options.DisplayNameAttribute) ?? usernameOrEmail
                };
            }
            catch (LdapException ex)
            {
                _logger.LogWarning(ex, "LDAP directory error during authentication");
                return null;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during LDAP authentication");
                return null;
            }
        }

        private static string GetAttr(LdapEntry entry, string name)
        {
            if (entry == null || string.IsNullOrEmpty(name)) return null;
            try
            {
                var a = entry.GetAttribute(name);
                return string.IsNullOrEmpty(a?.StringValue) ? null : a.StringValue;
            }
            catch
            {
                return null;
            }
        }

        private static string LdapEscape(string input)
        {
            if (string.IsNullOrEmpty(input)) return string.Empty;
            var sb = new StringBuilder(input.Length);
            foreach (var c in input)
            {
                switch (c)
                {
                    case '\\': sb.Append("\\5c"); break;
                    case '*': sb.Append("\\2a"); break;
                    case '(': sb.Append("\\28"); break;
                    case ')': sb.Append("\\29"); break;
                    case '\0': sb.Append("\\00"); break;
                    default: sb.Append(c); break;
                }
            }
            return sb.ToString();
        }
    }
}
