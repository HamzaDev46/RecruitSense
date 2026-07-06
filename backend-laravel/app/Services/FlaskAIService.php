<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class FlaskAIService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.flask.url', 'http://127.0.0.1:5000');
    }

    /**
     * Analyze resume against job description and required skills
     */
    public function analyzeResume(string $resumePath, string $jobDescription, string $requiredSkills): array
    {
        try {
            $response = Http::attach(
                'resume',
                file_get_contents(storage_path('app/public/' . $resumePath)),
                'resume.pdf'
            )->post($this->baseUrl . '/analyze-resume', [
                'job_description' => $jobDescription,
                'required_skills' => $requiredSkills,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Flask API error: ' . $response->body());
            return ['error' => 'AI service failed'];

        } catch (\Exception $e) {
            Log::error('Flask connection error: ' . $e->getMessage());
            return ['error' => 'Could not connect to AI service'];
        }
    }
}