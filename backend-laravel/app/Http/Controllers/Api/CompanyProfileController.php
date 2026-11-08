<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Support\ImageHelper;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class CompanyProfileController extends Controller
{
    public function show(Request $request)
    {
        if ($request->user()->role !== 'company') {
            return response()->json(['message' => 'Only companies can manage company profile'], 403);
        }

        $company = $this->companyFor($request);

        if (!$company) {
            return response()->json(['message' => 'Company profile not found'], 404);
        }

        return response()->json($this->payload($company, $request));
    }

    public function update(Request $request)
    {
        if ($request->user()->role !== 'company') {
            return response()->json(['message' => 'Only companies can manage company profile'], 403);
        }

        $company = $this->companyFor($request);

        if (!$company) {
            return response()->json(['message' => 'Company profile not found'], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'industry' => 'nullable|string|max:255',
            'description' => 'nullable|string|max:5000',
            'website' => 'nullable|string|max:255',
            'location' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:30',
            'contact_email' => 'nullable|email|max:255',
            'company_size' => 'nullable|string|max:100',
            'founded_year' => 'nullable|integer|min:1800|max:' . ((int) date('Y') + 1),
            'logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'cover_image' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        $company->fill([
            'name' => $data['name'],
            'industry' => $data['industry'] ?? null,
            'description' => $data['description'] ?? null,
            'website' => $data['website'] ?? null,
            'location' => $data['location'] ?? null,
            'phone' => $data['phone'] ?? null,
            'contact_email' => $data['contact_email'] ?? null,
            'company_size' => $data['company_size'] ?? null,
            'founded_year' => $data['founded_year'] ?? null,
        ]);

        if ($request->hasFile('logo')) {
            $this->replaceFile($company, 'logo_path', $request->file('logo'), 'company-logos');
        }

        if ($request->hasFile('cover_image')) {
            $this->replaceFile($company, 'cover_image', $request->file('cover_image'), 'company-covers');
        }

        $company->save();

        $user = $request->user();
        $user->name = $company->name;
        $user->save();

        return response()->json([
            'message' => 'Company profile updated successfully',
            'company' => $this->payload($company->fresh(), $request),
            'user' => $user,
        ]);
    }

    private function companyFor(Request $request): ?Company
    {
        $user = $request->user();

        if ($user->role !== 'company') {
            return null;
        }

        return $user->company;
    }

    private function replaceFile(Company $company, string $field, $file, string $directory): void
    {
        if ($company->{$field} && !str_starts_with($company->{$field}, 'data:')) {
            Storage::disk('public')->delete($company->{$field});
        }

        try {
            $realPath = $file->getRealPath();
            if ($realPath && file_exists($realPath) && filesize($realPath) <= 4 * 1024 * 1024) {
                $mime = $file->getMimeType() ?: 'image/jpeg';
                $company->{$field} = 'data:' . $mime . ';base64,' . base64_encode(file_get_contents($realPath));
                return;
            }
        } catch (\Throwable $e) {
            // fallback
        }

        $company->{$field} = $file->store($directory, 'public');
    }

    private function payload(Company $company, Request $request): array
    {
        $storageUrl = $request->getSchemeAndHttpHost() . '/storage/';

        return [
            'id' => $company->id,
            'user_id' => $company->user_id,
            'name' => $company->name,
            'industry' => $company->industry,
            'description' => $company->description,
            'website' => $company->website,
            'location' => $company->location,
            'phone' => $company->phone,
            'contact_email' => $company->contact_email,
            'company_size' => $company->company_size,
            'founded_year' => $company->founded_year,
            'logo_path' => $company->logo_path,
            'cover_image' => $company->cover_image,
            'logo_url' => ImageHelper::url($company->logo_path, $storageUrl),
            'cover_image_url' => ImageHelper::url($company->cover_image, $storageUrl),
            'updated_at' => $company->updated_at?->toISOString(),
        ];
    }
}
