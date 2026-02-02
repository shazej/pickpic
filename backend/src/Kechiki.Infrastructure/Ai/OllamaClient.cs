using System.Net.Http.Json;
using System.Text.Json.Serialization;

namespace Kechiki.Infrastructure.Ai;

public interface IOllamaClient
{
    Task<string> GenerateAsync(string prompt, CancellationToken ct);
}

public class OllamaClient(HttpClient httpClient) : IOllamaClient
{
    public async Task<string> GenerateAsync(string prompt, CancellationToken ct)
    {
        var request = new { model = "llama3", prompt = prompt, stream = false };
        var response = await httpClient.PostAsJsonAsync("/api/generate", request, ct);
        
        if (!response.IsSuccessStatusCode) return "AI currently unavailable.";
        
        var result = await response.Content.ReadFromJsonAsync<OllamaResponse>(ct);
        return result?.Response ?? "";
    }
}

public class OllamaResponse
{
    [JsonPropertyName("response")]
    public string Response { get; set; } = string.Empty;
}
