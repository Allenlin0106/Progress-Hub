namespace ProgressHub.Web.Services
{
    public class LdapOptions
    {
        public bool Enabled { get; set; }

        public string Server { get; set; }
        public int Port { get; set; } = 389;
        public bool UseSsl { get; set; }
        public int TimeoutMs { get; set; } = 5000;

        public string BaseDn { get; set; }

        /// <summary>
        /// Optional pattern for direct bind (skips search). Example:
        /// "uid={0},ou=users,dc=example,dc=com"
        /// </summary>
        public string UserDnPattern { get; set; }

        /// <summary>
        /// LDAP filter used to search for a user by username or email.
        /// "{0}" is replaced by the escaped login name.
        /// </summary>
        public string SearchFilter { get; set; } = "(|(sAMAccountName={0})(mail={0})(uid={0}))";

        /// <summary>
        /// Optional bind account used for the search. Leave empty for anonymous search.
        /// </summary>
        public string SearchUserDn { get; set; }
        public string SearchUserPassword { get; set; }

        public string UsernameAttribute { get; set; } = "sAMAccountName";
        public string EmailAttribute { get; set; } = "mail";
        public string DisplayNameAttribute { get; set; } = "displayName";
    }

    public class LdapUserInfo
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string DisplayName { get; set; }
    }
}
