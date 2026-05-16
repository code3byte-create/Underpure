<?php

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../helpers/CloudinaryHelper.php';

class ImageUploadController {
    
    public static function upload($pdo) {
        try {
            // Check if file is present
            if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
                http_response_code(400);
                return json_encode([
                    'success' => false,
                    'error' => 'No file provided or upload error'
                ]);
            }

            $file = $_FILES['file'];
            $allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
            
            // Validate file type
            if (!in_array($file['type'], $allowedTypes)) {
                http_response_code(400);
                return json_encode([
                    'success' => false,
                    'error' => 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF'
                ]);
            }

            // Validate file size (max 5MB)
            if ($file['size'] > 5 * 1024 * 1024) {
                http_response_code(400);
                return json_encode([
                    'success' => false,
                    'error' => 'File size exceeds 5MB limit'
                ]);
            }

            // Get folder from query param (default: 'testimonials')
            $folder = $_GET['folder'] ?? 'testimonials';
            
            // Read file and convert to base64
            $fileContent = file_get_contents($file['tmp_name']);
            $base64String = 'data:' . $file['type'] . ';base64,' . base64_encode($fileContent);

            // Upload to Cloudinary
            $uploadedUrl = CloudinaryHelper::uploadImageBase64($base64String, $folder);

            if (!$uploadedUrl) {
                http_response_code(500);
                return json_encode([
                    'success' => false,
                    'error' => 'Failed to upload to Cloudinary'
                ]);
            }

            http_response_code(200);
            return json_encode([
                'success' => true,
                'url' => $uploadedUrl
            ]);

        } catch (Exception $e) {
            http_response_code(500);
            return json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
    }
}
