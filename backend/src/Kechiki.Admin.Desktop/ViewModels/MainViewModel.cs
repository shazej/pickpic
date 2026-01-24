using CommunityToolkit.Mvvm.ComponentModel;
using CommunityToolkit.Mvvm.Input;
using Kechiki.Admin.Desktop.Services;
using System.Threading.Tasks;

namespace Kechiki.Admin.Desktop.ViewModels
{
    public partial class MainViewModel : ObservableObject
    {
        private readonly IAuthService _authService;

        [ObservableProperty]
        private string startMessage = "Welcome to Kechiki Admin";

        [ObservableProperty]
        private string currentUserDisplay;

        public MainViewModel(IAuthService authService)
        {
            _authService = authService;
            CurrentUserDisplay = _authService.CurrentUser?.Name ?? "Admin";
        }

        [RelayCommand]
        private async Task Logout()
        {
            await _authService.LogoutAsync();
            // In a real app, restart or show login. 
            // Application.Current.Shutdown(); 
            // Or use Messenger to request restart.
            System.Windows.Application.Current.Shutdown();
        }
    }
}
