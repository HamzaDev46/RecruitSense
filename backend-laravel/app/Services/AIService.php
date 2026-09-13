<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class AIService
{
    protected string $baseUrl;

    public function __construct()
    {
        $this->baseUrl = config('services.ai.url', config('services.flask.url', 'http://127.0.0.1:5000'));
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

            Log::error('FastAPI AI service error: ' . $response->body());
            return ['error' => 'AI service failed'];

        } catch (\Exception $e) {
            Log::error('FastAPI AI connection error: ' . $e->getMessage());
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
                Log::warning("Resume file not found for ingestion at path: {$resumePath}");
                return ['error' => 'Resume file not found'];
            }

            $fileContents = $disk->get($resumePath);

            $response = Http::timeout(45)->attach(
                'resume',
                $fileContents,
                'resume.pdf'
            )->post($this->baseUrl . '/rag/ingest', [
                'resume_id' => $resumeId,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('FastAPI RAG Ingestion error: ' . $response->body());
            return ['error' => 'RAG ingestion failed'];

        } catch (\Exception $e) {
            Log::error('FastAPI RAG Ingestion connection error: ' . $e->getMessage());
            return ['error' => 'Could not connect to AI service for ingestion'];
        }
    }

    /**
     * Ask a question about a candidate resume using RAG (Retrieval-Augmented Generation).
     */
    public function askResume(string $question, string $resumeId): array
    {
        try {
            $response = Http::timeout(60)->post($this->baseUrl . '/rag/query', [
                'question' => $question,
                'resume_id' => $resumeId,
            ]);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('FastAPI RAG Query error: ' . $response->body());
            return ['error' => 'RAG query failed', 'answer' => 'Unable to retrieve answer from AI service.'];

        } catch (\Exception $e) {
            Log::error('FastAPI RAG connection error: ' . $e->getMessage());
            return ['error' => 'Could not connect to AI service for RAG query', 'answer' => 'Connection to AI service failed.'];
        }
    }

    /**
     * Generate quiz questions through the FastAPI AI service.
     */
    public function generateQuiz(string $category, int $count = 5, ?string $jobTitle = null, ?string $requiredSkills = null): array
    {
        try {
            $payload = [
                'category' => $category,
                'count' => $count,
            ];

            if ($jobTitle) {
                $payload['job_title'] = $jobTitle;
            }
            if ($requiredSkills) {
                $payload['required_skills'] = $requiredSkills;
            }

            $response = Http::timeout(30)->post($this->baseUrl . '/generate-quiz', $payload);

            if ($response->successful()) {
                return $response->json();
            }

            Log::error('FastAPI quiz generation error: ' . $response->body());
            return ['error' => 'Quiz generation failed'];

        } catch (\Exception $e) {
            Log::error('FastAPI quiz generation connection error: ' . $e->getMessage());
            return ['error' => 'Could not connect to AI service for quiz generation'];
        }
    }
}
