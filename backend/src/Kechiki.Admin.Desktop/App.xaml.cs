using System.IO;
using System.Net.Http;
using System.Windows;
using CommunityToolkit.Mvvm.DependencyInjection; // Deprecated in newer versions, use standard IServiceProvider
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Kechiki.Admin.Desktop.Services;
using Kechiki.Admin.Desktop.ViewModels;
using Kechiki.Admin.Desktop.Views;
using Kechiki.Admin.Desktop.Contracts;
using Refit;
using System;
using System.Net.Http.Headers;

namespace Kechiki.Admin.Desktop
{
    public partial class App : Application
    {
        public static IHost? AppHost { get; private set; }

        public App()
        {
            AppHost = Host.CreateDefaultBuilder()
                .ConfigureServices((hostContext, services) =>
                {
                    // Configuration
                    services.AddSingleton<IAuthService, AuthService>();
                    
                    // ViewModels
                    services.AddTransient<LoginViewModel>();
                    services.AddTransient<MainViewModel>();
                    
                    // Views
                    services.AddTransient<MainWindow>();
                    services.AddTransient<LoginWindow>();

                    // API Clients
                    // Base Address from User Request
                    var apiBaseUrl = "https://ecom.lumen-path.com"; 

                    services.AddRefitClient<IAuthApi>()
                        .ConfigureHttpClient(c => c.BaseAddress = new Uri(apiBaseUrl));

                    // Add Authorization Header Handler (Pending implementation, sticking to basic for now)
                })
                .Build();
        }

        protected override async void OnStartup(StartupEventArgs e)
        {
            await AppHost!.StartAsync();

            var authService = AppHost.Services.GetRequiredService<IAuthService>();
            await authService.TryRestoreSessionAsync();

            if (authService.IsAuthenticated)
            {
                var mainWindow = AppHost.Services.GetRequiredService<MainWindow>();
                mainWindow.DataContext = AppHost.Services.GetRequiredService<MainViewModel>();
                mainWindow.Show();
            }
            else
            {
                ShowLogin();
            }

            base.OnStartup(e);
        }

        private void ShowLogin()
        {
            var loginWindow = AppHost.Services.GetRequiredService<LoginWindow>();
            var vm = AppHost.Services.GetRequiredService<LoginViewModel>();
            
            vm.RequestClose += () =>
            {
                loginWindow.Close();
                var mainWindow = AppHost.Services.GetRequiredService<MainWindow>();
                mainWindow.DataContext = AppHost.Services.GetRequiredService<MainViewModel>();
                mainWindow.Show();
            };

            loginWindow.DataContext = vm;
            loginWindow.Show();
        }

        protected override async void OnExit(ExitEventArgs e)
        {
            await AppHost!.StopAsync();
            base.OnExit(e);
        }
    }
}
