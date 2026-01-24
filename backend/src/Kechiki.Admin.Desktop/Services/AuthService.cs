using System;
using System.Text.Json;
using System.Threading.Tasks;
using Kechiki.Admin.Desktop.Contracts;
using CredentialManagement; // Logic for Windows Cred Man (will implement wrapper or use library if available, actually better to use simple P/Invoke or just File for MVP if lib missing, but User asked for CredMgr)
// Note: Community packages for CredMgr exist, but to avoid extra deps for now I might simulate or use a simple DPAPI wrapper. 
// User said: "Store refresh token using Windows Credential Manager or DPAPI protected storage."
// I will use DPAPI for simplicity without extra NuGet if possible, or just a placeholder implementation that I can refine.
// Actually, I'll use a simple file encrypted with DPAPI.

using System.Security.Cryptography;
using System.Text;
using System.IO;

namespace Kechiki.Admin.Desktop.Services
{
    public interface IAuthService
    {
        bool IsAuthenticated { get; }
        UserProfile? CurrentUser { get; }
        string? AccessToken { get; }
        
        Task<bool> LoginAsync(string email, string password, bool rememberMe);
        Task LogoutAsync();
        Task TryRestoreSessionAsync();
    }

    public class AuthService : IAuthService
    {
        private readonly IAuthApi _api;
        private const string CRED_FILE = "auth_session.dat";
        
        public bool IsAuthenticated => !string.IsNullOrEmpty(AccessToken);
        public UserProfile? CurrentUser { get; private set; }
        public string? AccessToken { get; private set; }
        public string? RefreshToken { get; private set; }

        public AuthService(IAuthApi api)
        {
            _api = api;
        }

        public async Task<bool> LoginAsync(string email, string password, bool rememberMe)
        {
            try
            {
                var response = await _api.LoginAsync(new LoginRequest(email, password));
                await SetSessionAsync(response, rememberMe);
                return true;
            }
            catch (Exception)
            {
                return false;
            }
        }

        public async Task LogoutAsync()
        {
            AccessToken = null;
            RefreshToken = null;
            CurrentUser = null;
            if (File.Exists(GetCredFilePath()))
                File.Delete(GetCredFilePath());
        }

        public async Task TryRestoreSessionAsync()
        {
            try
            {
                var path = GetCredFilePath();
                if (!File.Exists(path)) return;

                var encrypted = await File.ReadAllBytesAsync(path);
                var json = Encoding.UTF8.GetString(ProtectedData.Unprotect(encrypted, null, DataProtectionScope.CurrentUser));
                var session = JsonSerializer.Deserialize<AuthResponse>(json);

                if (session != null)
                {
                    // Optionally validate token or refresh
                    AccessToken = session.AccessToken;
                    RefreshToken = session.RefreshToken;
                    CurrentUser = session.User;
                    
                    // Simple validation: If access token expired, try refresh (omitted for brevity, assume valid or backend 401 will trigger logic later)
                }
            }
            catch
            {
                // Corrupt data or DPAPI failure
                await LogoutAsync();
            }
        }

        private async Task SetSessionAsync(AuthResponse response, bool persist)
        {
            AccessToken = response.AccessToken;
            RefreshToken = response.RefreshToken;
            CurrentUser = response.User;

            if (persist)
            {
                var json = JsonSerializer.Serialize(response);
                var encrypted = ProtectedData.Protect(Encoding.UTF8.GetBytes(json), null, DataProtectionScope.CurrentUser);
                await File.WriteAllBytesAsync(GetCredFilePath(), encrypted);
            }
        }

        private string GetCredFilePath()
        {
            var folder = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "KechikiAdmin");
            Directory.CreateDirectory(folder);
            return Path.Combine(folder, CRED_FILE);
        }
    }
}
