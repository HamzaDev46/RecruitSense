<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

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
            $disk = \Illuminate\Support\Facades\Storage::disk('public');
            if (!$disk->exists($resumePath)) {
                Log::warning("Resume file not found at path: {$resumePath}");
                return ['error' => 'Resume file not found'];
            }

            $fileContents = $disk->get($resumePath);

            $response = Http::timeout(30)->attach(
                'resume',
                $fileContents,
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

    /**
     * Generate quiz questions through the Flask AI service.
     */
    public function generateQuiz(string $category, int $count = 5, ?string $jobTitle = null, ?string $requiredSkills = null): array
    {
        try {
            $response = Http::timeout(45)->post($this->baseUrl . '/generate-quiz', [
                'category' => $category,
                'count' => $count,
                'job_title' => $jobTitle,
                'required_skills' => $requiredSkills,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Flask quiz generation error: ' . $response->body());
            return ['error' => 'AI quiz generation failed'];

        } catch (\Exception $e) {
            Log::error('Flask quiz generation connection error: ' . $e->getMessage());
            return ['error' => 'Could not connect to AI service'];
        }
    }
}
