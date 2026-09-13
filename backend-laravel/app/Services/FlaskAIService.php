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
     * Analyze resume against job description and required skills (Semantic + Skill Match).
     */
    public function analyzeResume(string $resumePath, string $jobDescription, string $requiredSkills): array
    {
        try {
            $disk = Storage::disk('public');
            if (!$disk->exists($resumePath)) {
                Log::warning("Resume file not found at path: {$resumePath}");
                return ['error' => 'Resume file not found'];
            }

            $fileContents = $disk->get($resumePath);

            $response = Http::timeout(45)->attach(
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
     * Ingest a candidate resume PDF into ChromaDB Vector Store for RAG.
     */
    public function ingestResume(string $resumePath, string $resumeId): array
    {
        try {
            $disk = Storage::disk('public');
            if (!$disk->exists($resumePath)) {
                Log::warning("Resume file not found for RAG ingestion: {$resumePath}");
                return ['error' => 'Resume file not found'];
            }

            $fileContents = $disk->get($resumePath);

            $response = Http::timeout(120)->attach(
                'resume',
                $fileContents,
                basename($resumePath)
            )->post($this->baseUrl . '/rag/ingest', [
                'resume_id' => $resumeId,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Flask RAG Ingestion error: ' . $response->body());
            return ['error' => 'RAG ingestion failed'];

        } catch (\Exception $e) {
            Log::error('Flask RAG Ingestion connection error: ' . $e->getMessage());
            return ['error' => 'Could not connect to AI service'];
        }
    }

    /**
     * Ask an AI question against a candidate's indexed resume via RAG.
     */
    public function askResume(string $question, ?string $resumeId = null, int $topK = 3): array
    {
        try {
            $payload = [
                'question' => $question,
                'top_k' => $topK,
            ];

            if ($resumeId !== null) {
                $payload['resume_id'] = $resumeId;
            }

            $response = Http::timeout(120)->post($this->baseUrl . '/rag/ask', $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('Flask RAG Ask error: ' . $response->body());
            return ['error' => 'RAG query failed'];

        } catch (\Exception $e) {
            Log::error('Flask RAG connection error: ' . $e->getMessage());
            return ['error' => 'Could not connect to AI service'];
        }
    }

    /**
     * Retrieve the health status of ChromaDB and local AI models.
     */
    public function getRagStatus(): array
    {
        try {
            $response = Http::timeout(15)->get($this->baseUrl . '/rag/health');
            if ($response->successful()) {
                return $response->json();
            }
            return ['error' => 'AI RAG service health check failed'];
        } catch (\Exception $e) {
            return ['error' => 'Could not connect to AI RAG service'];
        }
    }

    /**
     * Generate quiz questions through the Flask AI service.
     */
    public function generateQuiz(string $category, int $count = 5, ?string $jobTitle = null, ?string $requiredSkills = null): array
    {
        try {
            $response = Http::timeout(120)->post($this->baseUrl . '/generate-quiz', [
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
