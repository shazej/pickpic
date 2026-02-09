using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Kechiki.Admin.Desktop.Services;
using System.Threading.Tasks;
using System.Windows;

namespace Kechiki.Admin.Desktop.ViewModels
{
    public partial class LoginViewModel : ObservableObject
    {
        private readonly IAuthService _authService;

        [ObservableProperty]
        private string email;

        [ObservableProperty]
        private string password;

        [ObservableProperty]
        private bool rememberMe;

        [ObservableProperty]
        private bool isBusy;

        [ObservableProperty]
        private string errorMessage;

        public LoginViewModel(IAuthService authService)
        {
            _authService = authService;
        }

        [RelayCommand]
        private async Task Login()
        {
            if (IsBusy) return;

            IsBusy = true;
            ErrorMessage = string.Empty;

            var success = await _authService.LoginAsync(Email, Password, RememberMe);
            IsBusy = false;

            if (success)
            {
                // Navigate to Main Window
                // For MVP, we'll just close this window and let App.xaml.cs handle it, 
                // or we can use a Messenger to notify successful login.
                // Or simpler: RequestClose?.Invoke();
                RequestClose?.Invoke();
            }
            else
            {
                ErrorMessage = "Invalid email or password.";
            }
        }

        public System.Action RequestClose { get; set; }
    }
}
